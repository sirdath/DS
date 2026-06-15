/**
 * Assemble the frozen facts a reminder is allowed to state — all code-computed.
 * This is the contract boundary with Claude: the draft layer receives only these
 * facts and may not recompute anything. The statutory note is offered only at the
 * formal/final stages and stated factually (the right exists), never as a threat.
 */

import type { ScheduledStep } from "./cadence";
import { formatMoney } from "./money";
import type { BusinessProfile, Customer, Invoice, InvoiceArState, ReminderFacts, Tone } from "./types";

function isUk(currency: string, calendar: string): boolean {
  return currency === "GBP" || calendar === "GB";
}

function ukCompensation(amountMinor: number): string {
  const major = amountMinor / 100;
  if (major < 1000) return "£40";
  if (major < 10000) return "£70";
  return "£100";
}

/** A factual statutory-interest line for the formal stages, or undefined. */
function statutoryNote(invoice: InvoiceArState, customer: Customer, tone: Tone): string | undefined {
  if (tone !== "formal" && tone !== "final") return undefined;
  if (!invoice.isOverdue) return undefined;
  if (isUk(invoice.currency, customer.calendar)) {
    return `Under the Late Payment of Commercial Debts (Interest) Act 1998, this overdue commercial invoice may accrue statutory interest (8% plus the Bank of England base rate) and a fixed sum of ${ukCompensation(invoice.chaseableDue)} in compensation.`;
  }
  return `Under EU Directive 2011/7 on late payment in commercial transactions, this overdue invoice may accrue statutory interest (the ECB reference rate plus 8 percentage points) and a minimum of €40 in recovery costs.`;
}

export function buildFacts(
  step: ScheduledStep,
  invoiceState: InvoiceArState,
  invoice: Invoice,
  customer: Customer,
  business: BusinessProfile,
): ReminderFacts {
  const note = statutoryNote(invoiceState, customer, step.tone);
  return {
    businessName: business.name,
    customerName: customer.name,
    contactName: customer.contacts[0]?.name ?? customer.name,
    invoiceNumber: invoiceState.number,
    currency: invoiceState.currency,
    amountDue: invoiceState.chaseableDue,
    daysOverdue: invoiceState.daysOverdue,
    dueDate: invoiceState.dueDate,
    issueDate: invoice.issueDate,
    tone: step.tone,
    intent: step.intent,
    lang: customer.lang,
    ...(business.payToInstructions ? { payToInstructions: business.payToInstructions } : {}),
    ...(note ? { statutoryNote: note } : {}),
  };
}

/** The display string of the amount due (for UI/report). */
export function factsAmountDisplay(facts: ReminderFacts): string {
  return formatMoney(facts.amountDue, facts.currency);
}
