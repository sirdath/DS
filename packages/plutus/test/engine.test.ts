import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import {
  dueSteps,
  computeArState,
  InMemorySource,
  runDailyCycle,
  getSample,
  SAMPLE_TODAY,
  type AuditEvent,
  type Customer,
  type ChaseSequence,
  type Payment,
} from "../src/index";

const T = getSample();
const USAGE = { input_tokens: 200, output_tokens: 80, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };

/** A fake Claude that reads the facts and returns a faithful draft (passes fact-check). */
function fakeClient(): Anthropic {
  const create = (params: { messages: Array<{ content: string }> }) => {
    const content = params.messages[0]?.content ?? "";
    const json = content.slice(content.indexOf("{"), content.lastIndexOf("}") + 1);
    const f = JSON.parse(json) as { contactName: string; invoiceNumber: string; amountDue: number; daysOverdue: number; businessName: string };
    const amount = (f.amountDue / 100).toFixed(2);
    const body = `Dear ${f.contactName}, invoice ${f.invoiceNumber} for €${amount} is ${f.daysOverdue} days overdue. Please arrange payment, and let us know of any issue. — ${f.businessName}`;
    return Promise.resolve({
      stop_reason: "end_turn",
      content: [{ type: "text", text: JSON.stringify({ subject: `${f.businessName}: invoice ${f.invoiceNumber}`, body }) }],
      usage: USAGE,
    });
  };
  return { messages: { create } } as unknown as Anthropic;
}

function source() {
  return new InMemorySource({ customers: T.customers, invoices: T.invoices, payments: T.payments });
}
function countType(events: AuditEvent[], type: string): number {
  return events.filter((e) => e.type === type).length;
}

describe("cadence — dueSteps", () => {
  it("should pick the most-advanced reached step and skip not-yet-due invoices", () => {
    const snap = computeArState(T.invoices, T.payments, SAMPLE_TODAY);
    const customersById = new Map<string, Customer>(T.customers.map((c) => [c.id, c]));
    const seqById = new Map<string, ChaseSequence>(T.sequences.map((s) => [s.id, s]));
    const steps = dueSteps(snap.invoices, customersById, seqById, SAMPLE_TODAY, "meraki");

    const byCustomer = new Map(steps.map((s) => [s.customerId, s]));
    expect(byCustomer.get("kallisto")?.stepId).toBe("r5"); // +45 reached at 45d overdue
    expect(byCustomer.get("aigaio")?.stepId).toBe("r3"); // +14 reached at 15d
    expect(byCustomer.has("helios")).toBe(false); // not yet due
  });

  it("should derive a stable idempotency key", () => {
    const snap = computeArState(T.invoices, T.payments, SAMPLE_TODAY);
    const customersById = new Map<string, Customer>(T.customers.map((c) => [c.id, c]));
    const seqById = new Map<string, ChaseSequence>(T.sequences.map((s) => [s.id, s]));
    const a = dueSteps(snap.invoices, customersById, seqById, SAMPLE_TODAY, "meraki");
    const b = dueSteps(snap.invoices, customersById, seqById, SAMPLE_TODAY, "meraki");
    expect(a[0]?.idempotencyKey).toBe(b[0]?.idempotencyKey);
  });
});

describe("runDailyCycle", () => {
  const base = { tenantId: T.tenantId, business: T.business, sequences: T.sequences, today: SAMPLE_TODAY } as const;

  it("should produce the AR snapshot, ranked chase list and an approval queue", async () => {
    const result = await runDailyCycle({ ...base, source: source(), client: fakeClient() });
    expect(result.snapshot.kpis.totalAr).toBeGreaterThan(0);
    expect(result.priority[0]?.customerId).toBe("kallisto"); // chronic + biggest + most overdue
    expect(result.queue.length).toBe(4); // kallisto, olympus, aigaio, nefeli (helios not due)
    expect(result.queue.every((q) => q.draft?.factCheckPassed)).toBe(true);
  });

  it("should draft each step exactly once across repeated cycles", async () => {
    const cycle1 = await runDailyCycle({ ...base, source: source(), client: fakeClient() });
    expect(countType(cycle1.newEvents, "draft_generated")).toBe(4);

    const cycle2 = await runDailyCycle({ ...base, source: source(), client: fakeClient(), priorEvents: cycle1.newEvents });
    expect(countType(cycle2.newEvents, "draft_generated")).toBe(0); // all already handled
    expect(cycle2.queue.length).toBe(0);
  });

  it("should cancel a pending step when the invoice is paid (stop-on-payment)", async () => {
    const cycle1 = await runDailyCycle({ ...base, source: source(), client: fakeClient() });
    const kallistoKey = cycle1.newEvents.find((e) => e.invoiceId === "i-kallisto-open" && e.type === "draft_generated")?.idempotencyKey;
    expect(kallistoKey).toBeTruthy();

    // Kallisto pays the open invoice in full.
    const payment: Payment = { id: "pay-k", invoiceId: "i-kallisto-open", customerId: "kallisto", amount: 420000, date: "2026-06-16" };
    const paidSource = new InMemorySource({ customers: T.customers, invoices: T.invoices, payments: [payment] });

    const cycle2 = await runDailyCycle({ ...base, source: paidSource, client: fakeClient(), priorEvents: cycle1.newEvents });
    const cancelled = cycle2.newEvents.find((e) => e.type === "cancelled" && e.invoiceId === "i-kallisto-open");
    expect(cancelled).toBeTruthy();
    expect(cancelled?.reason).toContain("settled");
    expect(cycle2.queue.find((q) => q.step.invoiceId === "i-kallisto-open")).toBeUndefined();
  });

  it("should produce the queue without drafts in scan-only mode (no key/cost)", async () => {
    const result = await runDailyCycle({ ...base, source: source(), scanOnly: true });
    expect(result.queue.length).toBe(4);
    expect(result.queue.every((q) => q.draft === undefined)).toBe(true);
    expect(result.queue.every((q) => q.status === "needs_approval")).toBe(true);
    expect(result.usage.usd).toBe(0);
  });

  it("should respect do-not-contact", async () => {
    const customers: Customer[] = T.customers.map((c) => (c.id === "kallisto" ? { ...c, doNotContact: true } : c));
    const src = new InMemorySource({ customers, invoices: T.invoices, payments: T.payments });
    const result = await runDailyCycle({ ...base, source: src, scanOnly: true });
    expect(result.queue.find((q) => q.step.customerId === "kallisto")).toBeUndefined();
  });
});
