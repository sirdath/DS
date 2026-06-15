import { describe, expect, it } from "vitest";
import {
  addDays,
  amountVariants,
  buildPriorityList,
  computeArState,
  costUsd,
  daysBetween,
  dueDateFor,
  factCheck,
  isBusinessDay,
  nextBusinessDay,
  scoreCustomer,
  scoreCustomers,
  type Invoice,
  type ReminderFacts,
} from "../src/index";

describe("terms — dueDateFor", () => {
  it("should resolve net / eom / on-receipt", () => {
    expect(dueDateFor("2026-04-01", { kind: "net", days: 30 })).toBe("2026-05-01");
    expect(dueDateFor("2026-06-15", { kind: "due_on_receipt" })).toBe("2026-06-15");
    expect(dueDateFor("2026-04-10", { kind: "eom", days: 15 })).toBe("2026-05-15"); // EOM(Apr)=Apr30 +15
  });
});

describe("calendar", () => {
  it("should add days and measure gaps", () => {
    expect(addDays("2026-02-27", 2)).toBe("2026-03-01");
    expect(daysBetween("2026-05-01", "2026-06-15")).toBe(45);
  });
  it("should roll to the next business day over a weekend", () => {
    // 2026-06-13 is a Saturday → next business day is Monday the 15th.
    expect(isBusinessDay("2026-06-13", "GR")).toBe(false);
    expect(nextBusinessDay("2026-06-13", "GR")).toBe("2026-06-15");
  });
  it("should treat a Greek holiday as non-business", () => {
    expect(isBusinessDay("2026-03-25", "GR")).toBe(false); // Independence Day
  });
});

const FX_INVOICES: Invoice[] = [
  { id: "a", number: "INV-A", customerId: "c1", currency: "EUR", issueDate: "2026-04-01", dueDate: "2026-05-01", terms: { kind: "net", days: 30 }, amount: 100000, status: "open" }, // 45d overdue
  { id: "b", number: "INV-B", customerId: "c1", currency: "EUR", issueDate: "2026-06-05", dueDate: "2026-07-05", terms: { kind: "net", days: 30 }, amount: 50000, status: "open" }, // not due
  { id: "c", number: "INV-C", customerId: "c2", currency: "EUR", issueDate: "2026-02-01", dueDate: "2026-03-01", terms: { kind: "net", days: 30 }, amount: 30000, status: "paid", paidDate: "2026-03-20" },
];

describe("ageing — computeArState", () => {
  const snap = computeArState(FX_INVOICES, [], "2026-06-15");

  it("should keep only open invoices and bucket by days overdue", () => {
    expect(snap.invoices.map((i) => i.invoiceId)).toEqual(["a", "b"]);
    expect(snap.invoices.find((i) => i.invoiceId === "a")?.daysOverdue).toBe(45);
    expect(snap.invoices.find((i) => i.invoiceId === "a")?.bucket).toBe("31-60");
    expect(snap.invoices.find((i) => i.invoiceId === "b")?.bucket).toBe("current");
  });

  it("should compute the headline KPIs", () => {
    expect(snap.kpis.totalAr).toBe(150000);
    expect(snap.kpis.currentAr).toBe(50000); // only the not-yet-due invoice
    expect(snap.kpis.pastDueAr).toBe(100000);
    expect(snap.kpis.avgDaysToPay).toBeGreaterThan(0); // from the paid invoice
  });

  it("should net payments against the balance", () => {
    const withPayment = computeArState(FX_INVOICES, [{ id: "p1", invoiceId: "a", customerId: "c1", amount: 40000, date: "2026-06-01" }], "2026-06-15");
    expect(withPayment.invoices.find((i) => i.invoiceId === "a")?.amountDue).toBe(60000);
  });
});

