// Pure, client-safe deadline types + helpers (no server imports). The server loader
// lives in ./deadlines-source, mirroring calendar.ts vs calendar-source.ts.

export interface Deadline {
  id: string
  kind: 'date' | 'metric'
  title: string
  dueDate: string | null // YYYY-MM-DD (kind='date')
  metricCurrent: number | null // kind='metric'
  metricTarget: number | null
  metricUnit: string
  sortOrder: number
  done: boolean
}

export type CountdownTone = 'ok' | 'soon' | 'over'

/** "Overdue" / "Today" / "Tomorrow" / "In 32 days" for a date deadline (local time). */
export function countdown(dueDate: string | null): { label: string; tone: CountdownTone } {
  if (!dueDate) return { label: '', tone: 'ok' }
  const [y, m, d] = dueDate.split('-').map(Number)
  const target = new Date(y ?? 1970, (m ?? 1) - 1, d ?? 1)
  const now = new Date()
  const t0 = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const days = Math.round((target.getTime() - t0.getTime()) / 86_400_000)
  if (days < 0) return { label: 'Overdue', tone: 'over' }
  if (days === 0) return { label: 'Today', tone: 'soon' }
  if (days === 1) return { label: 'Tomorrow', tone: 'soon' }
  if (days <= 14) return { label: `In ${days} days`, tone: 'soon' }
  return { label: `In ${days} days`, tone: 'ok' }
}

/** 0–100 clamp for a metric goal's progress bar. */
export function metricPct(current: number | null, target: number | null): number {
  if (!target || target <= 0 || current == null) return 0
  return Math.max(0, Math.min(100, Math.round((current / target) * 100)))
}
