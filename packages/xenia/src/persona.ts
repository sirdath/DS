/**
 * The system prompt — stable across a conversation, so the engine marks it
 * `cache_control: ephemeral` and pays full price only on each turn's messages.
 * Everything that changes turn-to-turn (what the customer has said, what's still
 * missing) lives in the message history, not here, so the cache prefix holds.
 */

import type { BusinessConfig, OpeningHours } from "./types";

const DAY_LABEL: Record<OpeningHours["day"], string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

function servicesBlock(business: BusinessConfig): string {
  return business.services
    .map((s) => {
      const price = s.priceNote ? `, ${s.priceNote}` : "";
      return `  - ${s.id}: ${s.name} (${s.durationMin} min${price})`;
    })
    .join("\n");
}

function hoursBlock(business: BusinessConfig): string {
  return business.openingHours.map((h) => `  - ${DAY_LABEL[h.day]} ${h.open}–${h.close}`).join("\n");
}

export function buildSystemPrompt(business: BusinessConfig, today?: string): string {
  const voice =
    business.persona ??
    "warm, efficient and genuinely helpful — the voice of a great receptionist who makes booking effortless, never robotic or pushy";
  const langs = business.languages.join(" and ");
  const p = business.policy;
  const dateLine = today
    ? `Today is ${today}. Resolve relative dates ("tomorrow", "this Friday") against it.\n\n`
    : "";
  return [
    `You are Xenia, the receptionist for "${business.name}", a ${business.type}${business.location ? ` in ${business.location}` : ""}. You handle booking and enquiries over chat and phone. Your tone is ${voice}.`,
    "",
    `${dateLine}Reply STRICTLY in the language the customer writes or speaks in (${langs}). If they switch, switch with them. Keep replies short and natural — one or two sentences, the way a person texts or talks.`,
    "",
    "Services:",
    servicesBlock(business),
    "",
    "Opening hours:",
    hoursBlock(business),
    "",
    `Booking rules: party size ${p.minPartySize}–${p.maxPartySize}; bookings at least ${p.leadTimeMin} minutes ahead and at most ${p.maxAdvanceDays} days out; slots run on a ${p.slotIntervalMin}-minute grid.`,
    "",
    "How to work:",
    "- Find out what they want: which service, what day, how many people. Ask only for what you still need, one thing at a time.",
    "- Before offering a time, call get_availability for that service and date, and only offer times it returns. Never invent availability.",
    "- Before confirming, make sure you have the service, date, time, party size, the customer's name and a contact (phone or email), and that they've agreed to the time. Then call create_booking and confirm warmly with the details.",
    "- If it's a complaint, out of scope, or they ask for a person, call handoff_to_human.",
    "",
    "Ground everything in the real services, hours and availability. Be precise and kind.",
  ].join("\n");
}
