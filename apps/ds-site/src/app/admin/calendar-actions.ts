'use server'

/**
 * Server actions for the shared admin calendar. Every action asserts admin, then
 * mutates through the RLS-scoped client (RLS independently enforces is_admin → both
 * founders see/edit all events). revalidates the calendar + the dashboard card.
 */

import { revalidatePath } from 'next/cache'
import { assertAdmin } from './lib/assert-admin'
import { getSessionUser, getSupabaseServerClient } from './lib/supabase-server'
import { deleteGoogleEvent, isCalendarSyncConfigured, pushEvent, type GoogleEventInput } from './lib/google-calendar'

const TITLE_MAX = 300
const DESC_MAX = 2000
const COLORS = new Set(['default', 'meeting', 'deadline', 'personal'])
const ASSIGNEES = new Set(['', 'dath', 'stel', 'both'])
const MEETING_TYPES = new Set(['', 'cofounders', 'shareholders', 'client', 'internal'])

/** Accept only http(s) URLs (store '' otherwise) so a meeting link can't inject. */
function safeUrl(v: unknown): string {
  if (typeof v !== 'string' || !v.trim()) return ''
  try {
    const u = new URL(v.trim())
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.toString() : ''
  } catch {
    return ''
  }
}

async function db() {
  await assertAdmin()
  return getSupabaseServerClient()
}

async function currentUserId(): Promise<string | null> {
  const u = await getSessionUser()
  return u?.id ?? null
}

function clean(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max).trim() : ''
}

function refresh() {
  revalidatePath('/admin/calendar')
  revalidatePath('/admin')
}

type Db = Awaited<ReturnType<typeof db>>

// Mirror an event to Google Calendar, non-blocking: the Supabase write already
// succeeded, so a Google hiccup must never fail the admin action. Stores the
// returned google_event_id back on the row so the sync-back can match it. The
// sync-back writes Supabase directly (not through these actions), so this never
// loops.
async function mirrorToGoogle(supabase: Db, id: string, ev: GoogleEventInput, existingGoogleId: string | null): Promise<void> {
  if (!isCalendarSyncConfigured()) return
  try {
    const gid = await pushEvent(ev, existingGoogleId)
    if (!gid) return
    const patch: Record<string, unknown> = { synced_at: new Date().toISOString() }
    if (gid !== existingGoogleId) patch.google_event_id = gid
    await supabase.from('calendar_events').update(patch).eq('id', id)
  } catch (err) {
    console.error('[calendar] google push failed:', err)
  }
}

export async function createEvent(input: {
  title: string
  eventDate: string
  description?: string
  startTime?: string | null
  endTime?: string | null
  color?: string
  assignee?: string
  meetingType?: string
  meetingLink?: string
}): Promise<string> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      title: clean(input.title, TITLE_MAX) || 'Untitled',
      event_date: input.eventDate,
      description: clean(input.description ?? '', DESC_MAX),
      start_time: input.startTime || null,
      // An end time without a start is meaningless — store it only alongside a start.
      end_time: input.startTime ? input.endTime || null : null,
      color: input.color && COLORS.has(input.color) ? input.color : 'default',
      assignee: input.assignee && ASSIGNEES.has(input.assignee) ? input.assignee : '',
      meeting_type: input.meetingType && MEETING_TYPES.has(input.meetingType) ? input.meetingType : '',
      meeting_link: safeUrl(input.meetingLink),
      created_by: await currentUserId(),
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  const id = String(data?.id ?? '')
  refresh()
  await mirrorToGoogle(
    supabase,
    id,
    {
      title: clean(input.title, TITLE_MAX) || 'Untitled',
      description: clean(input.description ?? '', DESC_MAX),
      eventDate: input.eventDate,
      startTime: input.startTime || null,
    },
    null,
  )
  return id
}

export async function updateEvent(
  id: string,
  patch: {
    title?: string
    description?: string
    eventDate?: string
    startTime?: string | null
    endTime?: string | null
    color?: string
    done?: boolean
    assignee?: string
    meetingType?: string
    meetingLink?: string
  },
): Promise<void> {
  if (!id) throw new Error('Missing event id')
  const supabase = await db()
  const row: Record<string, unknown> = {}
  if (patch.title !== undefined) row.title = clean(patch.title, TITLE_MAX)
  if (patch.description !== undefined) row.description = clean(patch.description, DESC_MAX)
  if (patch.eventDate !== undefined) row.event_date = patch.eventDate
  if (patch.startTime !== undefined) row.start_time = patch.startTime || null
  if (patch.endTime !== undefined) row.end_time = patch.endTime || null
  if (patch.color !== undefined) row.color = COLORS.has(patch.color) ? patch.color : 'default'
  if (patch.done !== undefined) row.done = Boolean(patch.done)
  if (patch.assignee !== undefined) row.assignee = ASSIGNEES.has(patch.assignee) ? patch.assignee : ''
  if (patch.meetingType !== undefined) row.meeting_type = MEETING_TYPES.has(patch.meetingType) ? patch.meetingType : ''
  if (patch.meetingLink !== undefined) row.meeting_link = safeUrl(patch.meetingLink)
  const { error } = await supabase.from('calendar_events').update(row).eq('id', id)
  if (error) throw new Error(error.message)
  refresh()
  if (isCalendarSyncConfigured()) {
    // Push the full current state (PATCH replaces the fields we send).
    const { data: cur } = await supabase
      .from('calendar_events')
      .select('title, description, event_date, start_time, google_event_id')
      .eq('id', id)
      .maybeSingle()
    if (cur) {
      await mirrorToGoogle(
        supabase,
        id,
        {
          title: (cur.title as string) ?? '',
          description: (cur.description as string) ?? '',
          eventDate: cur.event_date as string,
          startTime: (cur.start_time as string | null) ?? null,
        },
        (cur.google_event_id as string | null) ?? null,
      )
    }
  }
}

export async function deleteEvent(id: string): Promise<void> {
  if (!id) throw new Error('Missing event id')
  const supabase = await db()
  let googleId: string | null = null
  if (isCalendarSyncConfigured()) {
    const { data: cur } = await supabase.from('calendar_events').select('google_event_id').eq('id', id).maybeSingle()
    googleId = (cur?.google_event_id as string | null) ?? null
  }
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) throw new Error(error.message)
  refresh()
  if (googleId) {
    try {
      await deleteGoogleEvent(googleId)
    } catch (err) {
      console.error('[calendar] google delete failed:', err)
    }
  }
}
