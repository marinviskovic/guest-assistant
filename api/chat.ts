import Anthropic from "@anthropic-ai/sdk";
import { noticeFor, parseChatRequest, runAssistant, type ChatEvent } from "../server/assistant.js";

/**
 * POST /api/chat streams the assistant's answer as NDJSON, one ChatEvent per line.
 * The hard spending cap is the monthly limit set on the Anthropic API key; the
 * checks here keep a single visitor or script from using it up.
 */

const WINDOW_MS = 10 * 60_000;
const REQUESTS_PER_WINDOW = 30;
const MAX_BODY_BYTES = 40_000;

// Per instance, so it is a speed bump rather than a guarantee.
const recent = new Map<string, number[]>();

function allow(ip: string, now = Date.now()) {
  const hits = (recent.get(ip) ?? []).filter((time) => now - time < WINDOW_MS);
  if (hits.length >= REQUESTS_PER_WINDOW) return false;
  hits.push(now);
  recent.set(ip, hits);
  if (recent.size > 5_000) recent.delete(recent.keys().next().value!);
  return true;
}

const json = (status: number, error: string) =>
  Response.json({ error }, { status, headers: { "cache-control": "no-store" } });

let client: Anthropic | null = null;

export async function POST(request: Request): Promise<Response> {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== new URL(request.url).host) return json(403, "Forbidden.");

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "local";
  if (!allow(ip)) return json(429, "Too many messages. Please wait a few minutes.");

  const length = Number(request.headers.get("content-length") ?? 0);
  if (length > MAX_BODY_BYTES) return json(413, "This chat is too long. Start a new chat.");

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json(400, "Invalid request.");
  }
  const parsed = parseChatRequest(body);
  if ("error" in parsed) return json(parsed.limit ? 409 : 400, parsed.error);

  const encoder = new TextEncoder();
  const abort = new AbortController();
  request.signal?.addEventListener("abort", () => abort.abort());

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: ChatEvent) => {
        if (!abort.signal.aborted) controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`));
      };
      try {
        if (!process.env.ANTHROPIC_API_KEY) {
          send({ type: "notice", code: "offline", message: "The assistant is offline right now. Please message the host on WhatsApp." });
        } else {
          client ??= new Anthropic({ maxRetries: 1, timeout: 60_000 });
          for await (const event of runAssistant(client, parsed.turns, { signal: abort.signal })) send(event);
        }
      } catch (error) {
        if (!abort.signal.aborted) {
          console.error(JSON.stringify({ event: "error", status: error instanceof Anthropic.APIError ? error.status : null, name: (error as Error)?.name }));
          send(noticeFor(error));
        }
      }
      send({ type: "done" });
      if (!abort.signal.aborted) controller.close();
    },
    cancel() {
      abort.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "content-type": "application/x-ndjson; charset=utf-8",
      "cache-control": "no-store",
      "x-accel-buffering": "no",
    },
  });
}
