/**
 * Everything the site and the assistant know about the (fictional) property.
 * The assistant may only answer from this file and from tool results, so any
 * fact a guest might ask about belongs here, not in the prompt.
 */

export type ApartmentId = "studio" | "mare";
export type Season = "low" | "mid" | "high";

export type Apartment = {
  id: ApartmentId;
  name: string;
  sizeM2: number;
  maxGuests: number;
  beds: string;
  floor: string;
  outdoor: string;
  kitchen: string;
  bathroom: string;
  petsAllowed: boolean;
  rates: Record<Season, number>;
  cleaningFee: number;
};

export const PROPERTY = {
  name: "Sea Lantern Apartments",
  town: "Rovinj",
  region: "Istria, Croatia",
  timeZone: "Europe/Zagreb",
};

export const APARTMENTS: Record<ApartmentId, Apartment> = {
  studio: {
    id: "studio",
    name: "Studio Lanterna",
    sizeM2: 28,
    maxGuests: 2,
    beds: "1 double bed (160 cm)",
    floor: "2nd floor, stairs only (no lift)",
    outdoor: "small balcony with a partial sea view",
    kitchen: "kitchenette with two hobs, fridge, kettle and a filter coffee machine (no oven)",
    bathroom: "shower",
    petsAllowed: false,
    rates: { low: 75, mid: 95, high: 125 },
    cleaningFee: 30,
  },
  mare: {
    id: "mare",
    name: "Apartment Mare",
    sizeM2: 55,
    maxGuests: 4,
    beds: "bedroom with a double bed (180 cm) and a sofa bed for 2 in the living room",
    floor: "ground floor, one low step at the entrance",
    outdoor: "private terrace with a sea view and a table for 4",
    kitchen: "full kitchen with oven, dishwasher and an espresso machine",
    bathroom: "walk-in shower and a washing machine",
    petsAllowed: true,
    rates: { low: 110, mid: 140, high: 185 },
    cleaningFee: 45,
  },
};

/** Season by month (1-12). November to March the house is closed. */
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
  minNights: { low: 3, mid: 3, high: 5 } as Record<Season, number>,
  /** Tourist tax per guest aged 12 or older, per night, in euros. */
  touristTaxPerNight: 2,
  /** Per night, Apartment Mare only. */
  petFeePerNight: 10,
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
      "Self check-in from 15:00 with a key box at the front door. The key box code is sent on WhatsApp the day before arrival.",
      "Late arrival is no problem: the key box works at any time after 15:00. Please tell the host your arrival time.",
      "Early check-in from 12:00 costs €20 and is possible only if the apartment is free the night before. The host confirms it the day before arrival.",
      "Check-out is by 10:00. Late check-out until 13:00 costs €20 when nobody arrives that day.",
      "Luggage can be left in the storage room for free between 10:00 and 15:00 on arrival and departure days.",
    ],
  },
  {
    title: "Parking and getting here",
    items: [
      "Each apartment has one free reserved parking space in the courtyard, 30 m from the door.",
      "The old town is car-free. A second car can use the paid city car park 400 m away.",
      "Pula airport is 40 km away, about 45 minutes by car. The host can arrange a private transfer for €60 one way for up to 4 people, booked at least 48 hours ahead.",
      "The Rovinj bus station is a 700 m walk.",
    ],
  },
  {
    title: "In the apartments",
    items: [
      "Free fibre Wi-Fi. The network name and password are in the welcome book in the apartment.",
      "Air conditioning in every room.",
      "Bed linen, bath towels and beach towels are included. Linen and towels are changed every 7 days on longer stays.",
      "Hair dryer in both apartments. An iron and ironing board are available on request.",
      "Apartment Mare has its own washing machine. Studio guests can use the machine in the laundry room for €5 per load.",
      "A baby cot and high chair are free on request in Apartment Mare. The studio has no room for an extra bed or cot.",
    ],
  },
  {
    title: "Around the house",
    items: [
      "The nearest swimming spot, with rocks and a concrete platform, is 250 m away. The nearest pebble beach is 1.2 km away.",
      "The Golden Cape forest park (Zlatni rt) is 1.5 km away on foot or by bike.",
      "The old town square is a 450 m walk.",
      "A bakery 150 m away opens at 06:30. A supermarket 300 m away is open 07:00 to 21:00. The nearest pharmacy is 500 m away.",
      "Two bikes with helmets, two beach chairs and a beach umbrella are free to borrow.",
    ],
  },
  {
    title: "Pets",
    items: [
      "One dog up to 15 kg is welcome in Apartment Mare for €10 per night. Pets are not allowed in the studio.",
      "Dogs can't be left alone in the apartment and are not allowed on beds or sofas.",
    ],
  },
  {
    title: "House rules",
    items: [
      "No smoking inside. Smoking is fine on the balcony or terrace.",
      "Quiet hours are 22:00 to 07:00. No parties or events.",
      "Only registered guests can stay overnight, up to the apartment's maximum.",
    ],
  },
  {
    title: "Prices, payment and cancellation",
    items: [
      "Nightly prices depend on the season and include VAT. A one-off cleaning fee is added per stay.",
      "Tourist tax is €2 per night for each guest aged 12 or older. Children under 12 stay free of tourist tax.",
      "Minimum stay is 5 nights in July and August and 3 nights the rest of the season. The house is closed from November to March.",
      "A booking request is not a confirmed booking. The host replies on WhatsApp, usually within a few hours between 08:00 and 21:00.",
      "To confirm, a 30% deposit is paid by bank transfer or card link within 3 days. The rest is paid on arrival in cash or by card.",
      "Cancellation is free up to 30 days before arrival and the deposit is refunded. After that the deposit is not refundable.",
    ],
  },
  {
    title: "Contact",
    items: [
      "The host answers on WhatsApp every day from 08:00 to 21:00.",
      "In an emergency call 112.",
    ],
  },
];