describe("scoring", () => {
  it("should score a chronic late payer high and a clean payer low", () => {
    const chronic = scoreCustomer({
      customerId: "x",
      history: [
        { dueDate: "2026-01-15", paidDate: "2026-02-20" },
        { dueDate: "2026-02-15", paidDate: "2026-03-20" },
        { dueDate: "2026-03-15", paidDate: "2026-04-25" },
      ],
      oldestDaysOverdue: 45,
      longestTermDays: 30,
    });
    const clean = scoreCustomer({
      customerId: "y",
      history: [
        { dueDate: "2026-02-15", paidDate: "2026-02-14" },
        { dueDate: "2026-03-15", paidDate: "2026-03-15" },
      ],
      oldestDaysOverdue: 0,
      longestTermDays: 30,
    });
    expect(chronic.score).toBeGreaterThan(clean.score);
    expect(chronic.band === "high" || chronic.band === "severe").toBe(true);
    expect(clean.band).toBe("low");
    expect(chronic.contributions[0]?.contribution).toBeGreaterThan(0);
  });

  it("should flag thin history as low confidence and fall back to ageing", () => {
    const newCustomer = scoreCustomer({ customerId: "z", history: [], oldestDaysOverdue: 20, longestTermDays: 30 });
    expect(newCustomer.lowConfidence).toBe(true);
    expect(newCustomer.score).toBeGreaterThan(0); // ageing + terms still score it
  });

  it("should rank the chase list by risk × value", () => {
    const snap = computeArState(
      [
        { id: "big-clean", number: "B", customerId: "clean", currency: "EUR", issueDate: "2026-06-08", dueDate: "2026-06-10", terms: { kind: "net", days: 2 }, amount: 1000000, status: "open" }, // €10k, 5d overdue, clean
        { id: "mid-risky", number: "R", customerId: "risky", currency: "EUR", issueDate: "2026-05-01", dueDate: "2026-05-06", terms: { kind: "net", days: 5 }, amount: 400000, status: "open" }, // €4k, 40d overdue, risky
      ],
      [],
      "2026-06-15",
    );
    const scores = [
      scoreCustomer({ customerId: "clean", history: [{ dueDate: "2026-04-01", paidDate: "2026-04-01" }], oldestDaysOverdue: 5, longestTermDays: 2 }),
      scoreCustomer({ customerId: "risky", history: [{ dueDate: "2026-03-01", paidDate: "2026-04-10" }, { dueDate: "2026-04-01", paidDate: "2026-05-10" }, { dueDate: "2026-04-15", paidDate: "2026-05-25" }], oldestDaysOverdue: 40, longestTermDays: 5 }),
    ];
    const list = buildPriorityList(scores, snap.customers);
    expect(list[0]?.customerId).toBe("risky"); // the €4k that won't pay beats the €10k that will
  });

  it("scoreCustomers should derive history from records", () => {
    const snap = computeArState(FX_INVOICES, [], "2026-06-15");
    const scores = scoreCustomers(FX_INVOICES, snap.customers);
    expect(scores.find((s) => s.customerId === "c1")).toBeTruthy();
  });
});

describe("factCheck", () => {
  const facts: ReminderFacts = {
    businessName: "Meraki", customerName: "Kallisto", contactName: "Dimitra", invoiceNumber: "INV-1042",
    currency: "EUR", amountDue: 420000, daysOverdue: 45, dueDate: "2026-05-01", issueDate: "2026-04-01",
    tone: "formal", intent: "x", lang: "el",
  };
  it("should pass a faithful draft", () => {
    const r = factCheck("Meraki: INV-1042", "Invoice INV-1042 for €4,200.00 is overdue.", facts);
    expect(r.passed).toBe(true);
  });
  it("should fail a draft that misstates the amount", () => {
    const r = factCheck("Meraki: INV-1042", "Invoice INV-1042 for €9,999.00 is overdue.", facts);
    expect(r.passed).toBe(false);
  });
  it("should fail a draft that omits the invoice number", () => {
    expect(factCheck("Reminder", "You owe €4,200.00.", facts).passed).toBe(false);
  });
  it("should reject marketing content", () => {
    const r = factCheck("INV-1042", "Pay €4,200.00 — and enjoy 10% discount on your next order!", facts);
    expect(r.passed).toBe(false);
  });
});

describe("amountVariants", () => {
  it("should include en + greek renderings", () => {
    const v = amountVariants(412050);
    expect(v).toContain("4120.50");
    expect(v).toContain("4,120.50");
    expect(v).toContain("4.120,50");
  });
});

describe("costUsd", () => {
  it("should price a Sonnet call", () => {
    expect(costUsd("claude-sonnet-4-6", { input_tokens: 1000, output_tokens: 500 })).toBeCloseTo((1000 * 3 + 500 * 15) / 1e6, 6);
  });
});
