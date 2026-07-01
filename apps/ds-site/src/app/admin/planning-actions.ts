'use server'

/**
 * Server actions for planning deadlines (generic date-or-metric goals shown on the
 * dashboard). Every action asserts admin, then mutates through the RLS-scoped client
 * (is_admin → both founders see/edit all). Revalidates the dashboard.
 */

import { revalidatePath } from 'next/cache'
import { assertAdmin } from './lib/assert-admin'
import { getSessionUser, getSupabaseServerClient } from './lib/supabase-server'

const KINDS = new Set(['date', 'metric'])
const TITLE_MAX = 200
const UNIT_MAX = 12

async function db() {
  await assertAdmin()
  return getSupabaseServerClient()
}

function refresh() {
  revalidatePath('/admin')
}

function clean(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max).trim() : ''
}

function num(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

export interface DeadlineInput {
  kind: string
  title: string
  dueDate?: string | null
  metricCurrent?: number | string | null
  metricTarget?: number | string | null
  metricUnit?: string
}

export async function createDeadline(input: DeadlineInput): Promise<string> {
  const supabase = await db()
  const kind = KINDS.has(input.kind) ? input.kind : 'date'
  const user = await getSessionUser()
  const { data, error } = await supabase
    .from('planning_deadlines')
    .insert({
      kind,
      title: clean(input.title, TITLE_MAX) || 'Untitled',
      due_date: kind === 'date' ? input.dueDate || null : null,
      metric_current: kind === 'metric' ? num(input.metricCurrent) : null,
      metric_target: kind === 'metric' ? num(input.metricTarget) : null,
      metric_unit: kind === 'metric' ? clean(input.metricUnit ?? '', UNIT_MAX) : '',
      created_by: user?.id ?? null,
    })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  refresh()
  return String(data?.id ?? '')
}

export async function updateDeadline(
  id: string,
  patch: {
    kind?: string
    title?: string
    dueDate?: string | null
    metricCurrent?: number | string | null
    metricTarget?: number | string | null
    metricUnit?: string
    done?: boolean
  },
): Promise<void> {
  if (!id) throw new Error('Missing deadline id')
  const supabase = await db()
  const row: Record<string, unknown> = {}
  if (patch.title !== undefined) row.title = clean(patch.title, TITLE_MAX)
  if (patch.done !== undefined) row.done = Boolean(patch.done)
  if (patch.kind !== undefined) {
    // A kind change rewrites the whole row consistently (mirrors createDeadline): only
    // the columns for the chosen kind are set, the others are nulled/cleared.
    const kind = KINDS.has(patch.kind) ? patch.kind : 'date'
    row.kind = kind
    if (kind === 'date') {
      row.due_date = patch.dueDate || null
      row.metric_current = null
      row.metric_target = null
      row.metric_unit = ''
    } else {
      row.metric_current = num(patch.metricCurrent)
      row.metric_target = num(patch.metricTarget)
      row.metric_unit = clean(patch.metricUnit ?? '', UNIT_MAX)
      row.due_date = null
    }
  } else {
    // No kind change: patch only the fields provided.
    if (patch.dueDate !== undefined) row.due_date = patch.dueDate || null
    if (patch.metricCurrent !== undefined) row.metric_current = num(patch.metricCurrent)
    if (patch.metricTarget !== undefined) row.metric_target = num(patch.metricTarget)
    if (patch.metricUnit !== undefined) row.metric_unit = clean(patch.metricUnit, UNIT_MAX)
  }
  const { error } = await supabase.from('planning_deadlines').update(row).eq('id', id)
  if (error) throw new Error(error.message)
  refresh()
}

export async function deleteDeadline(id: string): Promise<void> {
  if (!id) throw new Error('Missing deadline id')
  const supabase = await db()
  const { error } = await supabase.from('planning_deadlines').delete().eq('id', id)
  if (error) throw new Error(error.message)
  refresh()
}
