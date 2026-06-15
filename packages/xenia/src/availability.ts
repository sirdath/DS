/**
 * Pure availability synthesis. Given a business's opening hours and a date, lay a
 * slot grid over that day's opening window and drop times already taken. No "now"
 * dependency and no I/O — deterministic given its inputs, so it tests cleanly and
 * a real calendar provider can later replace it behind the same shape.
 */

import type { AvailableSlot, DayOfWeek, OpeningHours } from "./types";

const WEEKDAY: DayOfWeek[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

/** The weekday of an ISO date (YYYY-MM-DD), as a DayOfWeek. */
export function dayOfWeek(date: string): DayOfWeek {
  const d = new Date(`${date}T00:00:00Z`);
  return WEEKDAY[d.getUTCDay()] ?? "mon";
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":");
  return Number(h) * 60 + Number(m);
}

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Bookable start times for `date`, on a `slotIntervalMin` grid, within every
 * opening window for that weekday, excluding any times in `heldTimes`.
 */
export function synthesizeSlots(
  openingHours: OpeningHours[],
  slotIntervalMin: number,
  date: string,
  heldTimes: ReadonlySet<string> = new Set(),
): AvailableSlot[] {
  const weekday = dayOfWeek(date);
  const windows = openingHours.filter((h) => h.day === weekday);
  const slots: AvailableSlot[] = [];
  for (const window of windows) {
    const open = toMinutes(window.open);
    const close = toMinutes(window.close);
    for (let t = open; t + slotIntervalMin <= close; t += slotIntervalMin) {
      const time = toHHMM(t);
      if (!heldTimes.has(time)) slots.push({ date, time });
    }
  }
  return slots;
}
