export interface CalendarEvent {
  id: string
  title: string
  description: string
  eventDate: string // YYYY-MM-DD
  startTime: string | null // HH:MM[:SS] or null (all-day)
  color: string
  done: boolean
  assignee: string // '' | 'dath' | 'stel' | 'both'
  meetingType: string // '' | cofounders | shareholders | client | internal ('' = not a meeting)
  meetingLink: string // placeholder join URL
}

export const ASSIGNEES = [
  { key: '', label: 'Unassigned' },
  { key: 'dath', label: 'Dath' },
  { key: 'stel', label: 'Stel' },
  { key: 'both', label: 'Both' },
] as const

export function assigneeLabel(a: string): string {
  return ASSIGNEES.find((x) => x.key === a)?.label ?? ''
}

// Meeting types — kept app-side (not a DB enum) so a buyer can relabel without a migration.
export const MEETING_TYPES = [
  { key: 'cofounders', label: 'Cofounders team' },
  { key: 'shareholders', label: 'Top shareholders' },
  { key: 'client', label: 'Client' },
  { key: 'internal', label: 'Internal' },
] as const

export function meetingTypeLabel(t: string): string {
  return MEETING_TYPES.find((x) => x.key === t)?.label ?? ''
}

export interface DayCell {
  date: string // YYYY-MM-DD
  day: number
  inMonth: boolean
}

export const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
export const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const pad = (n: number) => (n < 10 ? `0${n}` : String(n))

export function isoDate(year: number, monthIndex: number, day: number): string {
  return `${year}-${pad(monthIndex + 1)}-${pad(day)}`
}

/** A Monday-first month grid — always 6 weeks × 7 days (year, month 0-indexed). */
export function monthGrid(year: number, month: number): DayCell[][] {
  const first = new Date(year, month, 1)
  const firstDow = (first.getDay() + 6) % 7 // JS Sun=0 → Mon-first Mon=0..Sun=6
  const cur = new Date(year, month, 1 - firstDow)
  const weeks: DayCell[][] = []
  for (let w = 0; w < 6; w++) {
    const row: DayCell[] = []
    for (let d = 0; d < 7; d++) {
      row.push({
        date: isoDate(cur.getFullYear(), cur.getMonth(), cur.getDate()),
        day: cur.getDate(),
        inMonth: cur.getMonth() === month,
      })
      cur.setDate(cur.getDate() + 1)
    }
    weeks.push(row)
  }
  return weeks
}

export function monthLabel(year: number, month: number): string {
  return `${MONTHS[month] ?? ''} ${year}`
}

/** "9 Jun" / "9 Jun, 14:30" for an event row. */
export function eventWhen(e: CalendarEvent): string {
  const [, m, d] = e.eventDate.split('-').map(Number)
  const day = d ?? 1
  const mon = (MONTHS[(m ?? 1) - 1] ?? '').slice(0, 3)
  const time = e.startTime ? `, ${e.startTime.slice(0, 5)}` : ''
  return `${day} ${mon}${time}`
}

/** "Today" / "Tomorrow" / "In 3 days" / "9 Jun, 14:30" relative to now (local). */
export function relativeWhen(e: CalendarEvent): string {
  const [y, m, d] = e.eventDate.split('-').map(Number)
  const target = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
  const now = new Date()
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((target.getTime() - t0.getTime()) / 86_400_000)
  const time = e.startTime ? ` · ${e.startTime.slice(0, 5)}` : ''
  if (days < 0) return `Past${time}`
  if (days === 0) return `Today${time}`
  if (days === 1) return `Tomorrow${time}`
  if (days < 7) return `In ${days} days${time}`
  return eventWhen(e)
}
