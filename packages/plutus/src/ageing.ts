/**
 * The money math — pure. Given raw invoices + the payment ledger + an injected
 * `today`, compute the AR state (per invoice, per customer) and the headline KPIs.
 * No clock, no network: tests pin `today` and assert exact buckets and figures.
 *
 * Invariant per invoice: amountDue = amount − amountPaid − amountWrittenOff (≥ 0).
 */

import { daysBetween } from "./calendar";
import type {
  AgeingBucket,
  ArKpis,
  ArSnapshot,
  Currency,
  CustomerArState,
  Invoice,
  InvoiceArState,
  IsoDate,
  Minor,
  Payment,
} from "./types";

const BUCKETS: AgeingBucket[] = ["current", "1-30", "31-60", "61-90", "90+"];
const DSO_WINDOW_DAYS = 90;

function emptyBuckets(): Record<AgeingBucket, Minor> {
  return { current: 0, "1-30": 0, "31-60": 0, "61-90": 0, "90+": 0 };
}

function bucketOf(daysOverdue: number): AgeingBucket {
  if (daysOverdue <= 0) return "current";
  if (daysOverdue <= 30) return "1-30";
  if (daysOverdue <= 60) return "31-60";
  if (daysOverdue <= 90) return "61-90";
  return "90+";
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** Compute one invoice's AR state from its payments. */
function invoiceState(invoice: Invoice, payments: Payment[], today: IsoDate): InvoiceArState | null {
  const paid = payments.filter((p) => p.invoiceId === invoice.id).reduce((s, p) => s + p.amount, 0);
  const writtenOff = invoice.amountWrittenOff ?? 0;
  const amountDue = Math.max(0, invoice.amount - paid - writtenOff);
  const isOpen = (invoice.status === "open" || invoice.status === "partially_paid") && amountDue > 0;
  if (!isOpen) return null;

  const daysOverdue = Math.max(0, daysBetween(invoice.dueDate, today));
  const amountDisputed = Math.min(invoice.dispute?.amount ?? 0, amountDue);
  const chaseableDue = Math.max(0, amountDue - amountDisputed);
  return {
    invoiceId: invoice.id,
    customerId: invoice.customerId,
    number: invoice.number,
    currency: invoice.currency,
    dueDate: invoice.dueDate,
    amount: invoice.amount,
    amountPaid: paid,
    amountDue,
    amountDisputed,
    chaseableDue,
    daysOverdue,
    bucket: bucketOf(daysOverdue),
    isOverdue: daysOverdue > 0,
    isChaseable: chaseableDue > 0,
  };
}

function groupCustomers(states: InvoiceArState[]): CustomerArState[] {
  const byCustomer = new Map<string, InvoiceArState[]>();
  for (const s of states) {
    const list = byCustomer.get(s.customerId) ?? [];
    list.push(s);
    byCustomer.set(s.customerId, list);
  }
  const out: CustomerArState[] = [];
  for (const [customerId, list] of byCustomer) {
    const buckets = emptyBuckets();
    let totalDue = 0;
    let chaseableDue = 0;
    let oldest = 0;
    for (const s of list) {
      buckets[s.bucket] += s.amountDue;
      totalDue += s.amountDue;
      chaseableDue += s.chaseableDue;
      if (s.daysOverdue > oldest) oldest = s.daysOverdue;
    }
    out.push({
      customerId,
      currency: list[0]?.currency ?? "EUR",
      openInvoices: [...list].sort((a, b) => b.daysOverdue - a.daysOverdue),
      totalDue,
      chaseableDue,
      oldestDaysOverdue: oldest,
      worstBucket: bucketOf(oldest),
      buckets,
    });
  }
  return out.sort((a, b) => b.chaseableDue - a.chaseableDue);
}

function computeKpis(open: InvoiceArState[], allInvoices: Invoice[], payments: Payment[], today: IsoDate): ArKpis {
  const buckets = emptyBuckets();
  let totalAr = 0;
  let currentAr = 0;
  for (const s of open) {
    buckets[s.bucket] += s.amountDue;
    totalAr += s.amountDue;
    if (!s.isOverdue) currentAr += s.amountDue;
  }
  const pastDueAr = totalAr - currentAr;

  // Credit sales over the trailing DSO window (invoices issued in the last N days).
  const windowStart = daysBetween("1970-01-01", today) - DSO_WINDOW_DAYS;
  const creditSales = allInvoices
    .filter((inv) => daysBetween("1970-01-01", inv.issueDate) >= windowStart)
    .reduce((s, inv) => s + inv.amount, 0);
  const dso = creditSales > 0 ? round1((totalAr / creditSales) * DSO_WINDOW_DAYS) : 0;
  const bestPossibleDso = creditSales > 0 ? round1((currentAr / creditSales) * DSO_WINDOW_DAYS) : 0;

  // Average days-to-pay over settled invoices that have a paid date.
  const settled = allInvoices.filter((inv) => inv.status === "paid" && inv.paidDate);
  const avgDaysToPay = settled.length
    ? round1(settled.reduce((s, inv) => s + daysBetween(inv.issueDate, inv.paidDate ?? inv.issueDate), 0) / settled.length)
    : 0;

  const bucketPct = emptyBuckets() as unknown as Record<AgeingBucket, number>;
  for (const b of BUCKETS) bucketPct[b] = totalAr > 0 ? Math.round((buckets[b] / totalAr) * 100) / 100 : 0;

  return {
    totalAr,
    currentAr,
    pastDueAr,
    pastDuePct: totalAr > 0 ? Math.round((pastDueAr / totalAr) * 100) / 100 : 0,
    dso,
    bestPossibleDso,
    averageDaysDelinquent: round1(dso - bestPossibleDso),
    avgDaysToPay,
    buckets,
    bucketPct,
  };
}

/** Turn raw records into the canonical AR snapshot for one tenant at `today`. */
export function computeArState(invoices: Invoice[], payments: Payment[], today: IsoDate): ArSnapshot {
  const open = invoices.map((inv) => invoiceState(inv, payments, today)).filter((s): s is InvoiceArState => s !== null);
  const currency: Currency = open[0]?.currency ?? invoices[0]?.currency ?? "EUR";
  return {
    asOf: today,
    currency,
    invoices: open.sort((a, b) => b.daysOverdue - a.daysOverdue),
    customers: groupCustomers(open),
    kpis: computeKpis(open, invoices, payments, today),
  };
}
