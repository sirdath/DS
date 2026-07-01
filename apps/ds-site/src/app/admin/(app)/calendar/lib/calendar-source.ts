import { getSupabaseServerClient } from '@/app/admin/lib/supabase-server'
import type { CalendarEvent } from './calendar'

function rowToEvent(r: Record<string, unknown>): CalendarEvent {
  return {
    id: String(r.id),
    title: typeof r.title === 'string' ? r.title : '',
    description: typeof r.description === 'string' ? r.description : '',
    eventDate: String(r.event_date ?? ''),
    startTime: typeof r.start_time === 'string' ? r.start_time : null,
    endTime: typeof r.end_time === 'string' ? r.end_time : null,
    color: typeof r.color === 'string' ? r.color : 'default',
    done: Boolean(r.done),
    assignee: typeof r.assignee === 'string' ? r.assignee : '',
    meetingType: typeof r.meeting_type === 'string' ? r.meeting_type : '',
    meetingLink: typeof r.meeting_link === 'string' ? r.meeting_link : '',
  }
}

/** Load all shared events (small table). Returns [] gracefully if the table/DB is
 * unavailable (e.g. before the migration is applied), so the UI never crashes. The
 * select degrades column-by-column so a pending migration never blanks the calendar. */
const FULL_COLS =
  'id, title, description, event_date, start_time, end_time, color, done, assignee, meeting_type, meeting_link'
const WITH_ASSIGNEE = 'id, title, description, event_date, start_time, end_time, color, done, assignee'
const BASE_COLS = 'id, title, description, event_date, start_time, end_time, color, done'

export async function loadEvents(): Promise<CalendarEvent[]> {
  try {
    const supabase = await getSupabaseServerClient()
    const q = (cols: string) =>
      supabase
        .from('calendar_events')
        .select(cols)
        .order('event_date', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: true })
    // Try the full set; fall back if the meeting columns (or assignee) aren't there yet.
    let res = await q(FULL_COLS)
    if (res.error) res = await q(WITH_ASSIGNEE)
    if (res.error) res = await q(BASE_COLS)
    if (res.error || !res.data) return []
    // A non-literal select string defeats supabase's column-type inference, so data is
    // mistyped — the rows are correct at runtime; cast through unknown.
    return (res.data as unknown as Record<string, unknown>[]).map((r) => rowToEvent(r))
  } catch {
    return []
  }
}
