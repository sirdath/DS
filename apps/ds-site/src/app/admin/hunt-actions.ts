'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from './lib/assert-admin'
import { getSupabaseServerClient } from './lib/supabase-server'
import { LEAD_STATUSES, type LeadStatus } from './lib/leads-types'

const PATH = '/admin/hunt'

async function db() {
  await assertAdmin()
  return getSupabaseServerClient()
}

export async function setTargetFlag(id: string, field: 'verified' | 'contacted', value: boolean): Promise<void> {
  const supabase = await db()
  const { error } = await supabase.from('redesign_targets').update({ [field]: value }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

export async function setTargetStatus(id: string, status: string): Promise<void> {
  if (!(LEAD_STATUSES as readonly string[]).includes(status)) throw new Error('Bad status')
  const supabase = await db()
  const { error } = await supabase.from('redesign_targets').update({ status: status as LeadStatus }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

export async function setTargetNotes(id: string, notes: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase.from('redesign_targets').update({ notes }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

export async function deleteTarget(id: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase.from('redesign_targets').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

export async function promoteTargetToProject(id: string): Promise<void> {
  const supabase = await db()
  const { data, error } = await supabase.from('redesign_targets').select('*').eq('id', id).single()
  if (error || !data) throw new Error(error?.message ?? 'Target not found')
  const insert = await supabase
    .from('projects')
    .insert({
      name: data.name,
      url: data.website ?? '',
      status: 'lead',
      client_company: data.name,
      client_phone: data.phone,
      client_email: data.email,
      current_website_url: data.website,
      why_them: `Redesign target (${data.vision_tier ?? 'dated'}): ${data.vision_notes ?? ''}`.trim(),
      source: `hunt:${data.industry}`,
      project_type: 'website',
    })
    .select('id')
    .single()
  if (insert.error) throw new Error(insert.error.message)
  await supabase.from('redesign_targets').update({ promoted_project_id: insert.data.id, status: 'meeting' }).eq('id', id)
  revalidatePath(PATH)
  revalidatePath('/admin')
}
