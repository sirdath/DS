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
    sortOrder: toNum(r.sort_order) ?? 0,
    done: Boolean(r.done),
  }
}

/** All deadlines, in insert order. Returns [] gracefully if the table/DB is unavailable
 * (e.g. before the migration is applied), so the dashboard never crashes. */
export async function loadDeadlines(): Promise<Deadline[]> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from('planning_deadlines')
      .select('id, kind, title, due_date, metric_current, metric_target, metric_unit, sort_order, done')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
    if (error || !data) return []
    return (data as unknown as Record<string, unknown>[]).map(rowToDeadline)
  } catch {
    return []
  }
}
