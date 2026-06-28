'use server'

import { revalidatePath } from 'next/cache'
import { assertAdmin } from './lib/assert-admin'
import { getSupabaseServerClient } from './lib/supabase-server'
import { LEAD_STATUSES, type LeadStatus, type ParsedLead } from './lib/leads-types'

const PATH = '/admin/funnel/leads'

async function db() {
  await assertAdmin()
  return getSupabaseServerClient()
}

export async function setLeadFlag(id: string, field: 'verified' | 'contacted', value: boolean): Promise<void> {
  const supabase = await db()
  const { error } = await supabase.from('marketing_leads').update({ [field]: value }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

export async function setLeadStatus(id: string, status: string): Promise<void> {
  if (!(LEAD_STATUSES as readonly string[]).includes(status)) throw new Error('Bad status')
  const supabase = await db()
  const { error } = await supabase.from('marketing_leads').update({ status: status as LeadStatus }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

export async function updateLeadContact(id: string, patch: { phone?: string; email?: string; notes?: string }): Promise<void> {
  const supabase = await db()
  const row: Record<string, string> = {}
  if (patch.phone !== undefined) row.phone = patch.phone.trim()
  if (patch.email !== undefined) row.email = patch.email.trim()
  if (patch.notes !== undefined) row.notes = patch.notes
  if (Object.keys(row).length === 0) return
  const { error } = await supabase.from('marketing_leads').update(row).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

export async function bulkSetStatus(ids: string[], status: string): Promise<void> {
  if (!ids.length) return
  if (!(LEAD_STATUSES as readonly string[]).includes(status)) throw new Error('Bad status')
  const supabase = await db()
  const { error } = await supabase.from('marketing_leads').update({ status: status as LeadStatus }).in('id', ids)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

export async function deleteLead(id: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase.from('marketing_leads').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

export async function bulkDeleteLeads(ids: string[]): Promise<void> {
  if (!ids.length) return
  const supabase = await db()
  const { error } = await supabase.from('marketing_leads').delete().in('id', ids)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

export async function insertManualLeads(leads: ParsedLead[]): Promise<{ inserted: number }> {
  const supabase = await db()
  const rows = leads
    .filter((l) => l.name?.trim())
    .map((l) => ({
      source: 'manual',
      source_id: null,
      name: l.name.trim(),
      category: l.category,
      area: l.area,
      website: l.website,
      has_website: Boolean(l.website),
      phone: l.phone,
      email: l.email,
      pitch_angle: l.website ? 'Pasted lead, review their site.' : 'Pasted lead, no website noted.',
      lead_score: l.website ? 40 : 60,
      priority: l.website ? 'Medium' : 'High',
      analysis_status: l.website ? 'pending' : 'na',
      notes: l.notes ?? '',
    }))
  if (!rows.length) return { inserted: 0 }
  const { error, count } = await supabase.from('marketing_leads').insert(rows, { count: 'exact' })
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
  return { inserted: count ?? rows.length }
}

export async function promoteLeadToProject(id: string): Promise<void> {
  const supabase = await db()
  const { data, error } = await supabase.from('marketing_leads').select('*').eq('id', id).single()
  if (error || !data) throw new Error(error?.message ?? 'Lead not found')

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
      why_them: data.pitch_angle,
      source: `lead-finder:${data.source}`,
      project_type: 'website',
    })
    .select('id')
    .single()
  if (insert.error) throw new Error(insert.error.message)

  await supabase
    .from('marketing_leads')
    .update({ promoted_project_id: insert.data.id, status: 'meeting' })
    .eq('id', id)
  revalidatePath(PATH)
  revalidatePath('/admin')
}
