/**
 * Xenia data contract — the shapes that flow channel → engine → store.
 * Channel-agnostic: whether a turn arrives from a text playground, Telegram,
 * WhatsApp or a phone call, it is normalised to a plain string + conversation
 * state. The engine never knows which channel it is serving.
 */

export type Lang = "el" | "en";

export type DayOfWeek = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

/** One opening window on a given weekday, 24h "HH:MM". */
export interface OpeningHours {
  day: DayOfWeek;
  open: string;
  close: string;
}

/** A bookable service the business offers. */
export interface ServiceOffering {
  id: string;
  name: string;
  durationMin: number;
  priceNote?: string;
}

/** Rules that shape which slots are bookable. */
export interface BookingPolicy {
  slotIntervalMin: number; // grid granularity, e.g. 30
  minPartySize: number;
  maxPartySize: number;
  leadTimeMin: number; // earliest bookable from "now"
  maxAdvanceDays: number; // furthest out a booking may be made
}

/** Who the receptionist is working for — shapes persona, services and policy. */
export interface BusinessConfig {
  id: string; // scope key (a portal user / client account)
  name: string;
  type: string; // "taverna", "dental clinic", …
  location?: string;
  languages: Lang[]; // e.g. ["el", "en"]
  persona?: string; // optional brand-voice note for replies
  services: ServiceOffering[];
  openingHours: OpeningHours[];
  policy: BookingPolicy;
}

export type ConversationStatus = "collecting" | "proposing" | "confirmed" | "handoff";

/** What we have gathered from the customer so far. */
export interface BookingSlots {
  serviceId?: string;
  date?: string; // ISO YYYY-MM-DD
  time?: string; // HH:MM
  partySize?: number;
  name?: string;
  contact?: string;
}

export type Role = "user" | "assistant";

/** One human-facing turn (not the tool-call plumbing). */
export interface ChatMessage {
  role: Role;
  text: string;
  ts: string; // ISO timestamp
}

/** The running state of one conversation, threaded across turns. */
export interface ConversationState {
  businessId: string;
  lang: Lang; // sticky reply language
  status: ConversationStatus;
  slots: BookingSlots;
  history: ChatMessage[];
  appointmentId?: string; // set once a booking is confirmed
}

/** A confirmed booking. */
export interface Appointment {
  id: string;
  businessId: string;
  serviceId: string;
  date: string; // ISO YYYY-MM-DD
  time: string; // HH:MM
  partySize: number;
  name: string;
  contact: string;
  createdAt: string; // ISO timestamp
}

/** One free slot returned by the availability provider. */
export interface AvailableSlot {
  date: string; // ISO YYYY-MM-DD
  time: string; // HH:MM
}

/** Token usage + cost, summed across a turn's tool-use loop. */
export interface XeniaUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  usd: number;
}

/** The result of one call to `respond`. */
export interface RespondResult {
  reply: string; // assistant text to send back, in the customer's language
  state: ConversationState; // next state (immutable update of the input)
  usage: XeniaUsage;
  handoff?: { reason: string }; // set when the agent escalates to a human
}
