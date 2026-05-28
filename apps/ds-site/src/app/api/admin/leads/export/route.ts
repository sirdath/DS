import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { assertAdmin } from "../../../../admin/lib/assert-admin";
import { getSupabaseServerClient } from "../../../../admin/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 30;

const PURPLE = "FF6D5DD3";
const COLUMNS: Array<{ h: string; w: number; k: string }> = [
  { h: "Verified", w: 9, k: "verified" },
  { h: "Contacted", w: 10, k: "contacted" },
  { h: "Status", w: 12, k: "status" },
  { h: "Business", w: 30, k: "name" },
  { h: "Category", w: 15, k: "category" },
  { h: "Area", w: 18, k: "area" },
  { h: "Priority", w: 9, k: "priority" },
  { h: "Score", w: 7, k: "lead_score" },
  { h: "Ugliness", w: 9, k: "ugliness" },
  { h: "Pitch", w: 50, k: "pitch_angle" },
  { h: "Website", w: 32, k: "website" },
  { h: "Phone", w: 18, k: "phone" },
  { h: "Email", w: 24, k: "email" },
  { h: "Tags", w: 36, k: "tags" },
  { h: "Tech", w: 28, k: "tech" },
  { h: "Notes", w: 28, k: "notes" },
];

export async function GET(): Promise<Response> {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseServerClient();
  const { data, error } = await supabase
    .from("marketing_leads")
    .select("*")
    .order("lead_score", { ascending: false })
    .limit(5000);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  const rows = data ?? [];

  const wb = new ExcelJS.Workbook();
  wb.creator = "DS2 Lead Finder";
  const ws = wb.addWorksheet("Leads", { views: [{ state: "frozen", ySplit: 1 }] });

  const header = ws.getRow(1);
  COLUMNS.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.h;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: PURPLE } };
    ws.getColumn(i + 1).width = c.w;
  });

  for (const r of rows) {
    const row = ws.addRow(
      COLUMNS.map((c) => {
        const v = (r as Record<string, unknown>)[c.k];
        if (c.k === "verified" || c.k === "contacted") return v ? "✓" : "";
        if (Array.isArray(v)) return v.join(", ");
        return v ?? "";
      }),
    );
    row.alignment = { vertical: "top" };
  }
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLUMNS.length } };

  const buffer = Buffer.from(await wb.xlsx.writeBuffer());
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="ds2-leads-${date}.xlsx"`,
    },
  });
}
