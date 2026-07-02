/**
 * Timezone handling for the shared calendar. Events are STORED as Europe/Athens wall
 * time (the canonical zone — matches the Google-sync mirror). The founder picks a
 * viewing zone; entered times convert to Athens on save, displayed times convert back.
 * Conversion uses Intl only (no dependency), with the standard two-pass correction so
 * DST transitions land correctly.
 */

export const CANONICAL_TZ = 'Europe/Athens'

export const TIMEZONES = [
  { key: 'Europe/Athens', label: 'Athens' },
  { key: 'Europe/London', label: 'London' },
  { key: 'Asia/Nicosia', label: 'Nicosia' },
  { key: 'UTC', label: 'UTC' },
] as const

interface WallTime {
  date: string // YYYY-MM-DD
  time: string // HH:MM
}

function partsInZone(at: Date, tz: string): { y: number; m: number; d: number; hh: number; mm: number } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const map: Record<string, number> = {}
  for (const p of fmt.formatToParts(at)) {
    if (p.type !== 'literal') map[p.type] = Number(p.value)
  }
  // en-CA hour "24" quirk guard
  const hh = (map.hour ?? 0) % 24
  return { y: map.year ?? 1970, m: map.month ?? 1, d: map.day ?? 1, hh, mm: map.minute ?? 0 }
}

/** The UTC instant whose wall clock in `tz` reads `date time`. Nonexistent wall
 *  times inside a DST spring-forward gap (e.g. Athens 03:30 on the change Sunday)
 *  resolve one hour forward — the same behavior as Google Calendar. */
function zonedWallToUtc(date: string, time: string, tz: string): Date {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  const want = Date.UTC(y ?? 1970, (m ?? 1) - 1, d ?? 1, hh ?? 0, mm ?? 0)
  let utc = want
  for (let i = 0; i < 2; i++) {
    const p = partsInZone(new Date(utc), tz)
    const shown = Date.UTC(p.y, p.m - 1, p.d, p.hh, p.mm)
    utc += want - shown
  }
  return new Date(utc)
}

const pad = (n: number) => (n < 10 ? `0${n}` : String(n))

function utcToZonedWall(at: Date, tz: string): WallTime {
  const p = partsInZone(at, tz)
  return { date: `${p.y}-${pad(p.m)}-${pad(p.d)}`, time: `${pad(p.hh)}:${pad(p.mm)}` }
}

/** Convert a wall time between zones. Same zone (or no time) passes through untouched. */
export function convertWall(date: string, time: string | null, fromTz: string, toTz: string): WallTime {
  if (!time || fromTz === toTz) return { date, time: time ? time.slice(0, 5) : '' }
  return utcToZonedWall(zonedWallToUtc(date, time.slice(0, 5), fromTz), toTz)
}

/** Viewing-zone helpers around the canonical storage zone. */
export function toCanonical(date: string, time: string | null, viewTz: string): WallTime {
  return convertWall(date, time, viewTz, CANONICAL_TZ)
}
export function fromCanonical(date: string, time: string | null, viewTz: string): WallTime {
  return convertWall(date, time, CANONICAL_TZ, viewTz)
}
