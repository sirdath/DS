import { getSupabaseServerClient } from '@/app/admin/lib/supabase-server'
import type { CalendarEvent } from './calendar'

function rowToEvent(r: Record<string, unknown>): CalendarEvent {
  return {
    id: String(r.id),
    title: typeof r.title === 'string' ? r.title : '',
    description: typeof r.description === 'string' ? r.description : '',
    eventDate: String(r.event_date ?? ''),
    startTime: typeof r.start_time === 'string' ? r.start_time : null,
    color: typeof r.color === 'string' ? r.color : 'default',
    done: Boolean(r.done),
  }
}

/** Load all shared events (small table). Returns [] gracefully if the table/DB is
 * unavailable (e.g. before the migration is applied), so the UI never crashes. */
export async function loadEvents(): Promise<CalendarEvent[]> {
  try {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from('calendar_events')
      .select('id, title, description, event_date, start_time, color, done')
      .order('event_date', { ascending: true })
      .order('start_time', { ascending: true, nullsFirst: true })
    if (error || !data) return []
    return data.map((r) => rowToEvent(r as Record<string, unknown>))
  } catch {
    return []
  }
}
