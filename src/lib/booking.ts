import { RULES, SEASON_BY_MONTH, VILLA, type Season } from "../data/property.js";

/**
 * Availability and prices. The assistant never does this maths itself: it calls
 * the tools built on these functions, so every date and euro it quotes comes from here.
 */

const DAY = 86_400_000;

export type StayQuery = {
  checkIn: string;
  checkOut: string;
  guests: number;
  childrenUnder12: number;
};

export type Problem = { code: string; detail: string };

export type PriceBreakdown = {
  currency: "EUR";
  nights: number;
  rates: { season: Season; nights: number; rate: number; subtotal: number }[];
  accommodation: number;
  cleaningFee: number;
  touristTax: number;
  total: number;
  deposit: number;
  balanceOnArrival: number;
};

export type StayResult = {
  checkIn: string;
  checkOut: string;
  available: boolean;
  problems: Problem[];
  price: PriceBreakdown | null;
  alternatives: { checkIn: string; checkOut: string }[];
};

/** "YYYY-MM-DD" to a UTC timestamp, or null when it isn't a real calendar date. */
export function parseDate(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const [year, month, day] = match.slice(1).map(Number);
  const time = Date.UTC(year, month - 1, day);
  return new Date(time).getUTCDate() === day && new Date(time).getUTCMonth() === month - 1 ? time : null;
}

export const formatDate = (time: number) => new Date(time).toISOString().slice(0, 10);

