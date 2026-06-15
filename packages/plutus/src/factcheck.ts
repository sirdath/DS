/**
 * The fact-fidelity guard — pure. After Claude drafts a reminder, verify the prose
 * actually quotes the facts it was given: the invoice number and the exact amount
 * due must appear. A draft that misstates or omits them fails the check and never
 * reaches the approval queue clean. This is what makes the model layer safe — the
 * numbers are code's, and we prove the prose didn't drift from them.
 */

import { amountVariants } from "./money";
import type { ReminderFacts } from "./types";

export interface FactCheckResult {
  passed: boolean;
  issues: string[];
}

export function factCheck(subject: string, body: string, facts: ReminderFacts): FactCheckResult {
  const text = `${subject}\n${body}`;
  const issues: string[] = [];

  if (!text.includes(facts.invoiceNumber)) {
    issues.push(`invoice number "${facts.invoiceNumber}" is missing from the draft`);
  }

  const variants = amountVariants(facts.amountDue);
  if (!variants.some((v) => text.includes(v))) {
    issues.push(`the amount due (${variants[0]}) is missing from the draft`);
  }

  // Cheap marketing-content guard — a reminder must never carry promotional copy.
  const marketing = /\b(discount|sale|upgrade|new plan|offer ends|limited time|promo)\b/i;
  if (marketing.test(text)) {
    issues.push("draft appears to contain marketing/promotional content");
  }

  return { passed: issues.length === 0, issues };
}
