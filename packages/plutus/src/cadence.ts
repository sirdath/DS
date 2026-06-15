/**
 * The scheduling brain — pure. Given each open invoice's state, its customer's
 * chase sequence, and an injected `today`, work out which single step is currently
 * due (the most-advanced step whose scheduled date has arrived), rolled to the
 * next business day, with its stable idempotency key. It decides *what should
 * happen*; the engine decides *whether it already did* (dedupe + cooldown).
 */

import { addDays, nextBusinessDay } from "./calendar";
import { deriveKey } from "./idempotency";
import type { ChaseSequence, Customer, InvoiceArState, IsoDate, Tone } from "./types";

export interface ScheduledStep {
  customerId: string;
  invoiceId: string;
  sequenceId: string;
  stepId: string;
  channel: "email" | "sms" | "letter";
  tone: Tone;
  intent: string;
  scheduledFor: IsoDate;
  requiresApproval: boolean;
  idempotencyKey: string;
}

/** The most-advanced step whose scheduled date is on/before `today`, value floor met. */
function currentDueStep(
  invoice: InvoiceArState,
  customer: Customer,
  sequence: ChaseSequence,
  today: IsoDate,
  tenantId: string,
): ScheduledStep | null {
  let due: ScheduledStep | null = null;
  for (const step of [...sequence.steps].sort((a, b) => a.offsetDays - b.offsetDays)) {
    if ((step.minAmount ?? 0) > invoice.chaseableDue) continue;
    const scheduledFor = nextBusinessDay(addDays(invoice.dueDate, step.offsetDays), customer.calendar);
    if (scheduledFor > today) break; // not yet reached this step (steps are ascending)
    due = {
      customerId: invoice.customerId,
      invoiceId: invoice.invoiceId,
      sequenceId: sequence.id,
      stepId: step.id,
      channel: step.channel,
      tone: step.tone,
      intent: step.intent,
      scheduledFor,
      requiresApproval: step.requiresApproval,
      idempotencyKey: deriveKey(tenantId, invoice.invoiceId, step.id, scheduledFor),
    };
  }
  return due;
}

/** Compute the due step for every chaseable open invoice. */
export function dueSteps(
  invoices: InvoiceArState[],
  customersById: Map<string, Customer>,
  sequencesById: Map<string, ChaseSequence>,
  today: IsoDate,
  tenantId: string,
): ScheduledStep[] {
  const out: ScheduledStep[] = [];
  for (const inv of invoices) {
    if (!inv.isChaseable) continue;
    const customer = customersById.get(inv.customerId);
    if (!customer || customer.doNotContact) continue;
    const sequence = sequencesById.get(customer.sequenceId);
    if (!sequence) continue;
    const step = currentDueStep(inv, customer, sequence, today, tenantId);
    if (step) out.push(step);
  }
  return out;
}
