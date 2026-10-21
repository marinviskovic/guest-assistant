import assert from "node:assert/strict";
import { test } from "node:test";
import { bookedNights, checkStay, parseDate, priceFor, todayIn, type StayQuery } from "../../src/lib/booking.js";

const TODAY = "2026-10-21";
const stay = (overrides: Partial<StayQuery>): StayQuery => ({
  apartment: "mare",
  checkIn: "2027-06-10",
  checkOut: "2027-06-14",
  guests: 2,
  childrenUnder12: 0,
  pet: false,
  ...overrides,
});

/** First run of `nights` free nights in a month, so tests don't depend on the generated calendar. */
function freeStay(apartment: "studio" | "mare", month: string, nights: number) {
  for (let day = 1; day <= 28 - nights; day++) {
    const checkIn = `${month}-${String(day).padStart(2, "0")}`;
    const checkOut = `${month}-${String(day + nights).padStart(2, "0")}`;
    const result = checkStay(stay({ apartment, checkIn, checkOut }), TODAY);
    if (result.available) return { checkIn, checkOut };
  }
  throw new Error(`no free ${nights}-night stay in ${month}`);
}

test("parseDate rejects dates that don't exist", () => {
  assert.equal(parseDate("2027-02-29"), null);
  assert.equal(parseDate("2027-13-01"), null);
  assert.equal(parseDate("27-07-01"), null);
  assert.notEqual(parseDate("2028-02-29"), null);
});

test("todayIn uses the apartments' time zone", () => {
  // 23:30 UTC on 21 October is already 22 October in Croatia.
  assert.equal(todayIn("Europe/Zagreb", new Date("2026-10-21T23:30:00Z")), "2026-10-22");
});

test("the generated calendar is the same every time and busier in summer", () => {
  assert.deepEqual([...bookedNights("mare", 2027)], [...bookedNights("mare", 2027)]);
  const nights = [...bookedNights("mare", 2027)];
  const august = nights.filter((night) => night.startsWith("2027-08")).length;
  const april = nights.filter((night) => night.startsWith("2027-04")).length;
  assert.ok(august > april, `august ${august} should be busier than april ${april}`);
  assert.ok(nights.every((night) => night >= "2027-04-01" && night <= "2027-10-31"));
});

test("price adds nightly rates, cleaning, dog and tourist tax", () => {
  const price = priceFor(stay({ checkIn: "2027-06-28", checkOut: "2027-07-03", guests: 4, childrenUnder12: 1, pet: true }));
  // 3 June nights at 140, 2 July nights at 185
  assert.deepEqual(price.rates.map(({ season, nights, rate }) => [season, nights, rate]), [["mid", 3, 140], ["high", 2, 185]]);
  assert.equal(price.accommodation, 790);
  assert.equal(price.cleaningFee, 45);
  assert.equal(price.petFee, 50);
  assert.equal(price.touristTax, 30); // 5 nights x 3 guests aged 12+ x €2
  assert.equal(price.total, 915);
  assert.equal(price.deposit, 274.5);
  assert.equal(price.balanceOnArrival, 640.5);
});

test("a free stay comes back with a price", () => {
  const dates = freeStay("studio", "2027-05", 4);
  const result = checkStay(stay({ apartment: "studio", ...dates }), TODAY);
  assert.equal(result.available, true);
  assert.deepEqual(result.problems, []);
  assert.equal(result.price?.accommodation, 4 * 75);
});

test("rules: past dates, closed season, minimum stay, guests and pets", () => {
  const codes = (query: Partial<StayQuery>) => checkStay(stay(query), TODAY).problems.map((problem) => problem.code);
  assert.ok(codes({ checkIn: "2026-10-01", checkOut: "2026-10-05" }).includes("past"));
  assert.ok(codes({ checkIn: "2027-03-28", checkOut: "2027-04-02" }).includes("closed"));
  assert.ok(codes({ checkIn: "2027-07-10", checkOut: "2027-07-13" }).includes("min_stay"));
  assert.ok(codes({ apartment: "studio", guests: 3 }).includes("too_many_guests"));
  assert.ok(codes({ apartment: "studio", pet: true }).includes("pets_not_allowed"));
  assert.ok(codes({ guests: 2, childrenUnder12: 2 }).includes("guests"));
  assert.ok(codes({ checkIn: "2028-06-10", checkOut: "2028-06-14" }).includes("too_far"));
  assert.ok(codes({ checkIn: "2027-06-14", checkOut: "2027-06-10" }).includes("invalid_date"));
});

test("a booked stay suggests nearby free dates of the same length", () => {
  const night = [...bookedNights("mare", 2027)].find((date) => date.startsWith("2027-08-1"))!;
  const checkIn = night;
  const checkOut = new Date(Date.parse(`${night}T00:00:00Z`) + 7 * 86_400_000).toISOString().slice(0, 10);
  const result = checkStay(stay({ checkIn, checkOut, guests: 4 }), TODAY);
  assert.equal(result.available, false);
  assert.ok(result.problems.some((problem) => problem.code === "booked"));
  for (const alternative of result.alternatives) {
    assert.equal(checkStay(stay({ ...alternative, guests: 4 }), TODAY).available, true);
  }
});
