/**
 * Xenia — the AI receptionist. Talks to a customer in Greek or English, checks
 * availability, and books an appointment via a Claude tool-use loop. Channel- and
 * source-agnostic: feed it customer text + conversation state, get back a reply +
 * next state. Messaging and phone-voice plug in behind the channel adapter seam.
 *
 * Primary entry point: `respond(business, state, userText, opts) → RespondResult`.
 */

export { respond } from "./engine";
export type { RespondOptions } from "./engine";

export { buildSystemPrompt } from "./persona";
export { XENIA_TOOLS, parseAvailabilityArgs, parseBookingArgs, parseHandoffReason } from "./tools";
export type { AvailabilityArgs, BookingArgs } from "./tools";

export { reduceState, mergeSlots } from "./slots";
export type { StateAction } from "./slots";

export { dispatchTool } from "./dispatch";
export type { DispatchOutcome } from "./dispatch";

export { synthesizeSlots, dayOfWeek } from "./availability";

export { InMemoryStore } from "./store";
export type { AvailabilityProvider, BookingStore, NewBooking } from "./store";

export { getClient, costUsd, TURN_MODEL } from "./client";
export type { RawUsage } from "./client";

export type { ChannelAdapter, InboundMessage, OutboundMessage } from "./adapters/adapter";
export { ConsoleAdapter } from "./adapters/console-adapter";
export type { ConsoleInbound } from "./adapters/console-adapter";
export { telegramAdapter, whatsappAdapter, voiceAdapter } from "./adapters/stubs";

export type {
  Lang,
  DayOfWeek,
  OpeningHours,
  ServiceOffering,
  BookingPolicy,
  BusinessConfig,
  ConversationStatus,
  BookingSlots,
  Role,
  ChatMessage,
  ConversationState,
  Appointment,
  AvailableSlot,
  XeniaUsage,
  RespondResult,
} from "./types";

export { createConversation } from "./conversation";

export { SAMPLE_BUSINESSES, SAMPLE_KEYS, getSample } from "./samples";
export type { SampleKey } from "./samples";
