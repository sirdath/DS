/**
 * Export leads to one shareable .xlsx "lead tracker":
 *  - Verified / Done / Status / Notes columns the founders edit (dropdowns).
 *  - A live Dashboard tab (COUNTIF formulas update as boxes are ticked).
 *  - Conditional formatting: colour scales on score/ugliness, data bars, status colours.
 *  - Re-runs merge prior Verified/Done/Status/Notes back in (see merge.ts) so work persists.
 */
import ExcelJS from "exceljs";
import type { Lead } from "./types.js";
import { leadStableKey } from "./util.js";
import type { SavedState } from "./merge.js";

const PURPLE = "FF6D5DD3";
const PURPLE_DK = "FF2A2540";
const HEADER_FILL = "FF2A2540";
const ZEBRA = "FFF7F6FB";
const GREEN = "FFD6F5D6";
const GREEN_TX = "FF1B7F2E";
const PRIORITY_FILL: Record<Lead["priority"], string> = { High: "FFE9D9D6", Medium: "FFFBF1D8", Low: "FFEDEDF2" };
const STATUSES = ["New", "Contacted", "Replied", "Meeting", "Won", "Lost", "Not a fit"];
const STATUS_FILL: Record<string, string> = {
  Contacted: "FFE7E2Fb", Replied: "FFDCD4F6", Meeting: "FFFBEFC9", Won: "FFD6F5D6", Lost: "FFEDEDED", "Not a fit": "FFF5DBD9",
};

interface Col {
  key: string;
  header: string;
  width: number;
  get: (l: Lead, saved: SavedState | undefined) => string | number | null;
}

const COLUMNS: Col[] = [
  { key: "verified", header: "Verified", width: 9, get: (_l, s) => s?.verified ?? "" },
  { key: "done", header: "Done", width: 9, get: (_l, s) => s?.done ?? "" },
  { key: "status", header: "Status", width: 13, get: (_l, s) => s?.status ?? "" },
  { key: "notes", header: "Notes", width: 28, get: (_l, s) => s?.notes ?? "" },
  { key: "priority", header: "Priority", width: 10, get: (l) => l.priority },
  { key: "score", header: "Lead score", width: 11, get: (l) => l.leadScore },
  { key: "name", header: "Business", width: 30, get: (l) => l.name },
  { key: "category", header: "Category", width: 16, get: (l) => l.category },
  { key: "hasSite", header: "Has site", width: 9, get: (l) => (l.hasWebsite ? "yes" : "NO") },
  { key: "ugliness", header: "Ugliness", width: 10, get: (l) => l.analysis?.ugliness ?? "" },
  { key: "pitch", header: "Pitch angle", width: 52, get: (l) => l.pitchAngle },
  { key: "tags", header: "Tags", width: 38, get: (l) => l.tags.join(", ") },
  { key: "tech", header: "Tech stack", width: 32, get: (l) => l.analysis?.tech.join(", ") ?? "" },
  { key: "website", header: "Website", width: 30, get: (l) => l.website ?? "" },
  { key: "https", header: "HTTPS", width: 7, get: (l) => (l.analysis ? (l.analysis.https ? "yes" : "no") : "") },
  { key: "mobile", header: "Mobile", width: 8, get: (l) => (l.analysis ? (l.analysis.mobileFriendly ? "yes" : "NO") : "") },
  { key: "cyr", header: "©yr", width: 7, get: (l) => l.analysis?.copyrightYear ?? "" },
  { key: "lastmod", header: "Last mod", width: 12, get: (l) => l.analysis?.lastModified ?? "" },
  { key: "domain", header: "Domain made", width: 13, get: (l) => l.analysis?.domainCreated ?? "" },
  { key: "kb", header: "kB", width: 7, get: (l) => l.analysis?.pageKb ?? "" },
  { key: "ttfb", header: "TTFB", width: 8, get: (l) => l.analysis?.ttfbMs ?? "" },
  { key: "phone", header: "Phone", width: 18, get: (l) => l.phone ?? "" },
  { key: "email", header: "Email", width: 22, get: (l) => l.email ?? "" },
  { key: "address", header: "Address", width: 30, get: (l) => l.address ?? "" },
  { key: "rating", header: "Rating", width: 8, get: (l) => l.rating ?? "" },
  { key: "reviews", header: "Reviews", width: 9, get: (l) => l.reviews ?? "" },
  { key: "source", header: "Source", width: 8, get: (l) => l.source },
  { key: "maps", header: "Maps", width: 12, get: (l) => l.mapsUrl },
  { key: "found", header: "Found", width: 12, get: (l) => l.discoveredAt },
  { key: "key", header: "Key", width: 3, get: (l) => leadStableKey(l.source, l.sourceId) },
];

