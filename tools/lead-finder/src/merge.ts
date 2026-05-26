/**
 * Merge support: read a previously-generated tracker workbook and recover the
 * human-entered state (Verified / Done / Status / Notes) keyed by the hidden
 * "Key" column, so re-running the finder never wipes work already done.
 */
import { existsSync } from "node:fs";
import ExcelJS from "exceljs";

export interface SavedState {
  verified: string;
  done: string;
  status: string;
  notes: string;
}

/** Map of stable key → saved tracking state, pulled from an existing workbook. */
export async function readPriorState(path: string): Promise<Map<string, SavedState>> {
  const state = new Map<string, SavedState>();
  if (!existsSync(path)) return state;

  let wb: ExcelJS.Workbook;
  try {
    wb = new ExcelJS.Workbook();
    await wb.xlsx.readFile(path);
  } catch {
    return state; // unreadable/locked → start fresh rather than crash
  }

  // The "All leads" sheet holds every row; read its header to find columns by name.
  const ws = wb.getWorksheet("All leads") ?? wb.worksheets.find((w) => w.name !== "Dashboard");
  if (!ws) return state;

  const headerRow = findHeaderRow(ws);
  if (!headerRow) return state;
  const cols = columnIndex(ws.getRow(headerRow));
  const keyCol = cols["Key"];
  if (!keyCol) return state; // older file without the Key column → can't safely merge

  for (let r = headerRow + 1; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const key = text(row.getCell(keyCol).value);
    if (!key) continue;
    state.set(key, {
      verified: text(row.getCell(cols["Verified"] ?? 0)?.value),
      done: text(row.getCell(cols["Done"] ?? 0)?.value),
      status: text(row.getCell(cols["Status"] ?? 0)?.value),
      notes: text(row.getCell(cols["Notes"] ?? 0)?.value),
    });
  }
  return state;
}

/** The header is the row whose first cells include "Verified"/"Business". */
function findHeaderRow(ws: ExcelJS.Worksheet): number | null {
  for (let r = 1; r <= Math.min(5, ws.rowCount); r++) {
    const values = ws.getRow(r).values;
    if (Array.isArray(values) && values.some((v) => text(v) === "Business")) return r;
  }
  return null;
}

function columnIndex(headerRow: ExcelJS.Row): Record<string, number> {
  const map: Record<string, number> = {};
  headerRow.eachCell((cell, col) => {
    const name = text(cell.value);
    if (name) map[name] = col;
  });
  return map;
}

function text(v: ExcelJS.CellValue | undefined): string {
  if (v == null) return "";
  if (typeof v === "object" && "text" in v && typeof v.text === "string") return v.text.trim();
  if (typeof v === "object" && "result" in v) return String((v as { result: unknown }).result ?? "").trim();
  return String(v).trim();
}
