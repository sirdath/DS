/**
 * A sample tenant — "Meraki Studio", an Athens creative/dev studio chasing its B2B
 * clients. Five customers with deliberately different payment behaviour (a chronic
 * late payer, a reliable one, a thin-history newcomer, …) so the score, the chase
 * list and the cadence all show their range. Used by the demo and the workspace
 * preview. Pin `today` to 2026-06-15 for the dates below to line up.
 */

import type { BusinessProfile, ChaseSequence, Customer, Invoice, Payment } from "./types";

export const SAMPLE_TODAY = "2026-06-15";

export const SAMPLE_BUSINESS: BusinessProfile = {
  name: "Meraki Studio",
  lang: "el",
  calendar: "GR",
  payToInstructions: "Τραπεζική κατάθεση: GR16 0110 1250 0000 0001 2345 678 (Meraki Studio).",
};

const STANDARD_SEQUENCE: ChaseSequence = {
  id: "standard",
  name: "Standard B2B",
  cooldownDays: 5,
  steps: [
    { id: "pre_due", offsetDays: -3, channel: "email", tone: "friendly", intent: "a warm heads-up that the invoice is due soon", requiresApproval: false },
    { id: "on_due", offsetDays: 0, channel: "email", tone: "friendly", intent: "due today — make it easy to pay", requiresApproval: false },
    { id: "r1", offsetDays: 3, channel: "email", tone: "neutral", intent: "a polite first overdue note, assume it crossed with their payment run", requiresApproval: false },
    { id: "r2", offsetDays: 7, channel: "email", tone: "firm", intent: "state it is overdue and invite them to flag any problem with the invoice", requiresApproval: true },
    { id: "r3", offsetDays: 14, channel: "email", tone: "firm", intent: "acknowledge cash-flow happens and offer a payment plan", requiresApproval: true },
    { id: "r4", offsetDays: 30, channel: "email", tone: "formal", intent: "a first formal notice summarising the situation", requiresApproval: true },
    { id: "r5", offsetDays: 45, channel: "email", tone: "formal", intent: "a serious notice with a firm pay-by date", requiresApproval: true },
    { id: "final", offsetDays: 60, channel: "email", tone: "final", intent: "a final notice before escalation", requiresApproval: true },
  ],
};

export const SAMPLE_SEQUENCES: ChaseSequence[] = [STANDARD_SEQUENCE];

export const SAMPLE_CUSTOMERS: Customer[] = [
  { id: "kallisto", name: "Kallisto Retail", lang: "el", calendar: "GR", sequenceId: "standard", contacts: [{ name: "Δήμητρα Παππά", email: "accounts@kallisto.gr", role: "Λογιστήριο" }] },
  { id: "olympus", name: "Olympus Tech", lang: "en", calendar: "GR", sequenceId: "standard", contacts: [{ name: "George Manolas", email: "finance@olympustech.io" }] },
  { id: "aigaio", name: "Aigaio Tours", lang: "el", calendar: "GR", sequenceId: "standard", contacts: [{ name: "Νίκος Βλαχάκης", email: "logistirio@aigaiotours.gr" }] },
  { id: "nefeli", name: "Nefeli Cafe", lang: "el", calendar: "GR", sequenceId: "standard", contacts: [{ name: "Ελένη Σάββα", email: "eleni@nefeli.cafe" }] },
  { id: "helios", name: "Helios Foods", lang: "en", calendar: "GR", sequenceId: "standard", contacts: [{ name: "Maria Costa", email: "ap@heliosfoods.com" }] },
];

function inv(
  id: string,
  number: string,
  customerId: string,
  issueDate: string,
  netDays: number,
  amountEur: number,
  open: boolean,
  paidDate?: string,
): Invoice {
  const due = addNet(issueDate, netDays);
  return {
    id,
    number,
    customerId,
    currency: "EUR",
    issueDate,
    dueDate: due,
    terms: { kind: "net", days: netDays },
    amount: Math.round(amountEur * 100),
    status: open ? "open" : "paid",
    paidDate: open ? null : (paidDate ?? null),
  };
}
function addNet(date: string, n: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export const SAMPLE_INVOICES: Invoice[] = [
  // Open AR (current outstanding)
  inv("i-kallisto-open", "INV-1042", "kallisto", "2026-04-01", 30, 4200, true), // due 2026-05-01 → ~45d overdue
  inv("i-olympus-open", "INV-1045", "olympus", "2026-04-20", 30, 3100, true), // due 2026-05-20 → ~26d
  inv("i-aigaio-open", "INV-1048", "aigaio", "2026-05-01", 30, 2600, true), // due 2026-05-31 → ~15d
  inv("i-nefeli-open", "INV-1052", "nefeli", "2026-05-10", 15, 640, true), // due 2026-05-25 → ~21d
  inv("i-helios-open", "INV-1050", "helios", "2026-06-05", 30, 1800, true), // due 2026-07-05 → not yet due

  // Settled history (drives the risk score + avg days-to-pay)
  inv("i-kallisto-h1", "INV-0980", "kallisto", "2026-01-15", 30, 3800, false, "2026-03-20"), // 33d late
  inv("i-kallisto-h2", "INV-1001", "kallisto", "2026-02-15", 30, 4100, false, "2026-04-10"), // ~24d late
  inv("i-kallisto-h3", "INV-1020", "kallisto", "2026-03-15", 30, 3500, false, "2026-05-20"), // ~36d late
  inv("i-olympus-h1", "INV-1006", "olympus", "2026-02-10", 30, 2900, false, "2026-03-22"), // ~10d late
  inv("i-olympus-h2", "INV-1031", "olympus", "2026-03-10", 30, 3200, false, "2026-04-20"), // ~11d late
  inv("i-aigaio-h1", "INV-1011", "aigaio", "2026-02-20", 30, 2400, false, "2026-03-28"), // ~7d late
  inv("i-aigaio-h2", "INV-1036", "aigaio", "2026-03-20", 30, 2700, false, "2026-04-19"), // on time
  inv("i-nefeli-h1", "INV-1019", "nefeli", "2026-03-12", 15, 580, false, "2026-03-29"), // ~2d late (thin history)
  inv("i-helios-h1", "INV-1005", "helios", "2026-04-05", 30, 1700, false, "2026-05-03"), // early
  inv("i-helios-h2", "INV-1030", "helios", "2026-05-05", 30, 1900, false, "2026-06-03"), // early
];

export const SAMPLE_PAYMENTS: Payment[] = [];

export const SAMPLE_TENANT = {
  tenantId: "meraki",
  business: SAMPLE_BUSINESS,
  sequences: SAMPLE_SEQUENCES,
  customers: SAMPLE_CUSTOMERS,
  invoices: SAMPLE_INVOICES,
  payments: SAMPLE_PAYMENTS,
} as const;

export function getSample() {
  return SAMPLE_TENANT;
}
