/**
 * Plutus data contract. The organizing principle: code owns every number and the
 * schedule; Claude only writes prose. So the model splits cleanly into facts we
 * compute (invoices, payments, AR state, risk, the due chase step) and the one
 * thing the model produces (a reminder draft), with an immutable audit event as
 * the record of what actually happened.
 *
 * Money is integer minor units (cents) everywhere — never floats. Business dates
 * are ISO date-only (YYYY-MM-DD); audit timestamps are ISO instants.
 */

export type Lang = "el" | "en";
export type Currency = "EUR" | "GBP" | "USD";
/** Money in integer minor units (cents / pence / λεπτά). Never a float. */
export type Minor = number;
/** Date-only, ISO 8601, e.g. "2026-06-15" — the engine's business clock. */
export type IsoDate = string;
/** An instant, ISO 8601, e.g. "2026-06-15T09:30:00.000Z" — audit only. */
export type IsoInstant = string;

/** Payment terms, structured — never a free string. */
export type PaymentTerms =
  | { kind: "due_on_receipt" }
  | { kind: "net"; days: number } // "Net 30"
  | { kind: "eom"; days: number }; // end-of-month + days

export interface Contact {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
}

/** Who we chase. The chase happens at the customer level (invoices consolidated). */
export interface Customer {
  id: string;
  name: string;
  contacts: Contact[];
  lang: Lang;
  /** Holiday calendar key for business-day rolling: "GR" | "GB". */
  calendar: string;
  /** Suppress all contact (legal hold, agency handoff, opt-out). */
  doNotContact?: boolean;
  /** Which chase sequence this customer is enrolled in (segment). */
  sequenceId: string;
}

/**
 * Persisted, fact-of-record status. "overdue" is NOT here — it is derived
 * (open/partially_paid AND today > dueDate), so there's no nightly flip to drift.
 */
export type InvoiceStatus =
  | "open"
  | "partially_paid"
  | "paid"
  | "written_off"
  | "in_collections";

export interface Dispute {
  amount: Minor;
  reason: string;
  openedDate: IsoDate;
}

export interface Invoice {
  id: string;
  number: string; // human/legal reference
  customerId: string;
  currency: Currency;
  issueDate: IsoDate;
  dueDate: IsoDate; // stored as-issued, not recomputed on read
  terms: PaymentTerms;
  amount: Minor; // gross invoiced total
  status: InvoiceStatus;
  paidDate?: IsoDate | null; // date the balance first hit zero (for DSO)
  dispute?: Dispute | null; // orthogonal to payment status
  amountWrittenOff?: Minor;
}

/** An applied-cash ledger entry; an invoice's amountPaid is the sum of these. */
export interface Payment {
  id: string;
  invoiceId: string;
  customerId: string;
  amount: Minor; // + cash in, − reversal/chargeback
  date: IsoDate;
  method?: "transfer" | "card" | "cash" | "cheque" | "other";
  reference?: string;
}

// ── Computed AR state (pure output of ageing.ts; never persisted as truth) ──

export type AgeingBucket = "current" | "1-30" | "31-60" | "61-90" | "90+";

export interface InvoiceArState {
  invoiceId: string;
  customerId: string;
  number: string;
  currency: Currency;
  dueDate: IsoDate;
  amount: Minor;
  amountPaid: Minor; // = Σ payments
  amountDue: Minor; // amount − amountPaid − amountWrittenOff (≥ 0)
  amountDisputed: Minor;
  chaseableDue: Minor; // amountDue − amountDisputed
  daysOverdue: number; // max(0, today − dueDate)
  bucket: AgeingBucket;
  isOverdue: boolean;
  isChaseable: boolean;
}

export interface CustomerArState {
  customerId: string;
  currency: Currency;
  openInvoices: InvoiceArState[];
  totalDue: Minor;
  chaseableDue: Minor;
  oldestDaysOverdue: number;
  worstBucket: AgeingBucket;
  buckets: Record<AgeingBucket, Minor>;
}

export interface ArKpis {
  totalAr: Minor;
  currentAr: Minor; // not-yet-due portion
  pastDueAr: Minor;
  pastDuePct: number; // 0..1
  dso: number; // days sales outstanding (trailing window)
  bestPossibleDso: number; // currentAR-only DSO (the floor)
  averageDaysDelinquent: number; // DSO − BPDSO
  avgDaysToPay: number; // mean (paidDate − issueDate) over paid invoices in window
  buckets: Record<AgeingBucket, Minor>;
  bucketPct: Record<AgeingBucket, number>;
}

export interface ArSnapshot {
  asOf: IsoDate;
  currency: Currency;
  invoices: InvoiceArState[];
  customers: CustomerArState[];
  kpis: ArKpis;
}

