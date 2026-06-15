/**
 * The orchestrator — one tenant, one day. Pull records → compute AR state → score →
 * rank the chase list → find each due step → (skip what's already handled, suppress
 * within cooldown) → draft the genuinely-new ones → emit audit events → return the
 * approval queue. It NEVER sends — sending is a separate, human-gated step.
 *
 * Two safety guarantees prove the "higher bar": run the cycle twice and each step is
 * drafted exactly once (dedupe via the audit log); apply a payment and the pending
 * step is cancelled (stop-on-payment).
 */

import type Anthropic from "@anthropic-ai/sdk";
import { computeArState } from "./ageing";
import { daysBetween } from "./calendar";
import { dueSteps } from "./cadence";
import { draftReminder } from "./draft";
import { buildFacts } from "./facts";
import { buildPriorityList, scoreCustomers } from "./scoring";
import type { AccountingSource } from "./source";
import type {
  ArSnapshot,
  AuditEvent,
  AuditEventType,
  BusinessProfile,
  ChaseSequence,
  DueChaseStep,
  IsoDate,
  PlutusUsage,
  PriorityItem,
  ReminderDraft,
} from "./types";

export interface QueueItem {
  step: DueChaseStep;
  draft?: ReminderDraft;
  status: "drafted" | "needs_approval";
}

export interface DailyCycleOptions {
  tenantId: string;
  business: BusinessProfile;
  source: AccountingSource;
  sequences: ChaseSequence[];
  today: IsoDate;
  priorEvents?: AuditEvent[];
  client?: Anthropic;
  apiKey?: string;
  scanOnly?: boolean; // skip drafting (no key) — produce the queue without drafts
  maxDrafts?: number; // cost cap, default 25
}

export interface DailyCycleResult {
  snapshot: ArSnapshot;
  priority: PriorityItem[];
  queue: QueueItem[];
  newEvents: AuditEvent[];
  usage: PlutusUsage;
}

function emptyUsage(): PlutusUsage {
  return { input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_write_tokens: 0, usd: 0 };
}
function addUsage(acc: PlutusUsage, u: PlutusUsage): void {
  acc.input_tokens += u.input_tokens;
  acc.output_tokens += u.output_tokens;
  acc.cache_read_tokens += u.cache_read_tokens;
  acc.cache_write_tokens += u.cache_write_tokens;
  acc.usd += u.usd;
}

const HANDLED: AuditEventType[] = ["draft_generated", "sent", "approved", "cancelled", "suppressed"];

