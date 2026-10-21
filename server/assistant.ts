import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { PROPERTY, RULES } from "../src/data/property.js";
import { todayIn } from "../src/lib/booking.js";
import { INSTRUCTIONS, todayLine } from "./prompt.js";
import { TOOLS, runTool, type BookingRequest } from "./tools.js";

export const MODEL = process.env.CLAUDE_MODEL || "claude-opus-5-5";
const MAX_TOOL_ROUNDS = 4;

export const LIMITS = {
  guestMessages: RULES.maxGuestMessages,
  guestChars: 600,
  assistantChars: 4000,
};

export type ChatTurn = { role: "user" | "assistant"; content: string };

/** One line of the NDJSON stream the chat widget reads. */
export type ChatEvent =
  | { type: "text"; text: string }
  | { type: "tool_start"; name: string }
  | { type: "tool_done"; name: string; input: unknown; output: unknown }
  | { type: "booking"; request: BookingRequest }
  | { type: "notice"; code: "refusal" | "busy" | "offline" | "error" | "limit"; message: string }
  | { type: "done" };

const ChatRequest = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1) }))
    .min(1)
    .max(LIMITS.guestMessages * 4),
});

/** The browser keeps the transcript as plain text turns; check its shape before it reaches the model. */
export function parseChatRequest(body: unknown): { turns: ChatTurn[] } | { error: string; limit?: boolean } {
  const parsed = ChatRequest.safeParse(body);
  if (!parsed.success) return { error: "Invalid request." };
  const turns = parsed.data.messages;
  const ordered = turns.every((turn, index) => turn.role === (index % 2 === 0 ? "user" : "assistant"));
  if (!ordered || turns.at(-1)!.role !== "user") return { error: "Invalid request." };
  const tooLong = turns.some((turn) => turn.content.length > (turn.role === "user" ? LIMITS.guestChars : LIMITS.assistantChars));
  if (tooLong) return { error: `Messages can be up to ${LIMITS.guestChars} characters.` };
  if (turns.filter((turn) => turn.role === "user").length > LIMITS.guestMessages) {
    return { error: "This chat is full. Start a new chat to keep going.", limit: true };
  }
  return { turns };
}

const TOOL_STATUS_SAFE = new Set(TOOLS.map((tool) => tool.name));

/**
 * After a mid-answer fallback the history can only carry the text before the
 * switch, so earlier thinking and tool calls are left out when it is echoed back.
 */
function echoable(content: Anthropic.Beta.BetaContentBlock[]): Anthropic.Beta.BetaContentBlockParam[] {
  const boundary = content.findLastIndex((block) => block.type === "fallback");
  return content.filter(
    (block, index) =>
      index > boundary || !["thinking", "redacted_thinking", "tool_use", "fallback"].includes(block.type),
  ) as Anthropic.Beta.BetaContentBlockParam[];
}

export async function* runAssistant(
  client: Anthropic,
  turns: ChatTurn[],
  options: { now?: Date; signal?: AbortSignal } = {},
): AsyncGenerator<ChatEvent> {
  const today = todayIn(PROPERTY.timeZone, options.now);
  const messages: Anthropic.Beta.BetaMessageParam[] = turns.map((turn) => ({ role: turn.role, content: turn.content }));
  let wroteText = false;

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const stream = client.beta.messages.stream(
      {
        model: MODEL,
        max_tokens: 4096,
        betas: ["server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low" },
        tools: TOOLS,
        system: [
          { type: "text", text: INSTRUCTIONS, cache_control: { type: "ephemeral" } },
          { type: "text", text: todayLine(today) },
        ],
        messages,
      },
      { signal: options.signal },
    );

    let startedText = false;
    for await (const event of stream) {
      if (event.type === "content_block_start" && event.content_block.type === "tool_use") {
        if (TOOL_STATUS_SAFE.has(event.content_block.name)) yield { type: "tool_start", name: event.content_block.name };
      } else if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        if (!startedText && wroteText) yield { type: "text", text: "\n\n" };
        startedText = true;
        yield { type: "text", text: event.delta.text };
      }
    }
    const message = await stream.finalMessage();
    wroteText ||= startedText;
    console.log(
      JSON.stringify({
        event: "usage",
        model: message.model,
        stop: message.stop_reason,
        input: message.usage.input_tokens,
        output: message.usage.output_tokens,
        cacheRead: message.usage.cache_read_input_tokens,
        cacheWrite: message.usage.cache_creation_input_tokens,
      }),
    );

    if (message.stop_reason === "refusal") {
      yield {
        type: "notice",
        code: "refusal",
        message: "I can't help with that one. Ask me anything about your stay, or message the host on WhatsApp.",
      };
      return;
    }
    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: echoable(message.content) });
      continue;
    }

    const content = echoable(message.content);
    const toolCalls = content.filter((block): block is Anthropic.Beta.BetaToolUseBlockParam => block.type === "tool_use");
    if (message.stop_reason !== "tool_use" || toolCalls.length === 0) return;

    messages.push({ role: "assistant", content });
    const results: Anthropic.Beta.BetaToolResultBlockParam[] = [];
    for (const call of toolCalls) {
      const outcome = runTool(call.name, call.input, today);
      yield { type: "tool_done", name: call.name, input: call.input, output: outcome.output };
      if (outcome.booking) yield { type: "booking", request: outcome.booking };
      results.push({
        type: "tool_result",
        tool_use_id: call.id,
        is_error: outcome.isError,
        content: JSON.stringify(outcome.output),
      });
    }
    messages.push({ role: "user", content: results });
  }

  yield { type: "notice", code: "error", message: "Sorry, that took too many steps. Please ask again in a simpler way." };
}

/** Turns an API failure into a message a guest can act on, without leaking details. */
export function noticeFor(error: unknown): ChatEvent {
  if (error instanceof Anthropic.AuthenticationError || error instanceof Anthropic.PermissionDeniedError) {
    return { type: "notice", code: "offline", message: "The assistant is offline right now. Please message the host on WhatsApp." };
  }
  if (
    error instanceof Anthropic.RateLimitError ||
    error instanceof Anthropic.InternalServerError ||
    error instanceof Anthropic.APIConnectionError
  ) {
    return { type: "notice", code: "busy", message: "The assistant is busy right now. Please try again in a minute." };
  }
  return { type: "notice", code: "error", message: "Something went wrong. Please try again." };
}
