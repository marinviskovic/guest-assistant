import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowUp, RotateCcw, Square } from "lucide-react";
import { RULES } from "../data/property";
import { ACTIVITY, streamChat, toTurns, type Message } from "../lib/chat-client";
import { BookingCard } from "./BookingCard";
import { LanternMark } from "./LanternMark";
import { RichText } from "./RichText";

const STORAGE_KEY = "sea-lantern-chat-v1";
const MAX_CHARS = 600;

export const ASK_EVENT = "assistant:ask";

/** Lets any button on the page put a question in the chat box. */
export function askAssistant(question: string) {
  window.dispatchEvent(new CustomEvent(ASK_EVENT, { detail: question }));
}

function load(): Message[] {
  try {
    const saved = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function save(messages: Message[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages.filter((message) => !message.pending)));
  } catch {
    // Private windows can refuse storage; the chat still works without it.
  }
}

function suggestions(now = new Date()) {
  const year = now.getMonth() >= 6 ? now.getFullYear() + 1 : now.getFullYear();
  return [
    "Is parking included?",
    `Is Apartment Mare free 10 to 17 July ${year} for 4 of us?`,
    "Can we bring our dog?",
    "Wann ist der Check-in?",
    "Koliko je daleko plaža?",
  ];
}

const newId = () => Math.random().toString(36).slice(2);

