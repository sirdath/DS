/**
 * CSV import — the universal source. Any SMB can drop a receivables export and
 * Plutus works, regardless of accounting system. Pure and defensive: detects the
 * delimiter, maps fuzzy headers to the canonical fields, parses both en (1,234.56)
 * and Greek (1.234,56) money and DD/MM or ISO dates, and reports per-row warnings
 * instead of rejecting the whole file. Money becomes integer minor units.
 */

import type { Currency, Customer, Invoice, IsoDate, Lang } from "./types";

export interface CsvImportResult {
  customers: Customer[];
  invoices: Invoice[];
  warnings: string[];
}

export interface CsvImportOptions {
  defaultCurrency?: Currency;
  calendar?: string;
  lang?: Lang;
  sequenceId?: string;
}

const HEADER_ALIASES: Record<string, string[]> = {
  invoice_number: ["invoice number", "invoice no", "invoice", "number", "ref", "reference", "doc", "doc number"],
  customer_name: ["customer name", "customer", "client", "account", "bill to", "name", "company"],
  customer_email: ["customer email", "email", "e-mail", "contact email"],
  total_amount: ["total amount", "total", "amount", "gross", "invoice total", "value"],
  issue_date: ["issue date", "invoice date", "date", "dated on", "issued"],
  due_date: ["due date", "due", "payment due", "due on"],
  amount_paid: ["amount paid", "paid", "paid value", "paid amount"],
  status: ["status", "state"],
  currency: ["currency", "ccy", "curr"],
};

function detectDelimiter(headerLine: string): string {
  const counts = [
    [",", (headerLine.match(/,/g) ?? []).length],
    [";", (headerLine.match(/;/g) ?? []).length],
    ["\t", (headerLine.match(/\t/g) ?? []).length],
  ] as Array<[string, number]>;
  counts.sort((a, b) => b[1] - a[1]);
  return counts[0]?.[1] ? (counts[0][0] as string) : ",";
}

/** Split one CSV line respecting double-quotes. */
function splitLine(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === delim && !inQuotes) {
      out.push(cur);
      cur = "";
    } else cur += ch;
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

function mapHeaders(headers: string[]): Map<number, string> {
  const map = new Map<number, string>();
  headers.forEach((h, i) => {
    const norm = h.toLowerCase().trim();
    for (const [canonical, aliases] of Object.entries(HEADER_ALIASES)) {
      if (norm === canonical.replace(/_/g, " ") || aliases.includes(norm)) {
        map.set(i, canonical);
        return;
      }
    }
  });
  return map;
}

/** Parse a money string in en (1,234.56 / 1234.56) or Greek (1.234,56) form → minor units. */
export function parseMoney(input: string): number | null {
  const s = input.replace(/[^\d.,-]/g, "").trim();
  if (!s) return null;
  const hasDot = s.includes(".");
  const hasComma = s.includes(",");
  let normalised = s;
  if (hasDot && hasComma) {
    // The right-most separator is the decimal point.
    normalised = s.lastIndexOf(",") > s.lastIndexOf(".") ? s.replace(/\./g, "").replace(",", ".") : s.replace(/,/g, "");
  } else if (hasComma) {
    // Comma decimal if it's followed by 1–2 digits at the end; else thousands.
    normalised = /,\d{1,2}$/.test(s) ? s.replace(",", ".") : s.replace(/,/g, "");
  }
  const value = Number(normalised);
  return Number.isFinite(value) ? Math.round(value * 100) : null;
}

/** Parse ISO, DD/MM/YYYY or DD-MM-YYYY (EU default) → IsoDate, or null. */
export function parseDate(input: string): IsoDate | null {
  const s = input.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  const m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})$/);
  if (!m) return null;
  const [, dd, mm, yy] = m;
  const year = (yy ?? "").length === 2 ? `20${yy}` : (yy ?? "");
  const day = String(dd).padStart(2, "0");
  const month = String(mm).padStart(2, "0");
  if (Number(month) > 12) return null;
  return `${year}-${month}-${day}`;
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "x";
}

export function parseInvoicesCsv(text: string, opts: CsvImportOptions = {}): CsvImportResult {
  const currency = opts.defaultCurrency ?? "EUR";
  const calendar = opts.calendar ?? "GR";
  const lang: Lang = opts.lang ?? "el";
  const sequenceId = opts.sequenceId ?? "standard";
  const warnings: string[] = [];

  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim() !== "");
  if (lines.length < 2) return { customers: [], invoices: [], warnings: ["empty or header-only file"] };

  const delim = detectDelimiter(lines[0] ?? "");
  const headers = splitLine(lines[0] ?? "", delim);
  const colMap = mapHeaders(headers);
  const required = ["invoice_number", "customer_name", "total_amount", "issue_date", "due_date"];
  const present = new Set(colMap.values());
  for (const r of required) if (!present.has(r)) warnings.push(`missing column: ${r}`);

  const customers = new Map<string, Customer>();
  const invoices: Invoice[] = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i] ?? "", delim);
    const get = (field: string): string => {
      for (const [idx, canon] of colMap) if (canon === field) return cells[idx] ?? "";
      return "";
    };
    const number = get("invoice_number");
    const custName = get("customer_name");
    const total = parseMoney(get("total_amount"));
    const issue = parseDate(get("issue_date"));
    const due = parseDate(get("due_date"));
    if (!number || !custName || total === null || !issue || !due) {
      warnings.push(`row ${i + 1}: skipped (missing invoice number / customer / amount / dates)`);
      continue;
    }
    const customerId = slug(custName);
    if (!customers.has(customerId)) {
      const email = get("customer_email");
      customers.set(customerId, {
        id: customerId,
        name: custName,
        lang,
        calendar,
        sequenceId,
        contacts: [{ name: custName, ...(email ? { email } : {}) }],
      });
    }
    const paid = parseMoney(get("amount_paid")) ?? 0;
    const rawStatus = get("status").toLowerCase();
    const status: Invoice["status"] =
      rawStatus.includes("paid") || paid >= total ? "paid" : rawStatus.includes("written") ? "written_off" : "open";
    invoices.push({
      id: `${customerId}-${slug(number)}`,
      number,
      customerId,
      currency,
      issueDate: issue,
      dueDate: due,
      terms: { kind: "net", days: Math.max(0, daysBetweenLocal(issue, due)) },
      amount: total,
      status,
      paidDate: status === "paid" ? due : null,
    });
  }

  return { customers: [...customers.values()], invoices, warnings };
}

function daysBetweenLocal(a: string, b: string): number {
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  const ta = Date.UTC(ay ?? 0, (am ?? 1) - 1, ad ?? 1);
  const tb = Date.UTC(by ?? 0, (bm ?? 1) - 1, bd ?? 1);
  return Math.round((tb - ta) / 86_400_000);
}
