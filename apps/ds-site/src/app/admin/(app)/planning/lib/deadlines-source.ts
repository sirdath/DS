import { getSupabaseServerClient } from '@/app/admin/lib/supabase-server'
import type { Deadline } from './planning'

const toNum = (v: unknown): number | null => {
  if (typeof v === 'number') return v
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function rowToDeadline(r: Record<string, unknown>): Deadline {
  return {
    id: String(r.id),
    kind: r.kind === 'metric' ? 'metric' : 'date',
    title: typeof r.title === 'string' ? r.title : '',
    dueDate: typeof r.due_date === 'string' ? r.due_date : null,
    metricCurrent: toNum(r.metric_current),
    metricTarget: toNum(r.metric_target),
    metricUnit: typeof r.metric_unit === 'string' ? r.metric_unit : '',
    metricSource: typeof r.metric_source === 'string' ? r.metric_source : '',
    sortOrder: toNum(r.sort_order) ?? 0,
    done: Boolean(r.done),
  }
}

/** All deadlines, in insert order. Returns [] gracefully if the table/DB is unavailable,
 * and degrades the select if metric_source isn't there yet (migration pending). */
const FULL_COLS = 'id, kind, title, due_date, metric_current, metric_target, metric_unit, metric_source, sort_order, done'
const BASE_COLS = 'id, kind, title, due_date, metric_current, metric_target, metric_unit, sort_order, done'

export async function loadDeadlines(): Promise<Deadline[]> {
  try {
    const supabase = await getSupabaseServerClient()
    const q = (cols: string) =>
      supabase
        .from('planning_deadlines')
        .select(cols)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })
    let res = await q(FULL_COLS)
    if (res.error) res = await q(BASE_COLS)
    if (res.error || !res.data) return []
    return (res.data as unknown as Record<string, unknown>[]).map(rowToDeadline)
  } catch {
    return []
  }
}
