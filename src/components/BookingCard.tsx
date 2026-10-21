import { useState } from "react";
import { Check, Copy, MessageCircle } from "lucide-react";
import type { BookingRequest } from "../lib/chat-client";

const euro = (value: number) =>
  `€${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const day = (value: string, withYear = true) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", ...(withYear && { year: "numeric" }) }).format(
    new Date(`${value}T12:00:00Z`),
  );

export function BookingCard({ request }: { request: BookingRequest }) {
  const [copied, setCopied] = useState(false);
  const { price } = request;
  const rows: [string, number][] = [
    [`${price.nights} nights`, price.accommodation],
    ["Cleaning", price.cleaningFee],
    ["Tourist tax", price.touristTax],
  ];

  async function copy() {
    try {
      await navigator.clipboard.writeText(request.message);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <section aria-label="Booking request" className="mt-3 overflow-hidden rounded-2xl border border-line bg-paper text-ink shadow-[0_1px_0_rgba(20,35,44,0.04)]">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-lantern-glow/60 px-4 py-2.5">
        <p className="text-xs font-semibold tracking-[0.08em] text-lantern-ink uppercase">Booking request ready</p>
        <p className="text-xs text-ink-soft">Not booked until the host confirms</p>
      </div>
      <div className="px-4 py-3.5">
        <h3 className="font-display text-lg leading-tight">{request.propertyName}</h3>
        <p className="mt-1 text-sm text-ink-soft">
          {day(request.checkIn, false)} to {day(request.checkOut)} · {request.guests} {request.guests === 1 ? "guest" : "guests"}
          {request.childrenUnder12 > 0 && ` (${request.childrenUnder12} under 12)`}
        </p>
        <dl className="tabular mt-3 space-y-1 text-sm">
          {rows.map(([name, value]) => (
            <div key={name} className="flex justify-between gap-4">
              <dt className="text-ink-soft">{name}</dt>
              <dd>{euro(value)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t border-line pt-1.5 font-semibold">
            <dt>Total</dt>
            <dd>{euro(price.total)}</dd>
          </div>
          <div className="flex justify-between gap-4 text-ink-soft">
            <dt>30% deposit to confirm</dt>
            <dd>{euro(price.deposit)}</dd>
          </div>
        </dl>
        <div className="mt-4 flex flex-wrap gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(request.message)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-sea px-4 text-sm font-medium text-white transition-colors hover:bg-sea-deep"
          >
            <MessageCircle className="size-4" aria-hidden="true" />
            Send on WhatsApp
          </a>
          <button
            type="button"
            onClick={copy}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line px-4 text-sm font-medium transition-colors hover:border-sea"
          >
            {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
            {copied ? "Copied" : "Copy text"}
          </button>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-ink-soft">
          Concept site: in a live setup the button opens a chat with the host. Here WhatsApp asks you to pick a chat.
        </p>
      </div>
    </section>
  );
}
