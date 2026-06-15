/**
 * The three tools Xenia can call, plus the parsers that validate the model's
 * tool input at the boundary. Tool `input` arrives as `unknown` from the SDK, so
 * every argument is checked here — never cast — before it reaches the store.
 */

import type Anthropic from "@anthropic-ai/sdk";

export const XENIA_TOOLS: Anthropic.Messages.Tool[] = [
  {
    name: "get_availability",
    description:
      "Return bookable slots for a service on a given date. Call this before proposing a time — never invent availability.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        service_id: { type: "string", description: "id of one of the business's services" },
        date: { type: "string", description: "ISO date, YYYY-MM-DD" },
      },
      required: ["service_id", "date"],
    },
  },
  {
    name: "create_booking",
    description:
      "Confirm a booking. Only call once service, date, time, party size, the customer's name and a contact (phone or email) are all known and the customer has agreed to the time.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        service_id: { type: "string" },
        date: { type: "string", description: "ISO date, YYYY-MM-DD" },
        time: { type: "string", description: "24h HH:MM" },
        party_size: { type: "number" },
        name: { type: "string" },
        contact: { type: "string", description: "phone number or email" },
      },
      required: ["service_id", "date", "time", "party_size", "name", "contact"],
    },
  },
  {
    name: "handoff_to_human",
    description:
      "Escalate to a human when the request is out of scope, a complaint, or the customer explicitly asks for a person.",
    input_schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        reason: { type: "string", description: "short reason for the handoff" },
      },
      required: ["reason"],
    },
  },
];

export interface AvailabilityArgs {
  service_id: string;
  date: string;
}

export interface BookingArgs {
  service_id: string;
  date: string;
  time: string;
  party_size: number;
  name: string;
  contact: string;
}

function asRecord(input: unknown): Record<string, unknown> {
  if (typeof input !== "object" || input === null) {
    throw new Error("tool input is not an object");
  }
  return input as Record<string, unknown>;
}

function reqString(rec: Record<string, unknown>, key: string): string {
  const v = rec[key];
  if (typeof v !== "string" || v.trim() === "") {
    throw new Error(`tool input "${key}" must be a non-empty string`);
  }
  return v;
}

function reqNumber(rec: Record<string, unknown>, key: string): number {
  const v = typeof rec[key] === "string" ? Number(rec[key]) : rec[key];
  if (typeof v !== "number" || !Number.isFinite(v)) {
    throw new Error(`tool input "${key}" must be a number`);
  }
  return v;
}

export function parseAvailabilityArgs(input: unknown): AvailabilityArgs {
  const rec = asRecord(input);
  return { service_id: reqString(rec, "service_id"), date: reqString(rec, "date") };
}

export function parseBookingArgs(input: unknown): BookingArgs {
  const rec = asRecord(input);
  return {
    service_id: reqString(rec, "service_id"),
    date: reqString(rec, "date"),
    time: reqString(rec, "time"),
    party_size: reqNumber(rec, "party_size"),
    name: reqString(rec, "name"),
    contact: reqString(rec, "contact"),
  };
}

export function parseHandoffReason(input: unknown): string {
  const rec = asRecord(input);
  const v = rec["reason"];
  return typeof v === "string" && v.trim() !== "" ? v : "unspecified";
}
