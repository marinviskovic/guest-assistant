import type Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { APARTMENTS, PROPERTY, type ApartmentId } from "../src/data/property.js";
import { checkStay, type PriceBreakdown, type StayQuery } from "../src/lib/booking.js";

export type BookingRequest = {
  apartment: ApartmentId;
  apartmentName: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  childrenUnder12: number;
  pet: boolean;
  guestName: string;
  note: string;
  price: PriceBreakdown;
  message: string;
};

const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const stayFields = {
  check_in: date,
  check_out: date,
  guests: z.number().int().min(1).max(10),
  children_under_12: z.number().int().min(0).max(9),
  pet: z.boolean(),
};

const AvailabilityInput = z.object({ apartment: z.enum(["studio", "mare", "any"]), ...stayFields });
const BookingInput = z.object({
  apartment: z.enum(["studio", "mare"]),
  ...stayFields,
  guest_name: z.string().trim().min(1).max(60),
  note_for_host: z.string().max(300),
});

const stayProperties = {
  check_in: { type: "string", description: "Arrival date, YYYY-MM-DD." },
  check_out: { type: "string", description: "Departure date, YYYY-MM-DD." },
  guests: { type: "integer", description: "Total number of guests, children included." },
  children_under_12: { type: "integer", description: "How many of the guests are under 12. Use 0 if none or unknown." },
  pet: { type: "boolean", description: "True if the guests bring a dog." },
};

export const TOOLS: Anthropic.Beta.BetaTool[] = [
  {
    name: "check_availability",
    description:
      "Check whether an apartment is free for exact dates and get the full price: nightly rates, cleaning fee, " +
      "dog fee, tourist tax, total and 30% deposit. Also returns nearby free dates when the stay is booked. " +
      'Use apartment "any" to check both apartments.',
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        apartment: { type: "string", enum: ["studio", "mare", "any"], description: "studio = Studio Lanterna, mare = Apartment Mare." },
        ...stayProperties,
      },
      required: ["apartment", "check_in", "check_out", "guests", "children_under_12", "pet"],
      additionalProperties: false,
    },
  },
  {
    name: "prepare_booking_request",
    description:
      "Prepare a booking request the guest sends to the host on WhatsApp. It checks the dates again and shows the " +
      "guest a summary card with the price and a send button. It does not confirm or pay for anything.",
    eager_input_streaming: true,
    input_schema: {
      type: "object",
      properties: {
        apartment: { type: "string", enum: ["studio", "mare"], description: "studio = Studio Lanterna, mare = Apartment Mare." },
        ...stayProperties,
        guest_name: { type: "string", description: "The guest's first name, as they gave it." },
        note_for_host: { type: "string", description: 'Anything the guest wants the host to know, such as arrival time. Use "" if nothing.' },
      },
      required: ["apartment", "check_in", "check_out", "guests", "children_under_12", "pet", "guest_name", "note_for_host"],
      additionalProperties: false,
    },
  },
];

export type ToolOutcome = { output: unknown; isError: boolean; booking?: BookingRequest };

const euro = (value: number) => `€${value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const longDate = (value: string) =>
  new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" }).format(
    new Date(`${value}T12:00:00Z`),
  );

function toQuery(apartment: ApartmentId, input: z.infer<typeof AvailabilityInput>): StayQuery {
  return {
    apartment,
    checkIn: input.check_in,
    checkOut: input.check_out,
    guests: input.guests,
    childrenUnder12: input.children_under_12,
    pet: input.pet,
  };
}

/** What the model sees: plain facts, with problems as sentences it can pass on. */
function describe(result: ReturnType<typeof checkStay>) {
  return {
    apartment: result.apartment,
    name: result.name,
    check_in: result.checkIn,
    check_out: result.checkOut,
    available: result.available,
    problems: result.problems.map((problem) => problem.detail),
    price: result.price,
    other_free_dates: result.alternatives.map((stay) => ({ check_in: stay.checkIn, check_out: stay.checkOut })),
  };
}

function bookingMessage(request: Omit<BookingRequest, "message">) {
  const children = request.childrenUnder12 > 0 ? ` (${request.childrenUnder12} under 12)` : "";
  return [
    `Booking request: ${PROPERTY.name}`,
    `${request.apartmentName}, ${longDate(request.checkIn)} to ${longDate(request.checkOut)} (${request.price.nights} nights)`,
    `Guests: ${request.guests}${children}${request.pet ? ", with a dog" : ""}`,
    `Name: ${request.guestName}`,
    `Total: ${euro(request.price.total)}, deposit ${euro(request.price.deposit)}`,
    ...(request.note ? [`Note: ${request.note}`] : []),
  ].join("\n");
}

export function runTool(name: string, rawInput: unknown, today: string): ToolOutcome {
  if (name === "check_availability") {
    const parsed = AvailabilityInput.safeParse(rawInput);
    if (!parsed.success) return { output: { error: "Invalid input", issues: parsed.error.issues }, isError: true };
    const apartments: ApartmentId[] = parsed.data.apartment === "any" ? ["studio", "mare"] : [parsed.data.apartment];
    return {
      output: { today, results: apartments.map((id) => describe(checkStay(toQuery(id, parsed.data), today))) },
      isError: false,
    };
  }

  if (name === "prepare_booking_request") {
    const parsed = BookingInput.safeParse(rawInput);
    if (!parsed.success) return { output: { error: "Invalid input", issues: parsed.error.issues }, isError: true };
    const input = parsed.data;
    const result = checkStay(toQuery(input.apartment, { ...input, apartment: input.apartment }), today);
    if (!result.available || !result.price) {
      return { output: { ready: false, ...describe(result) }, isError: false };
    }
    const draft = {
      apartment: input.apartment,
      apartmentName: APARTMENTS[input.apartment].name,
      checkIn: input.check_in,
      checkOut: input.check_out,
      guests: input.guests,
      childrenUnder12: input.children_under_12,
      pet: input.pet,
      guestName: input.guest_name,
      note: input.note_for_host.trim(),
      price: result.price,
    };
    const booking = { ...draft, message: bookingMessage(draft) };
    return {
      output: {
        ready: true,
        shown_to_guest: "A summary card with a 'Send on WhatsApp' button is now shown below your reply.",
        total: result.price.total,
        deposit: result.price.deposit,
      },
      isError: false,
      booking,
    };
  }

  return { output: { error: `Unknown tool ${name}` }, isError: true };
}
