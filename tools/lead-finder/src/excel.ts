/** Export prioritised leads to a formatted .xlsx workbook (exceljs). */
import ExcelJS from "exceljs";
import type { Lead } from "./types.js";

const ACCENT = "FF6D5DD3"; // DS2 purple (ARGB)
const HEADER_FILL = "FF2A2540";
const PRIORITY_FILL: Record<Lead["priority"], string> = {
  High: "FFE9D9D6", // warm
  Medium: "FFFBF1D8",
  Low: "FFEDEDF2",
};

interface Column {
  header: string;
  width: number;
  get: (l: Lead) => string | number | null;
}

const COLUMNS: Column[] = [
  { header: "Priority", width: 10, get: (l) => l.priority },                                   // 1
  { header: "Lead score", width: 11, get: (l) => l.leadScore },                                 // 2
  { header: "Business", width: 30, get: (l) => l.name },                                        // 3
  { header: "Category", width: 16, get: (l) => l.category },                                    // 4
  { header: "Has site", width: 9, get: (l) => (l.hasWebsite ? "yes" : "NO") },                  // 5
  { header: "Ugliness", width: 10, get: (l) => l.analysis?.ugliness ?? "" },                    // 6
  { header: "Pitch angle", width: 52, get: (l) => l.pitchAngle },                               // 7
  { header: "Tags", width: 40, get: (l) => l.tags.join(", ") },                                 // 8
  { header: "Tech stack", width: 34, get: (l) => l.analysis?.tech.join(", ") ?? "" },           // 9
  { header: "Website", width: 32, get: (l) => l.website ?? "" },                                // 10
  { header: "HTTPS", width: 7, get: (l) => (l.analysis ? (l.analysis.https ? "yes" : "no") : "") }, // 11
  { header: "Mobile", width: 8, get: (l) => (l.analysis ? (l.analysis.mobileFriendly ? "yes" : "NO") : "") }, // 12
  { header: "©yr", width: 7, get: (l) => l.analysis?.copyrightYear ?? "" },                     // 13
  { header: "Last mod", width: 12, get: (l) => l.analysis?.lastModified ?? "" },                // 14
  { header: "Domain made", width: 13, get: (l) => l.analysis?.domainCreated ?? "" },            // 15
  { header: "kB", width: 7, get: (l) => l.analysis?.pageKb ?? "" },                             // 16
  { header: "TTFB", width: 8, get: (l) => l.analysis?.ttfbMs ?? "" },                           // 17
  { header: "Phone", width: 18, get: (l) => l.phone ?? "" },                                    // 18
  { header: "Email", width: 24, get: (l) => l.email ?? "" },                                    // 19
  { header: "Address", width: 34, get: (l) => l.address ?? "" },                                // 20
  { header: "Rating", width: 8, get: (l) => l.rating ?? "" },                                   // 21
  { header: "Reviews", width: 9, get: (l) => l.reviews ?? "" },                                 // 22
  { header: "Source", width: 8, get: (l) => l.source },                                         // 23
  { header: "Maps", width: 12, get: (l) => l.mapsUrl },                                         // 24
  { header: "Found", width: 12, get: (l) => l.discoveredAt },                                   // 25
];
const COL = { priority: 1, leadScore: 2, hasSite: 5, ugliness: 6, pitch: 7, website: 10, mobile: 12, maps: 24 };