// ── Risk (deterministic, explainable) ──

export type RiskBand = "low" | "medium" | "high" | "severe";

export interface RiskFeatureContribution {
  feature: string;
  raw: number; // measured value
  weight: number;
  contribution: number; // points added to the 0..100 score
  explanation: string; // one human sentence for the UI
}

export interface RiskScore {
  customerId: string;
  score: number; // 0..100
  band: RiskBand;
  /** How much history backs this — drives the confidence chip. */
  historyDepth: number;
  lowConfidence: boolean; // true when history is too thin to trust a number
  predictedDaysLate: number; // deterministic expectation from history
  contributions: RiskFeatureContribution[]; // the "why", strongest first
}

/** A row of the chase worklist: priority = risk × value × urgency. */
export interface PriorityItem {
  customerId: string;
  rank: number;
  risk: RiskScore;
  exposure: Minor; // chaseable due
  oldestDaysOverdue: number;
  priority: number; // the sort key
}

// ── Chase sequence (configurable cadence; engine selects per customer) ──

export type Channel = "email" | "sms" | "letter";
export type Tone = "friendly" | "neutral" | "firm" | "formal" | "final";

export interface ChaseStep {
  id: string; // stable within a sequence, e.g. "pre_due", "r1", "final"
  offsetDays: number; // relative to the invoice dueDate; negative = before due
  channel: Channel;
  tone: Tone;
  /** Short note Claude uses to shape the message intent, e.g. "offer a payment plan". */
  intent: string;
  requiresApproval: boolean;
  minAmount?: Minor; // only run this step if chaseableDue ≥ this
}

export interface ChaseSequence {
  id: string;
  name: string;
  steps: ChaseStep[]; // ordered by offsetDays ascending
  cooldownDays: number; // min days between any two sends to one customer
}

/** A step that is due now for a specific invoice (output of cadence.ts). */
export interface DueChaseStep {
  customerId: string;
  invoiceId: string;
  sequenceId: string;
  stepId: string;
  channel: Channel;
  tone: Tone;
  intent: string;
  scheduledFor: IsoDate; // rolled to the next business day
  requiresApproval: boolean;
  facts: ReminderFacts; // the deterministic facts the draft must use verbatim
  idempotencyKey: string; // stable dedupe key
}

/** The creditor (the DS2 client using Plutus) — the sender of every reminder. */
export interface BusinessProfile {
  name: string;
  lang: Lang;
  calendar: string;
  payToInstructions?: string; // e.g. IBAN / payment-portal link, passed through verbatim
}

/** Everything the prose layer is allowed to state — all code-computed. */
export interface ReminderFacts {
  businessName: string; // who the reminder is from
  customerName: string;
  contactName: string;
  invoiceNumber: string;
  currency: Currency;
  amountDue: Minor; // the number the draft must quote, unchanged
  daysOverdue: number;
  dueDate: IsoDate;
  issueDate: IsoDate;
  tone: Tone;
  intent: string;
  lang: Lang;
  payToInstructions?: string;
  /** Optional factual statutory-interest line the owner may keep at formal stages. */
  statutoryNote?: string;
}

// ── Reminder draft (the one Claude output) ──

export interface ReminderDraft {
  idempotencyKey: string;
  customerId: string;
  invoiceId: string;
  stepId: string;
  lang: Lang;
  channel: Channel;
  subject: string;
  body: string;
  bodyHash: string; // proof of exact wording
  factCheckPassed: boolean;
  factCheckIssues: string[];
  usage: PlutusUsage;
}

// ── Approval ──

export type ApprovalStatus = "pending" | "approved" | "rejected" | "edited";

export interface Approval {
  idempotencyKey: string;
  status: ApprovalStatus;
  finalSubject?: string;
  finalBody?: string;
  actorId: string;
  comment?: string;
  decidedAt: IsoInstant;
}

// ── Immutable audit event (append-only; the source of truth) ──

export type AuditEventType =
  | "step_scheduled"
  | "draft_generated"
  | "approval_requested"
  | "approved"
  | "rejected"
  | "edited"
  | "sent"
  | "delivered"
  | "bounced"
  | "cancelled" // stop-on-payment / superseded
  | "suppressed" // dispute / cooldown / do-not-contact
  | "payment_applied";

export interface AuditEvent {
  id: string;
  tenantId: string;
  type: AuditEventType;
  customerId?: string;
  invoiceId?: string;
  stepId?: string;
  idempotencyKey?: string; // ties scheduled→draft→approval→send together
  actor: { kind: "system" | "user"; id: string };
  reason?: string;
  data: Record<string, unknown>;
  occurredAt: IsoInstant;
}

// ── Usage / cost (identical shape to fama/xenia/aegis) ──

export interface PlutusUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  usd: number;
}
