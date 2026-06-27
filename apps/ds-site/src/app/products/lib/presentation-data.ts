/**
 * Presentation decks — server-only data access. The builder paths go through the
 * RLS-scoped client (admin-only policy). The public read goes through the anon-safe
 * SECURITY DEFINER rpc keyed by token (20260627120000_presentations.sql), so no anon
 * ever touches the table directly.
 */

import { getSessionUser, getSupabaseServerClient } from '@/app/admin/lib/supabase-server'

const asStringArray = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string') : []

export interface PresentationDeck {
  id: string
  title: string
  clientName: string | null
  items: string[]
  createdAt: string
}

export interface PresentationMeta extends PresentationDeck {
  token: string
  isActive: boolean
}

/** Public read by token (anon-safe rpc). Returns null if missing / revoked / expired. */
export async function getPresentationByToken(token: string): Promise<PresentationDeck | null> {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase.rpc('get_presentation_by_token', { p_token: token })
  if (error) return null
  const row = Array.isArray(data) ? data[0] : data
  if (!row) return null
  return {
    id: String(row.id),
    title: typeof row.title === 'string' ? row.title : '',
    clientName: typeof row.client_name === 'string' ? row.client_name : null,
    items: asStringArray(row.items),
    createdAt: String(row.created_at ?? ''),
  }
}

/** Internal: create a deck (owner = current user). Returns the share token. */
export async function createPresentation(input: { title: string; clientName: string | null; items: string[] }): Promise<string> {
  const supabase = await getSupabaseServerClient()
  const user = await getSessionUser()
  const { data, error } = await supabase
    .from('presentations')
    .insert({
      title: input.title.slice(0, 200),
      client_name: input.clientName ? input.clientName.slice(0, 200) : null,
      items: input.items,
      owner: user?.id ?? null,
    })
    .select('token')
    .single()
  if (error) throw new Error(error.message)
  return String(data?.token ?? '')
}

export async function listPresentations(): Promise<PresentationMeta[]> {
  const supabase = await getSupabaseServerClient()
  const { data, error } = await supabase
    .from('presentations')
    .select('id, token, title, client_name, items, is_active, created_at')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map((r) => ({
    id: String(r.id),
    token: String(r.token),
    title: typeof r.title === 'string' ? r.title : '',
    clientName: typeof r.client_name === 'string' ? r.client_name : null,
    items: asStringArray(r.items),
    isActive: Boolean(r.is_active),
    createdAt: String(r.created_at ?? ''),
  }))
}

export async function setPresentationActive(id: string, active: boolean): Promise<void> {
  if (!id) throw new Error('Missing presentation id')
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.from('presentations').update({ is_active: active }).eq('id', id)
  if (error) throw new Error(error.message)
}