function addSheet(wb: ExcelJS.Workbook, name: string, leads: Lead[], subtitle: string): void {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 2 }] });

  // Title row
  ws.mergeCells(1, 1, 1, COLUMNS.length);
  const titleCell = ws.getCell(1, 1);
  titleCell.value = `${name}  —  ${subtitle}  (${leads.length})`;
  titleCell.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
  titleCell.alignment = { vertical: "middle", indent: 1 };
  ws.getRow(1).height = 26;

  // Header row
  const header = ws.getRow(2);
  COLUMNS.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: HEADER_FILL } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    ws.getColumn(i + 1).width = c.width;
  });
  header.height = 18;

  // Data rows
  leads.forEach((lead) => {
    const row = ws.addRow(COLUMNS.map((c) => c.get(lead)));
    row.alignment = { vertical: "top", wrapText: false };

    const priorityCell = row.getCell(COL.priority);
    priorityCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PRIORITY_FILL[lead.priority] } };
    priorityCell.font = { bold: true, size: 10 };

    // Lead score + ugliness: red-ish as they climb
    colourScore(row.getCell(COL.leadScore), lead.leadScore);
    if (lead.analysis) colourScore(row.getCell(COL.ugliness), lead.analysis.ugliness);

    // Flag the strongest opportunities
    if (!lead.hasWebsite) row.getCell(COL.hasSite).font = { bold: true, color: { argb: "FFB00020" } };
    if (lead.analysis && !lead.analysis.mobileFriendly) row.getCell(COL.mobile).font = { bold: true, color: { argb: "FFB00020" } };

    // Hyperlinks
    if (lead.website) row.getCell(COL.website).value = { text: lead.website, hyperlink: ensureHttp(lead.website) };
    row.getCell(COL.maps).value = { text: "open map", hyperlink: lead.mapsUrl };
    row.getCell(COL.pitch).alignment = { wrapText: true, vertical: "top" };
  });

  ws.autoFilter = { from: { row: 2, column: 1 }, to: { row: 2, column: COLUMNS.length } };
}

function colourScore(cell: ExcelJS.Cell, score: number): void {
  const argb = score >= 65 ? "FFF3C9C2" : score >= 40 ? "FFFBEFC9" : "FFE6EEDF";
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb } };
  cell.font = { bold: true, size: 10 };
  cell.alignment = { horizontal: "center" };
}

function ensureHttp(url: string): string {
  return /^https?:\/\//i.test(url) ? url : `http://${url}`;
}

function addSummary(wb: ExcelJS.Workbook, leads: Lead[], meta: { area: string; categories: string[] }): void {
  const ws = wb.addWorksheet("Summary", { properties: { tabColor: { argb: ACCENT } } });
  ws.getColumn(1).width = 30;
  ws.getColumn(2).width = 12;

  const title = ws.getCell(1, 1);
  ws.mergeCells(1, 1, 1, 2);
  title.value = "DS2 Lead Finder — summary";
  title.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  title.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
  ws.getRow(1).height = 28;

  const tagCounts = new Map<string, number>();
  for (const l of leads) for (const t of l.tags) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);

  const rows: Array<[string, string | number]> = [
    ["Area", meta.area],
    ["Categories", meta.categories.join(", ")],
    ["Generated", new Date().toISOString().slice(0, 16).replace("T", " ")],
    ["", ""],
    ["Total leads", leads.length],
    ["High priority", leads.filter((l) => l.priority === "High").length],
    ["Medium priority", leads.filter((l) => l.priority === "Medium").length],
    ["Low priority", leads.filter((l) => l.priority === "Low").length],
    ["", ""],
    ["No website at all", leads.filter((l) => !l.hasWebsite).length],
    ["Site broken / down", leads.filter((l) => l.analysis && !l.analysis.reachable && l.hasWebsite).length],
    ["Not mobile-friendly", leads.filter((l) => l.tags.includes("not-mobile-friendly")).length],
    ["No HTTPS", leads.filter((l) => l.tags.includes("no-https")).length],
    ["", ""],
    ["— Top tags —", ""],
    ...[...tagCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 14),
  ];
  rows.forEach(([k, v], i) => {
    const r = ws.getRow(i + 3);
    r.getCell(1).value = k;
    r.getCell(2).value = v;
    if (typeof k === "string" && (k.startsWith("—") || ["Total leads", "Area"].includes(k))) {
      r.getCell(1).font = { bold: true };
    }
  });
}

export async function writeWorkbook(
  leads: Lead[],
  outPath: string,
  meta: { area: string; categories: string[] },
): Promise<void> {
  const wb = new ExcelJS.Workbook();
  wb.creator = "DS2 Lead Finder";
  wb.created = new Date();

  const sorted = [...leads].sort((a, b) => b.leadScore - a.leadScore);
  addSummary(wb, sorted, meta);
  addSheet(wb, "All leads", sorted, "every business found, best first");
  addSheet(wb, "No website", sorted.filter((l) => !l.hasWebsite), "businesses with no site — build leads");
  addSheet(
    wb,
    "Ugly sites",
    sorted.filter((l) => l.hasWebsite && l.analysis && (l.analysis.ugliness >= 30 || !l.analysis.reachable)),
    "working but dated sites — redesign leads",
  );

  await wb.xlsx.writeFile(outPath);
}