/** Today's date where the villa is, as "YYYY-MM-DD". */
export function todayIn(timeZone: string, now = new Date()): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" })
      .formatToParts(now)
      .map((part) => [part.type, part.value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export const seasonOf = (time: number) => SEASON_BY_MONTH[new Date(time).getUTCMonth() + 1];

const round2 = (value: number) => Math.round(value * 100) / 100;

// A believable calendar for any year, the same on every request: each year
// seeds its own run of bookings, busier in high season and mostly weeks in summer.
function seededRandom(seed: string) {
  let state = 2166136261;
  for (const char of seed) state = Math.imul(state ^ char.charCodeAt(0), 16777619);
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const OCCUPANCY: Record<Season, number> = { low: 0.25, mid: 0.4, high: 0.5 };
const calendars = new Map<number, Set<string>>();

export function bookedNights(year: number): Set<string> {
  const cached = calendars.get(year);
  if (cached) return cached;

  const random = seededRandom(`villa:${year}`);
  const nights = new Set<string>();
  const end = Date.UTC(year, 10, 1);
  let cursor = Date.UTC(year, 3, 1) + Math.floor(random() * 4) * DAY;
  while (cursor < end) {
    const season = seasonOf(cursor) as Season;
    if (random() < OCCUPANCY[season]) {
      const length = season === "high" ? 7 + Math.floor(random() * 2) * 3 : season === "mid" ? 5 + Math.floor(random() * 4) : 3 + Math.floor(random() * 5);
      for (let i = 0; i < length && cursor + i * DAY < end; i++) nights.add(formatDate(cursor + i * DAY));
      cursor += length * DAY;
    } else {
      // Summer gaps are whole weeks, the way villas let in July and August.
      cursor += (season === "high" ? 7 : 1 + Math.floor(random() * 3)) * DAY;
    }
  }
  calendars.set(year, nights);
  return nights;
}

export const isBooked = (date: string) => bookedNights(Number(date.slice(0, 4))).has(date);

function addMonths(time: number, months: number) {
  const date = new Date(time);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + months, date.getUTCDate());
}

export function priceFor(query: StayQuery): PriceBreakdown {
  const start = parseDate(query.checkIn)!;
  const nights = Math.round((parseDate(query.checkOut)! - start) / DAY);

  const rates: PriceBreakdown["rates"] = [];
  for (let i = 0; i < nights; i++) {
    const season = seasonOf(start + i * DAY) as Season;
    const last = rates.at(-1);
    if (last?.season === season) last.nights++;
    else rates.push({ season, nights: 1, rate: VILLA.rates[season], subtotal: 0 });
  }
  for (const line of rates) line.subtotal = line.nights * line.rate;

  const accommodation = rates.reduce((sum, line) => sum + line.subtotal, 0);
  const touristTax = RULES.touristTaxPerNight * nights * (query.guests - query.childrenUnder12);
  const total = accommodation + VILLA.cleaningFee + touristTax;
  const deposit = round2(total * RULES.depositShare);
  return {
    currency: "EUR",
    nights,
    rates,
    accommodation,
    cleaningFee: VILLA.cleaningFee,
    touristTax,
    total,
    deposit,
    balanceOnArrival: round2(total - deposit),
  };
}

/** Everything that stops this stay, apart from nights already booked. */
function ruleProblems(query: StayQuery, today: string): Problem[] {
  const start = parseDate(query.checkIn);
  const end = parseDate(query.checkOut);
  if (start === null || end === null) {
    return [{ code: "invalid_date", detail: "Dates must be real calendar dates written as YYYY-MM-DD." }];
  }
  if (end <= start) return [{ code: "invalid_date", detail: "Check-out must be after check-in." }];

  const problems: Problem[] = [];
  const todayTime = parseDate(today)!;
  if (start < todayTime) problems.push({ code: "past", detail: `The check-in date has passed. Today is ${today}.` });
  const horizon = addMonths(todayTime, RULES.bookingHorizonMonths);
  if (end > horizon) {
    problems.push({ code: "too_far", detail: `The calendar is open until ${formatDate(horizon)}.` });
  }

  const nights = Math.round((end - start) / DAY);
  const closed = Array.from({ length: nights }, (_, i) => start + i * DAY).some((night) => seasonOf(night) === "closed");
  if (closed) {
    problems.push({ code: "closed", detail: "The villa is closed from November to March. The season runs from 1 April to 31 October." });
  } else {
    const minNights = RULES.minNights[seasonOf(start) as Season];
    if (nights < minNights) {
      problems.push({ code: "min_stay", detail: `The minimum stay for this check-in date is ${minNights} nights.` });
    }
  }

  if (!Number.isInteger(query.guests) || query.guests < 1) {
    problems.push({ code: "guests", detail: "At least one guest is needed." });
  } else if (query.guests > VILLA.maxGuests) {
    problems.push({ code: "too_many_guests", detail: `The villa sleeps up to ${VILLA.maxGuests}.` });
  }
  if (query.childrenUnder12 < 0 || query.childrenUnder12 >= query.guests) {
    problems.push({ code: "guests", detail: "At least one guest must be 12 or older." });
  }
  return problems;
}

function bookedIn(query: StayQuery): string[] {
  const start = parseDate(query.checkIn)!;
  const nights = Math.round((parseDate(query.checkOut)! - start) / DAY);
  return Array.from({ length: nights }, (_, i) => formatDate(start + i * DAY)).filter((night) => isBooked(night));
}

export function checkStay(query: StayQuery, today: string): StayResult {
  const result: StayResult = {
    checkIn: query.checkIn,
    checkOut: query.checkOut,
    available: false,
    problems: ruleProblems(query, today),
    price: null,
    alternatives: [],
  };
  if (result.problems.some((problem) => problem.code === "invalid_date")) return result;

  const booked = bookedIn(query);
  if (booked.length > 0) {
    result.problems.push({ code: "booked", detail: `Already booked on the nights of ${booked.join(", ")}.` });
  }
  result.available = result.problems.length === 0;
  if (result.available) {
    result.price = priceFor(query);
    return result;
  }

  // Only dates are in the way: look for the same length of stay up to three weeks either side.
  if (result.problems.every((problem) => problem.code === "booked")) {
    const start = parseDate(query.checkIn)!;
    const length = parseDate(query.checkOut)! - start;
    for (let shift = 1; shift <= 21 && result.alternatives.length < 3; shift++) {
      for (const direction of [-1, 1]) {
        const checkIn = formatDate(start + direction * shift * DAY);
        const alternative = { ...query, checkIn, checkOut: formatDate(parseDate(checkIn)! + length) };
        if (ruleProblems(alternative, today).length === 0 && bookedIn(alternative).length === 0) {
          result.alternatives.push({ checkIn: alternative.checkIn, checkOut: alternative.checkOut });
        }
        if (result.alternatives.length === 3) break;
      }
    }
    result.alternatives.sort((a, b) => a.checkIn.localeCompare(b.checkIn));
  }
  return result;
}
