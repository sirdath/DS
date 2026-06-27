'use server'

/**
 * Server actions for the shared admin calendar. Every action asserts admin, then
 * mutates through the RLS-scoped client (RLS independently enforces is_admin → both
 * founders see/edit all events). revalidates the calendar + the dashboard card.
 */

import { revalidatePath } from 'next/cache'
import { assertAdmin } from './lib/assert-admin'
import { getSessionUser, getSupabaseServerClient } from './lib/supabase-server'

const TITLE_MAX = 300
const DESC_MAX = 2000
const COLORS = new Set(['default', 'meeting', 'deadline', 'personal'])

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

export async function createEvent(input: {
  title: string
  eventDate: string
  description?: string
  startTime?: string | null
  color?: string
}): Promise<string> {
  const supabase = await db()
  const { data, error } = await supabase
    .from('calendar_events')
    .insert({
      title: clean(input.title, TITLE_MAX) || 'Untitled',
      event_date: input.eventDate,
      description: clean(input.description ?? '', DESC_MAX),
      start_time: input.startTime || null,
      color: input.color && COLORS.has(input.color) ? input.color : 'default',
      created_by: await currentUserId(),
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  refresh()
  return String(data?.id ?? '')
}

export async function updateEvent(
  id: string,
  patch: { title?: string; description?: string; eventDate?: string; startTime?: string | null; color?: string; done?: boolean },
): Promise<void> {
  if (!id) throw new Error('Missing event id')
  const supabase = await db()
  const row: Record<string, unknown> = {}
  if (patch.title !== undefined) row.title = clean(patch.title, TITLE_MAX)
  if (patch.description !== undefined) row.description = clean(patch.description, DESC_MAX)
  if (patch.eventDate !== undefined) row.event_date = patch.eventDate
  if (patch.startTime !== undefined) row.start_time = patch.startTime || null
  if (patch.color !== undefined) row.color = COLORS.has(patch.color) ? patch.color : 'default'
  if (patch.done !== undefined) row.done = Boolean(patch.done)
  const { error } = await supabase.from('calendar_events').update(row).eq('id', id)
  if (error) throw new Error(error.message)
  refresh()
}

export async function deleteEvent(id: string): Promise<void> {
  if (!id) throw new Error('Missing event id')
  const supabase = await db()
  const { error } = await supabase.from('calendar_events').delete().eq('id', id)
  if (error) throw new Error(error.message)
  refresh()
}