const idx = (key: string): number => COLUMNS.findIndex((c) => c.key === key) + 1;
function colLetter(n: number): string {
  let s = "";
  let x = n;
  while (x > 0) {
    const m = (x - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    x = Math.floor((x - 1) / 26);
  }
  return s;
}

function addSheet(wb: ExcelJS.Workbook, name: string, leads: Lead[], subtitle: string, prior: Map<string, SavedState>): void {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 2 }] });

  // Title row
  ws.mergeCells(1, 1, 1, COLUMNS.length);
  const t = ws.getCell(1, 1);
  t.value = `${name}  —  ${subtitle}  (${leads.length})`;
  t.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
  t.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE } };
  t.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(1).height = 26;

  // Header row
  const header = ws.getRow(2);
  COLUMNS.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: "middle", horizontal: ["verified", "done", "status"].includes(c.key) ? "center" : "left" };
    ws.getColumn(i + 1).width = c.width;
  });
  header.height = 18;

  // Data rows
  leads.forEach((lead, n) => {
    const saved = prior.get(leadStableKey(lead.source, lead.sourceId));
    const row = ws.addRow(COLUMNS.map((c) => c.get(lead, saved)));
    row.alignment = { vertical: "top" };
    if (n % 2 === 1) {
      // zebra (skip the editable + key columns so edits read cleanly)
      for (let ci = idx("priority"); ci < idx("key"); ci++) {
        row.getCell(ci).fill = { type: "pattern", pattern: "solid", fgColor: { argb: ZEBRA } };
      }
    }
    row.getCell(idx("verified")).alignment = { horizontal: "center" };
    row.getCell(idx("done")).alignment = { horizontal: "center" };
    row.getCell(idx("status")).alignment = { horizontal: "center" };
    row.getCell(idx("notes")).alignment = { wrapText: true, vertical: "top" };
    // Editable dropdowns (per-cell — the typed exceljs API)
    row.getCell(idx("verified")).dataValidation = { type: "list", allowBlank: true, formulae: ['"✓"'] };
    row.getCell(idx("done")).dataValidation = { type: "list", allowBlank: true, formulae: ['"✓"'] };
    row.getCell(idx("status")).dataValidation = { type: "list", allowBlank: true, formulae: [`"${STATUSES.join(",")}"`] };

    const pr = row.getCell(idx("priority"));
    pr.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIORITY_FILL[lead.priority] } };
    pr.font = { bold: true, size: 10 };
    pr.alignment = { horizontal: "center" };

    if (!lead.hasWebsite) row.getCell(idx("hasSite")).font = { bold: true, color: { argb: "FFB00020" } };
    if (lead.analysis && !lead.analysis.mobileFriendly) row.getCell(idx("mobile")).font = { bold: true, color: { argb: "FFB00020" } };
    if (lead.website) row.getCell(idx("website")).value = { text: lead.website, hyperlink: ensureHttp(lead.website) };
    row.getCell(idx("maps")).value = { text: "open map", hyperlink: lead.mapsUrl };
    row.getCell(idx("pitch")).alignment = { wrapText: true, vertical: "top" };
  });

  const last = 2 + leads.length;
  if (leads.length > 0) {
    applyValidationAndFormatting(ws, last);
  }
  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: COLUMNS.length } };
  ws.getColumn(idx("key")).hidden = true; // keep the merge key out of the way
}

