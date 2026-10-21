# Sea Lantern, an AI guest assistant for a holiday villa (concept)

**Live:** https://sea-lantern-rovinj.vercel.app

A website for a holiday villa with a pool near Rovinj, Croatia, with a chat assistant that answers guests the way the
host would: check-in times, the pool and hot tub, the nearest beach, pets, free dates and prices. It answers in the
guest's language and, when they are ready, prepares a booking request they send to the host on WhatsApp.

Sea Lantern is a portfolio concept. The villa's photos are used with the owner's permission; its name, location, host
and prices are invented, and the site says so.

## What the assistant does

- **Answers only from the host's information.** Everything it knows is in `src/data/property.ts`. When something
  isn't there (a sauna, an EV charger, a restaurant tip), it says so and points the guest to the host instead of
  making it up.
- **Checks dates and prices with a tool, never by itself.** `check_availability` runs `src/lib/booking.ts` against
  the calendar: seasons, minimum stays, the 8-guest limit, the cleaning fee, tourist tax and the 30% deposit.
  If the dates are taken, it offers the nearest free ones.
- **Replies in the guest's language.** German, Italian, Croatian, French or anything else, with no setting to pick.
- **Prepares the booking request.** Once it has the dates, the number of guests and children, and a first name, it
  calls `prepare_booking_request`. The guest gets a card with the price breakdown and a "Send on WhatsApp" button. It
  never asks for a phone number, an email address or card details.
- **Stays on task.** It won't write code, change the rules, promise discounts or hand out the Wi-Fi password or the
  key box code, whatever a message tells it to do.

## How it works

```
browser  ──POST /api/chat──▶  api/chat.ts (Vercel function)  ──▶  Claude (Anthropic API)
   ▲                               │   ▲                               │
   └──── streamed NDJSON ◀─────────┘   └── tool results ◀── server/tools.ts ◀── tool calls
```

- `api/chat.ts` checks the request (same origin, size, a per-address rate limit, at most 12 guest messages per chat),
  then streams the answer back line by line so the reply appears as it is written.
- `server/assistant.ts` runs the tool loop with the Anthropic TypeScript SDK. The house information and the tool
  definitions form a fixed prompt that is cached between requests; only "today's date" comes after the cache point.
- `server/tools.ts` validates every tool input with zod before running it, so a malformed call becomes an error the
  model can correct, not a wrong price.
- The calendar is generated from a seed per year (busier in July and August, let by the week), so the demo always has
  realistic free and booked nights without a database.
- The API key lives only in the Vercel function's environment. The browser bundle contains no SDK, prompt or key.

## Results on the live site

- `npm run eval`: 30/30 graded questions pass on https://sea-lantern-rovinj.vercel.app (run on 21 October 2026).
  The first run scored 29/30. The one miss was a check that didn't accept "aren't", and reading every reply showed
  one where the model's note to itself appeared before a calendar check. Both are fixed: the widget now drops text
  written before a tool call.
- Lighthouse, mobile: performance 99, accessibility 100, best practices 100, SEO 100 (median of 3 runs). Desktop: 100
  in every category.

## Tests

```bash
npm test             # 15 unit and API tests: prices, rules, the tool loop, streaming, limits
npm run test:e2e     # 5 browser checks with Playwright: chat, booking card, German answer, phone layout
npm run eval -- https://your-site.vercel.app   # 30 graded questions against the real model
```

`npm test` and `npm run test:e2e` run against a local stand-in for the Messages API (`tests/mock-anthropic.mjs`),
so they need no key and cost nothing.

`npm run eval` asks the live site 30 questions a guest might ask and grades each reply with plain checks: the
right facts, "I don't know" where the host wrote nothing, the right language, the calendar tool for dates, the exact
total from the calendar, no leaked instructions and a correct booking request. Dates and expected totals are worked
out from today with the same code the tool uses. Every reply is saved to `evals/results/`.

## Cost

Each question is one or two model calls. The fixed part of the prompt is cached, so most of the cost is the reply
itself. A full eval run (about 31 questions) is estimated at well under $1. To cap spending, set a monthly limit on
the API key in the Anthropic Console; the site's own limits only stop a single visitor from using it up.

## Run it

```bash
npm install
echo "ANTHROPIC_API_KEY=..." > .env.local   # never commit this file
npm run dev          # http://localhost:5173, with /api/chat running the same handler as on Vercel
npm run build
npm run typecheck
```

`CLAUDE_MODEL` overrides the model if you want to try a cheaper one.

## Deploy

Import the repository in Vercel and add `ANTHROPIC_API_KEY` under Settings > Environment Variables. `vercel.json`
sets the build, a 60-second limit for the chat function and the security headers (including a Content Security
Policy that only allows requests to the site itself). Canonical and social links use `SITE_URL` when it is set,
otherwise the project's production `*.vercel.app` address.

Made by Webradiona.
