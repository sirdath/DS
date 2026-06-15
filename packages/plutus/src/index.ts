/**
 * Plutus — DS2's accounts-receivable collections engine. Ingests invoices /
 * customers / payments, computes the AR state + a deterministic risk×value chase
 * list ("who to chase first"), and uses Claude only to draft bilingual (Greek /
 * English) escalating reminders that a human approves before sending. The core is
 * pure and auditable; the model writes prose and nothing else.
 *
 * Primary entry point: `runDailyCycle(opts) → DailyCycleResult`.
 */

export { runDailyCycle } from "./engine";
export type { DailyCycleOptions, DailyCycleResult, QueueItem } from "./engine";

export { computeArState } from "./ageing";
export { scoreCustomer, scoreCustomers, buildPriorityList } from "./scoring";
export type { CustomerScoringInput } from "./scoring";
export { dueSteps } from "./cadence";
export type { ScheduledStep } from "./cadence";
export { deriveKey } from "./idempotency";
export { buildFacts, factsAmountDisplay } from "./facts";
export { factCheck } from "./factcheck";
export type { FactCheckResult } from "./factcheck";
export { dueDateFor } from "./terms";
export { addDays, daysBetween, endOfMonth, nextBusinessDay, isBusinessDay, isWeekend } from "./calendar";
export { formatMoney, amountVariants } from "./money";

export { draftReminder } from "./draft";
export type { DraftOptions } from "./draft";

export type { AccountingSource, SourceData } from "./source";
export { InMemorySource } from "./source";
export type { Channel, OutboundMessage, SendResult, DispatchOutcome } from "./channels";
export { StubChannel, SpyChannel, dispatch } from "./channels";

export { getClient, costUsd, DRAFT_MODEL } from "./client";
export type { RawUsage } from "./client";

export { renderReport } from "./report";

export {
  SAMPLE_TENANT,
  SAMPLE_TODAY,
  SAMPLE_BUSINESS,
  SAMPLE_SEQUENCES,
  SAMPLE_CUSTOMERS,
  SAMPLE_INVOICES,
  SAMPLE_PAYMENTS,
  getSample,
} from "./samples";

export type {
  Lang,
  Currency,
  Minor,
  IsoDate,
  IsoInstant,
  PaymentTerms,
  Contact,
  Customer,
  InvoiceStatus,
  Dispute,
  Invoice,
  Payment,
  AgeingBucket,
  InvoiceArState,
  CustomerArState,
  ArKpis,
  ArSnapshot,
  RiskBand,
  RiskFeatureContribution,
  RiskScore,
  PriorityItem,
  Channel as ChannelKind,
  Tone,
  ChaseStep,
  ChaseSequence,
  DueChaseStep,
  BusinessProfile,
  ReminderFacts,
  ReminderDraft,
  ApprovalStatus,
  Approval,
  AuditEventType,
  AuditEvent,
  PlutusUsage,
} from "./types";
