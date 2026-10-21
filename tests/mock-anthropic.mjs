import { createServer } from "node:http";
import { checkStay } from "../src/lib/booking.js";

/**
 * A stand-in for the Messages API that speaks the same streaming format, so the
 * whole path (SDK, tool loop, NDJSON, chat widget) runs in tests without a key.
 * It answers a few scripted questions and records every request it receives.
 */

export const requests = [];

function sse(events) {
  return events.map((event) => `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`).join("");
}

function message(blocks, stopReason) {
  const events = [
    {
      type: "message_start",
      message: {
        id: `msg_${requests.length}`,
        type: "message",
        role: "assistant",
        model: "claude-opus-5-5",
        content: [],
        stop_reason: null,
        stop_sequence: null,
        usage: { input_tokens: 1200, output_tokens: 1, cache_read_input_tokens: 3000, cache_creation_input_tokens: 0 },
      },
    },
  ];
  blocks.forEach((block, index) => {
    if (block.type === "text") {
      events.push({ type: "content_block_start", index, content_block: { type: "text", text: "" } });
      for (const piece of block.text.match(/.{1,12}/gs)) {
        events.push({ type: "content_block_delta", index, delta: { type: "text_delta", text: piece } });
      }
    } else {
      events.push({ type: "content_block_start", index, content_block: { type: "tool_use", id: `toolu_${requests.length}_${index}`, name: block.name, input: {} } });
      events.push({ type: "content_block_delta", index, delta: { type: "input_json_delta", partial_json: JSON.stringify(block.input) } });
    }
    events.push({ type: "content_block_stop", index });
  });
  events.push({ type: "message_delta", delta: { stop_reason: stopReason, stop_sequence: null }, usage: { output_tokens: 40 } });
  events.push({ type: "message_stop" });
  return sse(events);
}

const euro = (value) => `€${value.toFixed(2)}`;

/** A Mare stay that really is free in the generated calendar, so the scripted booking goes through. */
function freeMareStay() {
  for (let day = 1; day <= 25; day++) {
    const checkIn = `2027-06-${String(day).padStart(2, "0")}`;
    const checkOut = `2027-06-${String(day + 4).padStart(2, "0")}`;
    const query = { apartment: "mare", checkIn, checkOut, guests: 4, childrenUnder12: 0, pet: false };
    if (checkStay(query, "2026-10-21").available) return { check_in: checkIn, check_out: checkOut };
  }
  throw new Error("no free stay in June 2027");
}

function reply(body) {
  const last = body.messages.at(-1);
  const toolResult = Array.isArray(last.content) && last.content.find((block) => block.type === "tool_result");
  if (toolResult) {
    const output = JSON.parse(toolResult.content);
    if (output.ready) {
      return message([{ type: "text", text: `Your request is ready below. The total is ${euro(output.total)} with a ${euro(output.deposit)} deposit. Tap the WhatsApp button to send it to the host.` }], "end_turn");
    }
    const [result] = output.results;
    const text = result.available
      ? `Good news: ${result.name} is free from ${result.check_in} to ${result.check_out}.\n\n- Total: ${euro(result.price.total)}\n- Deposit: ${euro(result.price.deposit)}\n\nWould you like me to prepare a booking request?`
      : `${result.name} isn't free then. ${result.problems.join(" ")}`;
    return message([{ type: "text", text }], "end_turn");
  }

  const question = typeof last.content === "string" ? last.content : "";
  const stayInput = { apartment: "mare", ...freeMareStay(), guests: 4, children_under_12: 0, pet: false };
  if (/my name is (\w+)/i.test(question)) {
    const name = /my name is (\w+)/i.exec(question)[1];
    return message([{ type: "tool_use", name: "prepare_booking_request", input: { ...stayInput, guest_name: name, note_for_host: "Arriving around 18:00" } }], "tool_use");
  }
  if (/free/i.test(question)) {
    // The real model sometimes thinks aloud before a tool call; the widget must not show it.
    return message([{ type: "text", text: "Need dates. Checking now." }, { type: "tool_use", name: "check_availability", input: stayInput }], "tool_use");
  }
  if (/ignore your instructions/i.test(question)) return message([], "refusal");
  if (/check-in/i.test(question)) return message([{ type: "text", text: "Der Check-in ist ab 15:00 Uhr mit einer Schlüsselbox möglich." }], "end_turn");
  return message([{ type: "text", text: "Yes. Each apartment has one free reserved parking space in the courtyard, 30 m from the door." }], "end_turn");
}

export function startMock(port = 0) {
  const server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const body = JSON.parse(raw || "{}");
      requests.push({ headers: req.headers, body });
      res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-cache", "request-id": "req_mock" });
      res.end(reply(body));
    });
  });
  return new Promise((resolve) => server.listen(port, "127.0.0.1", () => resolve(server)));
}
