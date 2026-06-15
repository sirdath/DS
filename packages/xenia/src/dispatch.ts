/**
 * Execute one tool the model asked for, against the store, and shape both the
 * tool_result block (fed back to Claude) and the state action (folded into
 * conversation state). Invalid input or a store error becomes an `is_error`
 * tool_result so the model can recover gracefully — it never throws the turn.
 */

import type Anthropic from "@anthropic-ai/sdk";
import type { StateAction } from "./slots";
import type { AvailabilityProvider, BookingStore } from "./store";
import { parseAvailabilityArgs, parseBookingArgs, parseHandoffReason } from "./tools";
import type { BusinessConfig } from "./types";

export interface DispatchOutcome {
  result: Anthropic.Messages.ToolResultBlockParam;
  action?: StateAction;
  handoff?: { reason: string };
}

function ok(toolUseId: string, data: unknown): Anthropic.Messages.ToolResultBlockParam {
  return { type: "tool_result", tool_use_id: toolUseId, content: JSON.stringify(data) };
}

function fail(toolUseId: string, message: string): Anthropic.Messages.ToolResultBlockParam {
  return { type: "tool_result", tool_use_id: toolUseId, content: JSON.stringify({ error: message }), is_error: true };
}

export async function dispatchTool(
  toolUse: Anthropic.Messages.ToolUseBlock,
  business: BusinessConfig,
  store: BookingStore & AvailabilityProvider,
): Promise<DispatchOutcome> {
  try {
    switch (toolUse.name) {
      case "get_availability": {
        const args = parseAvailabilityArgs(toolUse.input);
        const slots = await store.getAvailability(business, args.service_id, args.date);
        return {
          result: ok(toolUse.id, { date: args.date, available: slots.map((s) => s.time) }),
          action: { type: "collect", patch: { serviceId: args.service_id, date: args.date } },
        };
      }
      case "create_booking": {
        const a = parseBookingArgs(toolUse.input);
        const appt = await store.createBooking({
          businessId: business.id,
          serviceId: a.service_id,
          date: a.date,
          time: a.time,
          partySize: a.party_size,
          name: a.name,
          contact: a.contact,
        });
        return {
          result: ok(toolUse.id, { booked: true, appointmentId: appt.id, date: appt.date, time: appt.time }),
          action: {
            type: "confirm",
            slots: {
              serviceId: a.service_id,
              date: a.date,
              time: a.time,
              partySize: a.party_size,
              name: a.name,
              contact: a.contact,
            },
            appointmentId: appt.id,
          },
        };
      }
      case "handoff_to_human": {
        const reason = parseHandoffReason(toolUse.input);
        return { result: ok(toolUse.id, { handed_off: true }), action: { type: "handoff" }, handoff: { reason } };
      }
      default:
        return { result: fail(toolUse.id, `unknown tool: ${toolUse.name}`) };
    }
  } catch (e) {
    return { result: fail(toolUse.id, e instanceof Error ? e.message : "tool failed") };
  }
}
