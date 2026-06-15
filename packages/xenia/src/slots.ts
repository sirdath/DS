/**
 * The conversation state reducer — pure and immutable. It folds three kinds of
 * action (collect a detail, confirm a booking, hand off) into the next state and
 * derives the status from what's been gathered. The engine owns the I/O; this owns
 * the bookkeeping, so the status machine is trivially testable in isolation.
 */

import type { BookingSlots, ConversationState, ConversationStatus } from "./types";

export type StateAction =
  | { type: "collect"; patch: Partial<BookingSlots> }
  | { type: "confirm"; slots: Partial<BookingSlots>; appointmentId: string }
  | { type: "handoff" };

/** Merge a patch over slots, ignoring undefined values (never overwrite with a gap). */
export function mergeSlots(slots: BookingSlots, patch: Partial<BookingSlots>): BookingSlots {
  const next: BookingSlots = { ...slots };
  for (const [key, value] of Object.entries(patch)) {
    if (value !== undefined) {
      (next as Record<string, unknown>)[key] = value;
    }
  }
  return next;
}

/** "proposing" once a concrete service+date+time are on the table; else "collecting". */
function collectingStatus(slots: BookingSlots): ConversationStatus {
  return slots.serviceId && slots.date && slots.time ? "proposing" : "collecting";
}

export function reduceState(state: ConversationState, action: StateAction): ConversationState {
  switch (action.type) {
    case "collect": {
      const slots = mergeSlots(state.slots, action.patch);
      return { ...state, slots, status: collectingStatus(slots) };
    }
    case "confirm": {
      const slots = mergeSlots(state.slots, action.slots);
      return { ...state, slots, status: "confirmed", appointmentId: action.appointmentId };
    }
    case "handoff":
      return { ...state, status: "handoff" };
  }
}
