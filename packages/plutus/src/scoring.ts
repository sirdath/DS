/**
 * Late-payment risk — deterministic rules, not ML (research: recency beats depth,
 * and a model on 12 customers overfits). The score is a weighted sum of explainable
 * features; behaviour features are shrunk toward zero when history is thin, so a
 * brand-new customer falls back to ageing-only and is flagged low-confidence.
 *
 * The chase list ranks by risk × value × urgency — reprioritising off "biggest
 * invoice first" onto "most likely to stay unpaid × most money × most overdue".
 * That reprioritisation is the product.
 */

import { daysBetween } from "./calendar";
import type {
  CustomerArState,
  Invoice,
  IsoDate,
  PriorityItem,
  RiskBand,
  RiskFeatureContribution,
  RiskScore,
} from "./types";

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}
function mean(ns: number[]): number {
  return ns.length ? ns.reduce((a, b) => a + b, 0) / ns.length : 0;
}
function termDays(invoice: Invoice): number {
  if (invoice.terms.kind === "net") return invoice.terms.days;
  if (invoice.terms.kind === "eom") return invoice.terms.days + 15;
  return 0;
}
function bandOf(score: number): RiskBand {
  if (score < 30) return "low";
  if (score < 55) return "medium";
  if (score < 75) return "high";
  return "severe";
}

export interface CustomerScoringInput {
  customerId: string;
  /** Settled invoices (paid), each with its due + paid date. */
  history: Array<{ dueDate: IsoDate; paidDate: IsoDate }>;
  oldestDaysOverdue: number; // from current AR
  longestTermDays: number; // max net-equivalent days across open invoices
}

/** Score one customer 0–100 with the per-feature "why". Pure. */
export function scoreCustomer(input: CustomerScoringInput): RiskScore {
  const depth = input.history.length;
  // Shrink behaviour features when history is thin (w→1 as depth grows). k=2 keeps
  // a 1–2 invoice customer cautious while trusting an established late payer.
  const w = depth === 0 ? 0 : depth / (depth + 2);

  const byRecent = [...input.history].sort((a, b) => b.paidDate.localeCompare(a.paidDate));
  const last3 = byRecent.slice(0, 3);
  const streak = last3.filter((h) => daysBetween(h.dueDate, h.paidDate) > 0).length; // 0..3
  const lateDays = input.history.map((h) => Math.max(0, daysBetween(h.dueDate, h.paidDate)));
  const avgDaysLate = mean(lateDays);
  const pctLate = depth ? input.history.filter((h) => daysBetween(h.dueDate, h.paidDate) > 0).length / depth : 0;
  const ageingFactor = clamp01(input.oldestDaysOverdue / 90); // observed fact — not shrunk
  const termsRisk = clamp01(input.longestTermDays / 60); // known regardless — not shrunk

  const cStreak = (streak / 3) * 35 * w;
  const cAvg = clamp01(avgDaysLate / 30) * 20 * w;
  const cPct = pctLate * 15 * w;
  const cAgeing = ageingFactor * 25;
  const cTerms = termsRisk * 5;

  const score = Math.round(cStreak + cAvg + cPct + cAgeing + cTerms);

  const contributions: RiskFeatureContribution[] = [
    {
      feature: "recent_late_streak",
      raw: streak,
      weight: 35,
      contribution: Math.round(cStreak),
      explanation: streak > 0 ? `paid ${streak} of the last 3 invoices late` : "recent invoices paid on time",
    },
    {
      feature: "days_overdue",
      raw: input.oldestDaysOverdue,
      weight: 25,
      contribution: Math.round(cAgeing),
      explanation: input.oldestDaysOverdue > 0 ? `oldest invoice is ${input.oldestDaysOverdue} days overdue` : "nothing overdue yet",
    },
    {
      feature: "avg_days_late",
      raw: Math.round(avgDaysLate),
      weight: 20,
      contribution: Math.round(cAvg),
      explanation: avgDaysLate > 0 ? `pays ${Math.round(avgDaysLate)} days late on average` : "no late-payment history",
    },
    {
      feature: "pct_late",
      raw: Math.round(pctLate * 100),
      weight: 15,
      contribution: Math.round(cPct),
      explanation: `${Math.round(pctLate * 100)}% of past invoices were late`,
    },
    {
      feature: "payment_terms",
      raw: input.longestTermDays,
      weight: 5,
      contribution: Math.round(cTerms),
      explanation: `${input.longestTermDays}-day terms`,
    },
  ].sort((a, b) => b.contribution - a.contribution);

  return {
    customerId: input.customerId,
    score,
    band: bandOf(score),
    historyDepth: depth,
    lowConfidence: depth < 3,
    predictedDaysLate: Math.round(avgDaysLate),
    contributions,
  };
}

/** Build per-customer scoring inputs from raw records + the AR snapshot, then score. */
export function scoreCustomers(invoices: Invoice[], customers: CustomerArState[]): RiskScore[] {
  return customers.map((c) => {
    const ofCustomer = invoices.filter((inv) => inv.customerId === c.customerId);
    const history = ofCustomer
      .filter((inv) => inv.status === "paid" && inv.paidDate)
      .map((inv) => ({ dueDate: inv.dueDate, paidDate: inv.paidDate as string }));
    const openTerms = ofCustomer
      .filter((inv) => inv.status === "open" || inv.status === "partially_paid")
      .map(termDays);
    const longestTermDays = openTerms.length ? Math.max(...openTerms) : 0;
    return scoreCustomer({ customerId: c.customerId, history, oldestDaysOverdue: c.oldestDaysOverdue, longestTermDays });
  });
}

/** Rank the chase list by risk × value × urgency. */
export function buildPriorityList(scores: RiskScore[], customers: CustomerArState[]): PriorityItem[] {
  const byId = new Map(scores.map((s) => [s.customerId, s]));
  const items: PriorityItem[] = [];
  for (const c of customers) {
    if (c.chaseableDue <= 0) continue;
    const risk = byId.get(c.customerId);
    if (!risk) continue;
    const urgency = c.oldestDaysOverdue > 0 ? 1 + Math.min(c.oldestDaysOverdue, 90) / 90 : 0.5;
    const exposureMajor = c.chaseableDue / 100;
    const priority = (risk.score / 100) * Math.log1p(exposureMajor) * urgency;
    items.push({
      customerId: c.customerId,
      rank: 0,
      risk,
      exposure: c.chaseableDue,
      oldestDaysOverdue: c.oldestDaysOverdue,
      priority: Math.round(priority * 1000) / 1000,
    });
  }
  items.sort((a, b) => b.priority - a.priority);
  items.forEach((it, i) => (it.rank = i + 1));
  return items;
}