function applyValidationAndFormatting(ws: ExcelJS.Worksheet, last: number): void {
  const range = (key: string) => `${colLetter(idx(key))}3:${colLetter(idx(key))}${last}`;

  // ✓ → green for Verified + Done
  for (const k of ["verified", "done"]) {
    ws.addConditionalFormatting({
      ref: range(k),
      rules: [{ type: "cellIs", operator: "equal", priority: 1, formulae: ['"✓"'],
        style: { fill: { type: "pattern", pattern: "solid", bgColor: { argb: GREEN } }, font: { color: { argb: GREEN_TX }, bold: true } } }],
    });
  }
  // Status colours
  ws.addConditionalFormatting({
    ref: range("status"),
    rules: Object.entries(STATUS_FILL).map(([label, argb], i) => ({
      type: "cellIs" as const, operator: "equal" as const, priority: i + 1, formulae: [`"${label}"`],
      style: { fill: { type: "pattern" as const, pattern: "solid" as const, bgColor: { argb } } },
    })),
  });
  // Lead score: white → green (higher = better lead)
  ws.addConditionalFormatting({
    ref: range("score"),
    rules: [{ type: "colorScale", priority: 1,
      cfvo: [{ type: "num", value: 0 }, { type: "num", value: 50 }, { type: "num", value: 100 }],
      color: [{ argb: "FFFFFFFF" }, { argb: "FFE9F4E6" }, { argb: "FF7DBE82" }] }],
  });
  // Ugliness: green → red (higher = uglier)
  ws.addConditionalFormatting({
    ref: range("ugliness"),
    rules: [{ type: "colorScale", priority: 1,
      cfvo: [{ type: "num", value: 0 }, { type: "num", value: 40 }, { type: "num", value: 80 }],
      color: [{ argb: "FFE6EEDF" }, { argb: "FFF7E2C2" }, { argb: "FFE7A39B" }] }],
  });
  // Reviews: data bar
  ws.addConditionalFormatting({
    ref: range("reviews"),
    rules: [{ type: "dataBar", priority: 1, cfvo: [{ type: "min" }, { type: "max" }], color: { argb: PURPLE } } as unknown as ExcelJS.ConditionalFormattingRule],
  });
}