export async function runDailyCycle(opts: DailyCycleOptions): Promise<DailyCycleResult> {
  const { tenantId, business, source, sequences, today } = opts;
  const prior = opts.priorEvents ?? [];
  const maxDrafts = opts.maxDrafts ?? 25;

  const [customers, invoices, payments] = await Promise.all([
    source.listCustomers(),
    source.listInvoices(),
    source.listPayments(),
  ]);

  const snapshot = computeArState(invoices, payments, today);
  const scores = scoreCustomers(invoices, snapshot.customers);
  const priority = buildPriorityList(scores, snapshot.customers);

  const customersById = new Map(customers.map((c) => [c.id, c]));
  const sequencesById = new Map(sequences.map((s) => [s.id, s]));
  const invoiceStateById = new Map(snapshot.invoices.map((s) => [s.invoiceId, s]));
  const invoiceById = new Map(invoices.map((i) => [i.id, i]));

  const due = dueSteps(snapshot.invoices, customersById, sequencesById, today, tenantId);

  const handledKeys = new Set(
    prior.filter((e) => HANDLED.includes(e.type) && e.idempotencyKey).map((e) => e.idempotencyKey),
  );
  const lastContact = new Map<string, IsoDate>();
  for (const e of prior) {
    if ((e.type === "draft_generated" || e.type === "sent") && e.customerId) {
      const d = e.occurredAt.slice(0, 10);
      if (!lastContact.has(e.customerId) || d > (lastContact.get(e.customerId) ?? "")) {
        lastContact.set(e.customerId, d);
      }
    }
  }

  const newEvents: AuditEvent[] = [];
  const queue: QueueItem[] = [];
  const usage = emptyUsage();
  const contactedThisCycle = new Set<string>();
  let seq = 0;
  const ev = (type: AuditEventType, partial: Partial<AuditEvent>): AuditEvent => {
    seq += 1;
    return {
      id: `${type}-${seq}`,
      tenantId,
      type,
      actor: { kind: "system", id: "plutus" },
      data: {},
      occurredAt: new Date().toISOString(),
      ...partial,
    };
  };

  let drafted = 0;
  for (const step of due) {
    if (handledKeys.has(step.idempotencyKey)) continue;

    // One reminder per customer per cycle (consolidation), then time-based cooldown.
    if (contactedThisCycle.has(step.customerId)) {
      newEvents.push(ev("suppressed", suppression(step, "one reminder per customer per cycle")));
      continue;
    }
    const cooldown = sequencesById.get(step.sequenceId)?.cooldownDays ?? 0;
    const last = lastContact.get(step.customerId);
    if (last && daysBetween(last, today) < cooldown) {
      newEvents.push(ev("suppressed", suppression(step, `cooldown (${cooldown}d)`)));
      continue;
    }

    const invState = invoiceStateById.get(step.invoiceId);
    const invoice = invoiceById.get(step.invoiceId);
    const customer = customersById.get(step.customerId);
    if (!invState || !invoice || !customer) continue;

    const facts = buildFacts(step, invState, invoice, customer, business);
    const dueStep: DueChaseStep = { ...step, facts };
    newEvents.push(ev("step_scheduled", { ...ref(step), data: { scheduledFor: step.scheduledFor, tone: step.tone } }));
    contactedThisCycle.add(step.customerId);

    if (opts.scanOnly || drafted >= maxDrafts) {
      queue.push({ step: dueStep, status: "needs_approval" });
      continue;
    }

    const draft = await draftReminder(facts, { client: opts.client, apiKey: opts.apiKey });
    draft.idempotencyKey = step.idempotencyKey;
    draft.customerId = step.customerId;
    draft.invoiceId = step.invoiceId;
    draft.stepId = step.stepId;
    draft.channel = step.channel;
    addUsage(usage, draft.usage);
    drafted += 1;

    newEvents.push(ev("draft_generated", { ...ref(step), data: { bodyHash: draft.bodyHash, factCheckPassed: draft.factCheckPassed } }));
    if (step.requiresApproval) newEvents.push(ev("approval_requested", ref(step)));
    queue.push({ step: dueStep, draft, status: step.requiresApproval ? "needs_approval" : "drafted" });
  }

  // Stop-on-payment: cancel any prior pending step whose invoice is now settled.
  const openIds = new Set(snapshot.invoices.map((s) => s.invoiceId));
  const terminal = new Set(prior.filter((e) => (e.type === "sent" || e.type === "cancelled") && e.idempotencyKey).map((e) => e.idempotencyKey));
  for (const e of prior) {
    if ((e.type === "draft_generated" || e.type === "approval_requested") && e.idempotencyKey && e.invoiceId) {
      if (terminal.has(e.idempotencyKey) || openIds.has(e.invoiceId)) continue;
      terminal.add(e.idempotencyKey);
      newEvents.push(
        ev("cancelled", {
          customerId: e.customerId,
          invoiceId: e.invoiceId,
          stepId: e.stepId,
          idempotencyKey: e.idempotencyKey,
          reason: "invoice settled",
        }),
      );
    }
  }

  return { snapshot, priority, queue, newEvents, usage };
}

function ref(step: { customerId: string; invoiceId: string; stepId: string; idempotencyKey: string }): Partial<AuditEvent> {
  return { customerId: step.customerId, invoiceId: step.invoiceId, stepId: step.stepId, idempotencyKey: step.idempotencyKey };
}
function suppression(
  step: { customerId: string; invoiceId: string; stepId: string; idempotencyKey: string },
  reason: string,
): Partial<AuditEvent> {
  return { ...ref(step), reason };
}
