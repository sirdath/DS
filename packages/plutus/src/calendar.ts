/**
 * Pure date + business-day math. Everything is computed in UTC from ISO date-only
 * strings so it's deterministic and fixture-comparable with no timezone drift.
 * Holiday tables are a reasonable fixed set (+ 2026 movable dates); a real
 * deployment would extend them, but the engine never hardcodes "today".
 */

import type { IsoDate } from "./types";

function toUtc(date: IsoDate): Date {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1));
}

function fmt(dt: Date): IsoDate {
  const y = dt.getUTCFullYear();
  const m = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: IsoDate, n: number): IsoDate {
  const dt = toUtc(date);
  dt.setUTCDate(dt.getUTCDate() + n);
  return fmt(dt);
}

/** Integer days from `a` to `b` (b − a). Positive if b is later. */
export function daysBetween(a: IsoDate, b: IsoDate): number {
  return Math.round((toUtc(b).getTime() - toUtc(a).getTime()) / 86_400_000);
}

/** Last calendar day of the month containing `date`. */
export function endOfMonth(date: IsoDate): IsoDate {
  const dt = toUtc(date);
  return fmt(new Date(Date.UTC(dt.getUTCFullYear(), dt.getUTCMonth() + 1, 0)));
}

function dayOfWeek(date: IsoDate): number {
  return toUtc(date).getUTCDay(); // 0 = Sunday … 6 = Saturday
}

export function isWeekend(date: IsoDate): boolean {
  const d = dayOfWeek(date);
  return d === 0 || d === 6;
}

// Fixed annual holidays (MM-DD) + specific movable dates (YYYY-MM-DD for 2026).
const FIXED: Record<string, string[]> = {
  GR: ["01-01", "01-06", "03-25", "05-01", "08-15", "10-28", "12-25", "12-26"],
  GB: ["01-01", "12-25", "12-26"],
};
const MOVABLE: Record<string, string[]> = {
  // Orthodox calendar, 2026: Clean Monday, Good Friday, Easter Monday, Holy Spirit.
  GR: ["2026-02-23", "2026-04-10", "2026-04-13", "2026-06-01"],
  // UK bank holidays, 2026.
  GB: ["2026-04-03", "2026-04-06", "2026-05-04", "2026-05-25", "2026-08-31"],
};

export function isHoliday(date: IsoDate, calendar: string): boolean {
  const mmdd = date.slice(5);
  return (FIXED[calendar] ?? []).includes(mmdd) || (MOVABLE[calendar] ?? []).includes(date);
}

export function isBusinessDay(date: IsoDate, calendar: string): boolean {
  return !isWeekend(date) && !isHoliday(date, calendar);
}

/** Roll forward to the next business day; if `date` is already one, return it. */
export function nextBusinessDay(date: IsoDate, calendar: string): IsoDate {
  let d = date;
  let guard = 0;
  while (!isBusinessDay(d, calendar) && guard < 14) {
    d = addDays(d, 1);
    guard += 1;
  }
  return d;
}