export function Assistant() {
  const [messages, setMessages] = useState<Message[]>(load);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const guestMessages = messages.filter((message) => message.role === "user").length;
  const full = guestMessages >= RULES.maxGuestMessages;

  useEffect(() => save(messages), [messages]);

  useEffect(() => {
    const list = listRef.current;
    if (!list) return;
    const nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 160;
    if (nearBottom || messages.at(-1)?.role === "user" || messages.at(-1)?.pending) {
      list.scrollTop = list.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    const onAsk = (event: Event) => {
      setInput((event as CustomEvent<string>).detail);
      document.getElementById("ask")?.scrollIntoView({ behavior: "smooth", block: "start" });
      setTimeout(() => inputRef.current?.focus({ preventScroll: true }), 350);
    };
    window.addEventListener(ASK_EVENT, onAsk);
    return () => window.removeEventListener(ASK_EVENT, onAsk);
  }, []);

  useEffect(() => {
    const box = inputRef.current;
    if (!box) return;
    box.style.height = "auto";
    box.style.height = `${Math.min(box.scrollHeight, 140)}px`;
  }, [input]);

  async function send(raw: string) {
    const text = raw.trim();
    if (!text || busy || full) return;
    const question: Message = { id: newId(), role: "user", text };
    const reply: Message = { id: newId(), role: "assistant", text: "", pending: true };
    const history = [...messages, question];
    setMessages([...history, reply]);
    setInput("");
    setBusy(true);
    setAnnouncement("");

    const controller = new AbortController();
    abortRef.current = controller;
    let current = reply;
    const update = (change: (message: Message) => Message) => {
      current = change(current);
      const latest = current;
      setMessages((list) => list.map((message) => (message.id === reply.id ? latest : message)));
    };

    try {
      const error = await streamChat(
        toTurns(history),
        (event) => {
          if (event.type === "text") update((m) => ({ ...m, text: m.text + event.text, activity: undefined }));
          else if (event.type === "tool_start") update((m) => ({ ...m, text: "", activity: ACTIVITY[event.name] }));
          else if (event.type === "booking") update((m) => ({ ...m, booking: event.request }));
          else if (event.type === "notice") {
            update((m) => ({ ...m, notice: event.message, text: event.code === "refusal" ? "" : m.text }));
          }
        },
        controller.signal,
      );
      if (error) update((m) => ({ ...m, notice: error }));
    } catch {
      update((m) =>
        controller.signal.aborted
          ? { ...m, notice: m.text ? undefined : "Stopped." }
          : { ...m, notice: "The connection dropped. Please try again." },
      );
    } finally {
      update((m) => ({ ...m, pending: false, activity: undefined }));
      setAnnouncement(current.notice || current.text);
      setBusy(false);
      abortRef.current = null;
    }
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    void send(input);
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      void send(input);
    }
  }

  function reset() {
    abortRef.current?.abort();
    setMessages([]);
    setInput("");
    inputRef.current?.focus();
  }

  return (
    <div className="flex h-[min(78svh,640px)] min-h-[460px] flex-col overflow-hidden rounded-[28px] border border-line bg-paper shadow-[0_24px_60px_-30px_rgba(15,47,60,0.35)]">
      <header className="flex items-center gap-3 border-b border-line px-4 py-3 sm:px-5">
        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-sea-deep text-limestone">
          <LanternMark className="size-6" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-medium leading-tight">Guest assistant</p>
          <p className="flex items-center gap-1.5 text-xs text-ink-soft">
            <span className="size-1.5 rounded-full bg-emerald-600" aria-hidden="true" />
            Replies in any language, any hour
          </p>
        </div>
        {messages.length > 0 && (
          <button
            type="button"
            onClick={reset}
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full px-3 text-sm text-ink-soft transition-colors hover:bg-limestone hover:text-ink"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            <span className="sr-only sm:not-sr-only">New chat</span>
          </button>
        )}
      </header>

      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-5 sm:px-5" data-testid="messages">
        <div className="max-w-[88%] rounded-2xl rounded-tl-md bg-limestone px-4 py-3 text-[15px] leading-relaxed">
          Hi! I'm the guest assistant for Sea Lantern Apartments. Ask me about check-in, parking, the beach or free dates, in any
          language. When you're ready, I'll prepare your booking request for the host.
        </div>

        {guestMessages === 0 && (
          <div className="flex flex-wrap gap-2" aria-label="Example questions">
            {suggestions().map((question) => (
              <button
                key={question}
                type="button"
                onClick={() => void send(question)}
                className="min-h-10 rounded-full border border-line bg-paper px-3.5 py-2 text-left text-sm leading-snug text-sea transition-colors hover:border-sea hover:bg-sea-mist/50"
              >
                {question}
              </button>
            ))}
          </div>
        )}

        {messages.map((message) =>
          message.role === "user" ? (
            <div key={message.id} className="flex justify-end">
              <p className="max-w-[85%] rounded-2xl rounded-tr-md bg-sea px-4 py-2.5 text-[15px] leading-relaxed whitespace-pre-wrap text-white">
                {message.text}
              </p>
            </div>
          ) : (
            <div key={message.id} className="max-w-[92%]" data-testid="reply">
              {(message.text || message.pending) && (
                <div className="rounded-2xl rounded-tl-md bg-limestone px-4 py-3 text-[15px] leading-relaxed">
                  {message.text ? (
                    <RichText text={message.text} />
                  ) : message.activity ? (
                    <p className="text-ink-soft">{message.activity}…</p>
                  ) : (
                    <span className="typing inline-flex gap-1 py-1.5" aria-label="Assistant is typing">
                      <span /> <span /> <span />
                    </span>
                  )}
                </div>
              )}
              {message.booking && <BookingCard request={message.booking} />}
              {message.notice && (
                <p className="mt-2 rounded-xl border border-lantern/40 bg-lantern-glow/40 px-3 py-2 text-sm text-ink" role="status">
                  {message.notice}
                </p>
              )}
            </div>
          ),
        )}
      </div>

      <p className="sr-only" aria-live="polite">
        {announcement}
      </p>

      <form onSubmit={onSubmit} className="border-t border-line p-3 sm:p-4">
        {full ? (
          <p className="px-1 py-2 text-sm text-ink-soft">
            This demo keeps chats short.{" "}
            <button type="button" onClick={reset} className="font-medium text-sea underline underline-offset-2">
              Start a new chat
            </button>{" "}
            to keep going.
          </p>
        ) : (
          <div className="flex items-end gap-2 rounded-2xl border border-line bg-limestone/60 py-1.5 pr-1.5 pl-4 focus-within:border-sea">
            <label htmlFor="question" className="sr-only">
              Your question
            </label>
            <textarea
              id="question"
              ref={inputRef}
              rows={1}
              value={input}
              maxLength={MAX_CHARS}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder="Ask about your stay…"
              className="max-h-[140px] min-h-10 flex-1 resize-none bg-transparent py-2 text-[16px] leading-6 outline-none placeholder:text-ink-soft/70"
            />
            {busy ? (
              <button
                type="button"
                onClick={() => abortRef.current?.abort()}
                aria-label="Stop the answer"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-ink text-white"
              >
                <Square className="size-3.5" fill="currentColor" aria-hidden="true" />
              </button>
            ) : (
              <button
                type="submit"
                disabled={!input.trim()}
                aria-label="Send"
                className="grid size-10 shrink-0 place-items-center rounded-full bg-lantern text-sea-deep transition-opacity disabled:opacity-40"
              >
                <ArrowUp className="size-5" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        <p className="mt-2 px-1 text-xs leading-relaxed text-ink-soft">
          Answers come from Claude, an AI model, using only the host's house information. Check important details with the host.
          {input.length > MAX_CHARS - 100 && <span className="tabular"> {MAX_CHARS - input.length} characters left.</span>}
        </p>
      </form>
    </div>
  );
}
