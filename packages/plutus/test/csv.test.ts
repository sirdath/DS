import { describe, expect, it } from "vitest";
import { parseDate, parseInvoicesCsv, parseMoney } from "../src/index";

describe("csv — parseMoney", () => {
  it("should parse en thousands + decimal (1,234.56) to minor units", () => {
    expect(parseMoney("1,234.56")).toBe(123456);
    expect(parseMoney("€1,234.56")).toBe(123456);
    expect(parseMoney("1234.5")).toBe(123450);
    expect(parseMoney("99")).toBe(9900);
  });

  it("should parse Greek thousands + decimal (1.234,56) to minor units", () => {
    expect(parseMoney("1.234,56")).toBe(123456);
    expect(parseMoney("2.600,00")).toBe(260000);
    expect(parseMoney("640,00")).toBe(64000);
  });

  it("should treat a lone comma as a decimal only when 1-2 trailing digits", () => {
    expect(parseMoney("12,5")).toBe(1250); // decimal
    expect(parseMoney("1,200")).toBe(120000); // thousands
  });

  it("should return null for non-numeric input", () => {
    expect(parseMoney("")).toBeNull();
    expect(parseMoney("n/a")).toBeNull();
  });
});

describe("csv — parseDate", () => {
  it("should pass through ISO dates", () => {
    expect(parseDate("2026-06-15")).toBe("2026-06-15");
  });

  it("should parse EU DD/MM/YYYY and DD-MM-YYYY and DD.MM.YYYY", () => {
    expect(parseDate("15/06/2026")).toBe("2026-06-15");
    expect(parseDate("01-04-2026")).toBe("2026-04-01");
    expect(parseDate("9.6.2026")).toBe("2026-06-09");
  });

  it("should expand 2-digit years and pad single digits", () => {
    expect(parseDate("5/6/26")).toBe("2026-06-05");
  });

  it("should reject impossible months and junk", () => {
    expect(parseDate("15/13/2026")).toBeNull();
    expect(parseDate("not a date")).toBeNull();
  });
});

describe("csv — parseInvoicesCsv", () => {
  it("should map fuzzy headers, derive status + terms, dedupe customers", () => {
    const csv = [
      "Invoice No,Client,Email,Total,Invoice Date,Due Date,Paid,Status",
      'INV-1,"Acme Ltd",ops@acme.gr,"1.200,00",01/05/2026,31/05/2026,0,open',
      "INV-2,Acme Ltd,ops@acme.gr,500,01/06/2026,15/06/2026,500,",
      "INV-3,Beta SA,,300,01/06/2026,01/07/2026,0,open",
    ].join("\n");

    const { customers, invoices, warnings } = parseInvoicesCsv(csv, { defaultCurrency: "EUR" });

    expect(warnings).toHaveLength(0);
    expect(customers).toHaveLength(2); // Acme deduped across two invoices
    expect(invoices).toHaveLength(3);

    const acme = customers.find((c) => c.name === "Acme Ltd");
    expect(acme?.contacts[0]?.email).toBe("ops@acme.gr");

    const inv1 = invoices.find((i) => i.number === "INV-1");
    expect(inv1?.amount).toBe(120000);
    expect(inv1?.issueDate).toBe("2026-05-01");
    expect(inv1?.dueDate).toBe("2026-05-31");
    expect(inv1?.terms).toEqual({ kind: "net", days: 30 });
    expect(inv1?.status).toBe("open");

    // INV-2 has paid == total → derived paid even though status column is blank.
    const inv2 = invoices.find((i) => i.number === "INV-2");
    expect(inv2?.status).toBe("paid");
    expect(inv2?.paidDate).toBe("2026-06-15");
  });

  it("should warn and skip rows missing required fields, not throw", () => {
    const csv = [
      "invoice,customer,amount,issue date,due date",
      "INV-9,,500,01/06/2026,15/06/2026", // missing customer
      "INV-10,Gamma,,01/06/2026,15/06/2026", // missing amount
      "INV-11,Gamma,700,01/06/2026,15/06/2026", // good
    ].join("\n");

    const { invoices, warnings } = parseInvoicesCsv(csv);
    expect(invoices).toHaveLength(1);
    expect(invoices[0]?.number).toBe("INV-11");
    expect(warnings.length).toBe(2);
  });

  it("should detect a semicolon delimiter and warn on missing columns", () => {
    const csv = ["invoice;customer;amount;issue date", "INV-1;Acme;500;01/06/2026"].join("\n");
    const { warnings } = parseInvoicesCsv(csv);
    expect(warnings).toContain("missing column: due_date");
  });

  it("should return a single warning for an empty or header-only file", () => {
    expect(parseInvoicesCsv("").warnings).toEqual(["empty or header-only file"]);
    expect(parseInvoicesCsv("invoice,customer,amount").warnings).toEqual(["empty or header-only file"]);
  });
});
