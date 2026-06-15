/**
 * Sample businesses — realistic Greek receptionist setups used by the demo
 * playground and the workspace chat surface. They double as a fixture set so a
 * caller (or a UI) can try Xenia without configuring a real business first.
 */

import type { BusinessConfig } from "./types";

export const SAMPLE_KEYS = ["taverna", "dental", "hotel", "cafe"] as const;
export type SampleKey = (typeof SAMPLE_KEYS)[number];

const taverna: BusinessConfig = {
  id: "taverna",
  name: "To Steki tou Ilia",
  type: "family taverna",
  location: "Koukaki, Athens",
  languages: ["el", "en"],
  persona:
    "warm, familiar and a little proud of the food — the voice of a family taverna where the owner greets you at the door",
  services: [
    { id: "dinner", name: "Dinner table", durationMin: 120 },
    { id: "lunch", name: "Lunch table", durationMin: 90 },
  ],
  openingHours: [
    { day: "tue", open: "18:00", close: "23:00" },
    { day: "wed", open: "18:00", close: "23:00" },
    { day: "thu", open: "18:00", close: "23:00" },
    { day: "fri", open: "18:00", close: "23:30" },
    { day: "sat", open: "13:00", close: "23:30" },
    { day: "sun", open: "13:00", close: "22:00" },
  ],
  policy: { slotIntervalMin: 30, minPartySize: 1, maxPartySize: 12, leadTimeMin: 60, maxAdvanceDays: 30 },
};

const dental: BusinessConfig = {
  id: "dental",
  name: "Glyfada Dental Care",
  type: "dental clinic",
  location: "Glyfada, Athens",
  languages: ["el", "en"],
  persona: "calm, professional and reassuring — a clinic receptionist who makes a nervous patient feel at ease",
  services: [
    { id: "checkup", name: "Check-up & cleaning", durationMin: 30 },
    { id: "filling", name: "Filling", durationMin: 45 },
    { id: "whitening", name: "Whitening", durationMin: 60, priceNote: "from €180" },
  ],
  openingHours: [
    { day: "mon", open: "09:00", close: "18:00" },
    { day: "tue", open: "09:00", close: "18:00" },
    { day: "wed", open: "09:00", close: "18:00" },
    { day: "thu", open: "09:00", close: "20:00" },
    { day: "fri", open: "09:00", close: "16:00" },
  ],
  policy: { slotIntervalMin: 15, minPartySize: 1, maxPartySize: 1, leadTimeMin: 120, maxAdvanceDays: 60 },
};

const hotel: BusinessConfig = {
  id: "hotel",
  name: "Aetheria Suites",
  type: "boutique hotel",
  location: "Plaka, Athens",
  languages: ["el", "en"],
  persona: "gracious and attentive — a boutique-hotel concierge who anticipates what a guest needs",
  services: [
    { id: "rooftop", name: "Rooftop restaurant table", durationMin: 120 },
    { id: "spa", name: "Spa treatment", durationMin: 60, priceNote: "from €70" },
    { id: "transfer", name: "Airport transfer", durationMin: 30 },
  ],
  openingHours: [
    { day: "mon", open: "08:00", close: "23:00" },
    { day: "tue", open: "08:00", close: "23:00" },
    { day: "wed", open: "08:00", close: "23:00" },
    { day: "thu", open: "08:00", close: "23:00" },
    { day: "fri", open: "08:00", close: "23:30" },
    { day: "sat", open: "08:00", close: "23:30" },
    { day: "sun", open: "08:00", close: "23:00" },
  ],
  policy: { slotIntervalMin: 30, minPartySize: 1, maxPartySize: 8, leadTimeMin: 90, maxAdvanceDays: 90 },
};

const cafe: BusinessConfig = {
  id: "cafe",
  name: "Nero Coffee Roasters",
  type: "specialty coffee shop",
  location: "Thessaloniki",
  languages: ["el", "en"],
  persona: "friendly and a bit nerdy about coffee — a barista who loves talking through the beans",
  services: [
    { id: "tasting", name: "Coffee tasting", durationMin: 45, priceNote: "€15 pp" },
    { id: "workshop", name: "Barista workshop", durationMin: 90, priceNote: "€40 pp" },
  ],
  openingHours: [
    { day: "mon", open: "07:30", close: "20:00" },
    { day: "tue", open: "07:30", close: "20:00" },
    { day: "wed", open: "07:30", close: "20:00" },
    { day: "thu", open: "07:30", close: "20:00" },
    { day: "fri", open: "07:30", close: "21:00" },
    { day: "sat", open: "08:30", close: "21:00" },
    { day: "sun", open: "09:00", close: "18:00" },
  ],
  policy: { slotIntervalMin: 30, minPartySize: 1, maxPartySize: 8, leadTimeMin: 60, maxAdvanceDays: 30 },
};

export const SAMPLE_BUSINESSES: Record<SampleKey, BusinessConfig> = { taverna, dental, hotel, cafe };

export function getSample(key: SampleKey): BusinessConfig {
  return SAMPLE_BUSINESSES[key];
}
