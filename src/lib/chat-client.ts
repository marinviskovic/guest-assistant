import type { ChatEvent, ChatTurn } from "../../server/assistant";
import type { BookingRequest } from "../../server/tools";

export type { BookingRequest, ChatEvent };

export type Message = {
  id: string;
  role: "user" | "assistant";
  text: string;
  booking?: BookingRequest;
  notice?: string;
  activity?: string;
  pending?: boolean;
};

export const ACTIVITY: Record<string, string> = {
  check_availability: "Checking the calendar",
  prepare_booking_request: "Preparing your request",
};

/**
 * The model only sees text turns. A failed answer drops out together with the
 * question that caused it, and a booking card is summarised so the next turn knows it exists.
 */
export function toTurns(messages: Message[]): ChatTurn[] {
  const turns: ChatTurn[] = [];
  messages.forEach((message, index) => {
    if (message.role === "user") {
      const reply = messages[index + 1];
      const isLast = index === messages.length - 1;
      if (isLast || (reply && replyText(reply))) turns.push({ role: "user", content: message.text });
    } else {
      const text = replyText(message);
      if (text) turns.push({ role: "assistant", content: text.slice(0, 4000) });
    }
  });
  return turns;
}

function replyText(message: Message) {
  const card = message.booking
    ? `\n\n[A booking request card was shown: ${message.booking.apartmentName}, ${message.booking.checkIn} to ${message.booking.checkOut}, ${message.booking.guests} guests, total €${message.booking.price.total}.]`
    : "";
  return (message.text.trim() + card).trim();
}

/** POST the transcript and hand each streamed event to `onEvent`. Returns an error message when the request itself fails. */
export async function streamChat(
  turns: ChatTurn[],
  onEvent: (event: ChatEvent) => void,
  signal: AbortSignal,
): Promise<string | null> {
  const response = await fetch("/api/chat", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages: turns }),
    signal,
  });
  if (!response.ok || !response.body) {
    const body = await response.json().catch(() => null);
    return body?.error ?? "Something went wrong. Please try again.";
  }
  const reader = response.body.pipeThrough(new TextDecoderStream()).getReader();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += value;
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) if (line.trim()) onEvent(JSON.parse(line) as ChatEvent);
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer) as ChatEvent);
  return null;
}