function addDashboard(wb: ExcelJS.Workbook, leads: Lead[], meta: { area: string; categories: string[] }): void {
  const ws = wb.addWorksheet("Dashboard", { properties: { tabColor: { argb: PURPLE } } });
  const SHEET = "'All leads'";
  const last = 2 + leads.length;
  const r = (key: string) => `${SHEET}!${colLetter(idx(key))}3:${colLetter(idx(key))}${last}`;
  ws.getColumn(1).width = 22;
  ws.getColumn(2).width = 10;
  ws.getColumn(3).width = 34;

  // Title
  ws.mergeCells(1, 1, 1, 3);
  const t = ws.getCell(1, 1);
  t.value = "DS2 Lead Tracker";
  t.font = { bold: true, size: 18, color: { argb: "FFFFFFFF" } };
  t.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE } };
  t.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(1).height = 34;
  ws.mergeCells(2, 1, 2, 3);
  ws.getCell(2, 1).value = `${meta.area}  ·  ${meta.categories.length} industries  ·  generated ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;
  ws.getCell(2, 1).font = { color: { argb: "FF888899" }, size: 10 };

  let row = 4;
  const kpi = (label: string, formula: string) => {
    const lc = ws.getCell(row, 1);
    lc.value = label;
    lc.font = { bold: true, size: 11 };
    const vc = ws.getCell(row, 2);
    vc.value = { formula } as ExcelJS.CellFormulaValue;
    vc.font = { bold: true, size: 14, color: { argb: PURPLE } };
    vc.alignment = { horizontal: "left" };
    row++;
  };
  const sectionTitle = (label: string) => {
    row++;
    const c = ws.getCell(row, 1);
    ws.mergeCells(row, 1, row, 3);
    c.value = label;
    c.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" } };
    c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE_DK } };
    row++;
  };

  // KPIs (live)
  kpi("Total leads", `COUNTA(${r("name")})`);
  kpi("High priority", `COUNTIF(${r("priority")},"High")`);
  kpi("No website", `COUNTIF(${r("hasSite")},"NO")`);
  kpi("Verified ✓", `COUNTIF(${r("verified")},"✓")`);
  kpi("Done / outreached ✓", `COUNTIF(${r("done")},"✓")`);
  kpi("Still to contact", `COUNTA(${r("name")})-COUNTIF(${r("done")},"✓")`);

  // Pipeline by priority (live, with data bars)
  sectionTitle("Pipeline by priority");
  const barStart = row;
  for (const p of ["High", "Medium", "Low"]) {
    ws.getCell(row, 1).value = p;
    ws.getCell(row, 2).value = { formula: `COUNTIF(${r("priority")},"${p}")` } as ExcelJS.CellFormulaValue;
    ws.getCell(row, 3).value = { formula: `REPT("█",COUNTIF(${r("priority")},"${p}"))` } as ExcelJS.CellFormulaValue;
    ws.getCell(row, 3).font = { color: { argb: PURPLE } };
    row++;
  }
  ws.addConditionalFormatting({
    ref: `B${barStart}:B${row - 1}`,
    rules: [{ type: "dataBar", priority: 1, cfvo: [{ type: "min" }, { type: "max" }], color: { argb: PURPLE } } as unknown as ExcelJS.ConditionalFormattingRule],
  });

  // Website health (live)
  sectionTitle("Website health");
  const health: Array<[string, string]> = [
    ["Not mobile-friendly", `COUNTIF(${r("tags")},"*not-mobile-friendly*")`],
    ["No HTTPS", `COUNTIF(${r("tags")},"*no-https*")`],
    ["Site down / broken", `COUNTIF(${r("tags")},"*site-down*")`],
    ["Legacy tech detected", `COUNTIF(${r("tags")},"*tech-*")`],
  ];
  for (const [label, formula] of health) {
    ws.getCell(row, 1).value = label;
    ws.getCell(row, 2).value = { formula } as ExcelJS.CellFormulaValue;
    ws.getCell(row, 2).font = { bold: true };
    row++;
  }

  // Leads by industry (live, with data bars)
  sectionTitle("Leads by industry");
  const cats = [...new Set(leads.map((l) => l.category))].sort();
  const catStart = row;
  for (const cat of cats) {
    ws.getCell(row, 1).value = cat;
    ws.getCell(row, 2).value = { formula: `COUNTIF(${r("category")},"${cat.replace(/"/g, '""')}")` } as ExcelJS.CellFormulaValue;
    ws.getCell(row, 3).value = { formula: `REPT("▮",COUNTIF(${r("category")},"${cat.replace(/"/g, '""')}"))` } as ExcelJS.CellFormulaValue;
    ws.getCell(row, 3).font = { color: { argb: PURPLE } };
    row++;
  }
  if (cats.length) {
    ws.addConditionalFormatting({
      ref: `B${catStart}:B${row - 1}`,
      rules: [{ type: "dataBar", priority: 1, cfvo: [{ type: "min" }, { type: "max" }], color: { argb: "FF9990F1" } } as unknown as ExcelJS.ConditionalFormattingRule],
    });
  }

  row++;
  ws.getCell(row, 1).value = "How to use: tick Verified / Done from the dropdown on each lead sheet; counts above update live. Keep this file on OneDrive/Drive so you and Stel edit one copy.";
  ws.mergeCells(row, 1, row, 3);
  ws.getCell(row, 1).font = { italic: true, color: { argb: "FF888899" }, size: 9 };
  ws.getCell(row, 1).alignment = { wrapText: true };
}

function ensureHttp(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `http://${url}`;
}

export async function writeWorkbook(
  leads: Lead[],
  outPath: string,
  meta: { area: string; categories: string[] },
  prior: Map<string, SavedState> = new Map(),
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "DS2 Lead Finder";
  wb.created = new Date();

  const sorted = [...leads].sort((a, b) => b.leadScore - a.leadScore);
  addDashboard(wb, sorted, meta);
  addSheet(wb, "All leads", sorted, "every business found, best first", prior);
  addSheet(wb, "No website", sorted.filter((l) => !l.hasWebsite), "no site — build leads", prior);
  addSheet(
    wb,
    "Ugly sites",
    sorted.filter((l) => l.hasWebsite && l.analysis && (l.analysis.ugliness >= 30 || !l.analysis.reachable)),
    "working but dated — redesign leads",
    prior,
  );

  await wb.xlsx.writeFile(outPath);
}
