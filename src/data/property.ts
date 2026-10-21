/**
 * Everything the site and the assistant know about the (fictional) villa.
 * The assistant may only answer from this file and from tool results, so any
 * fact a guest might ask about belongs here, not in the prompt.
 */

export type Season = "low" | "mid" | "high";

export const PROPERTY = {
  name: "Sea Lantern Villa",
  town: "Rovinj",
  region: "Istria, Croatia",
  timeZone: "Europe/Zagreb",
};

export const VILLA = {
  name: PROPERTY.name,
  maxGuests: 8,
  bedrooms: 4,
  bathrooms: 4,
  rates: { low: 260, mid: 360, high: 490 } as Record<Season, number>,
  cleaningFee: 150,
  rooms: [
    "Three bedrooms with a double bed, each with its own bathroom",
    "One bedroom with two single beds and its own bathroom, good for children",
    "Living room and kitchen that open onto the pool terrace",
    "Covered summer kitchen with a wood-fired grill and a table for 8",
  ],
  highlights: [
    "Private outdoor pool with sun loungers",
    "Heated hot tub in the garden, with a sea view",
    "Path down to a small pebble cove",
    "Wood-fired grill under the covered terrace",
    "Desk and fast Wi-Fi for remote work",
    "Free parking for 3 cars inside the gate",
  ],
};

/** Season by month (1-12). November to March the villa is closed. */
export const SEASON_BY_MONTH: Record<number, Season | "closed"> = {
  1: "closed", 2: "closed", 3: "closed",
  4: "low", 5: "low",
  6: "mid",
  7: "high", 8: "high",
  9: "mid",
  10: "low",
  11: "closed", 12: "closed",
};

export const SEASON_LABELS: Record<Season, string> = {
  low: "April, May and October",
  mid: "June and September",
  high: "July and August",
};

export const RULES = {
  minNights: { low: 3, mid: 5, high: 7 } as Record<Season, number>,
  /** Tourist tax per guest aged 12 or older, per night, in euros. */
  touristTaxPerNight: 2,
  depositShare: 0.3,
  /** How far ahead the calendar is open, in months. */
  bookingHorizonMonths: 15,
  /** A conversation stays open for this many guest messages. */
  maxGuestMessages: 12,
};

/** House information shown on the site and given to the assistant as its only source. */
export const HOUSE_INFO: { title: string; items: string[] }[] = [
  {
    title: "Arrival and departure",
    items: [
      "Check-in is from 16:00. The host meets you at the villa, shows you around and hands over the keys.",
      "Arriving after 21:00 is fine: the host leaves the keys in a key box by the gate and sends the code on WhatsApp the day before.",
      "Early check-in from 13:00 costs €60 and is possible only if the villa is free the night before. The host confirms it the day before arrival.",
      "Check-out is by 10:00. Late check-out until 14:00 costs €60 when nobody arrives that day.",
    ],
  },
  {
    title: "Pool, hot tub and the sea",
    items: [
      "The private outdoor pool is open from 15 May to 15 October. It is not heated.",
      "There is no lifeguard, so children must be watched at the pool at all times.",
      "The hot tub in the garden seats 5, is heated and open the whole season, April to October. It looks out over the sea.",
      "Sun loungers, an outdoor shower and pool towels are provided.",
      "A path from the garden leads down to a small pebble cove, about 150 m from the villa.",
      "The beaches of the Golden Cape forest park (Zlatni rt) are 2 km away.",
    ],
  },
  {
    title: "Parking and getting here",
    items: [
      "Free parking for up to 3 cars inside the gate.",
      "Rovinj old town is 3 km away: about 8 minutes by car or 35 minutes on foot along the coastal path.",
      "Pula airport is 40 km away, about 45 minutes by car. The host can arrange a minivan transfer for up to 8 people for €90 one way, booked at least 48 hours ahead.",
      "A car is recommended. The nearest bus stop is 600 m away.",
    ],
  },
  {
    title: "In the villa",
    items: [
      "Four bedrooms, each with its own bathroom: three with a double bed and one with two single beds. The villa sleeps up to 8.",
      "Air conditioning in every bedroom and in the living room.",
      "Kitchen with an oven, hob, microwave, dishwasher, kettle and filter coffee machine.",
      "A covered summer kitchen next to the pool has a wood-fired grill and a dining table for 8. Firewood and charcoal are provided.",
      "Washing machine, iron and ironing board.",
      "Free fibre Wi-Fi and a desk for remote work. The network name and password are in the welcome book in the villa.",
      "Bed linen, bath towels and pool towels are included. Linen and towels are changed after 7 nights on longer stays.",
      "A baby cot and a high chair are free on request.",
    ],
  },
  {
    title: "Around the villa",
    items: [
      "A supermarket and a bakery are 1.2 km away. The supermarket is open 07:00 to 21:00.",
      "The nearest pharmacy and the restaurants are in Rovinj, 3 km away.",
      "Four bikes with helmets are free to borrow.",
    ],
  },
  {
    title: "House rules",
    items: [
      "No pets.",
      "No smoking inside. Smoking is fine on the terrace and in the garden.",
      "Quiet hours are 22:00 to 08:00. No parties or events.",
      "Only registered guests can stay overnight, up to 8 people.",
    ],
  },
  {
    title: "Prices, payment and cancellation",
    items: [
      "Nightly prices are for the whole villa, depend on the season and include VAT. A one-off cleaning fee of €150 is added per stay.",
      "Tourist tax is €2 per night for each guest aged 12 or older. Children under 12 stay free of tourist tax.",
      "Minimum stay is 7 nights in July and August, 5 nights in June and September, and 3 nights in April, May and October. The villa is closed from November to March.",
      "A booking request is not a confirmed booking. The host replies on WhatsApp, usually within a few hours between 08:00 and 21:00.",
      "To confirm, a 30% deposit is paid by bank transfer or card link within 3 days. The rest is paid on arrival in cash or by card.",
      "A refundable security deposit of €300 is paid in cash on arrival and returned at check-out.",
      "Cancellation is free up to 30 days before arrival and the deposit is refunded. After that the deposit is not refundable.",
    ],
  },
  {
    title: "Contact",
    items: ["The host answers on WhatsApp every day from 08:00 to 21:00.", "In an emergency call 112."],
  },
];
