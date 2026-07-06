import 'server-only'
import { getServiceRoleClient } from './supabase-server'

/**
 * Persistence for copilot conversations (episodic memory). Server-only,
 * service-role; the route handlers gate on owner role before calling these.
 * A conversation stores two blobs: `items` (UI turns for display) and `history`
 * (the Anthropic message array replayed to continue the thread).
 */
export interface ConvSummary {
  id: string
  title: string
  createdBy: string
  updatedAt: string
}
export interface ConvFull {
  id: string
  title: string
  items: unknown[]
  history: unknown[]
  usage: Record<string, unknown>
}

function hasSupabase(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

export async function listConversations(): Promise<ConvSummary[]> {
  if (!hasSupabase()) return []
  const sb = getServiceRoleClient()
  const { data } = await sb
    .from('copilot_conversations')
    .select('id,title,created_by,updated_at')
    .order('updated_at', { ascending: false })
    .limit(50)
  return (data ?? []).map((r) => ({
    id: r.id as string,
    title: (r.title as string) || 'New chat',
    createdBy: (r.created_by as string) || '',
    updatedAt: r.updated_at as string,
  }))
}

export async function getConversation(id: string): Promise<ConvFull | null> {
  if (!hasSupabase() || !id) return null
  const sb = getServiceRoleClient()
  const { data } = await sb
    .from('copilot_conversations')
    .select('id,title,items,history,usage')
    .eq('id', id)
    .maybeSingle()
  if (!data) return null
  return {
    id: data.id as string,
    title: (data.title as string) || 'New chat',
    items: (data.items as unknown[]) ?? [],
    history: (data.history as unknown[]) ?? [],
    usage: (data.usage as Record<string, unknown>) ?? {},
  }
}

/** Upsert by id: update if it exists, otherwise insert (stamping created_by). */
export async function saveConversation(input: {
  id: string
  title: string
  items: unknown[]
  history: unknown[]
  usage: Record<string, unknown>
  createdBy: string
}): Promise<void> {
  if (!hasSupabase() || !input.id) return
  const sb = getServiceRoleClient()
  const patch = {
    title: input.title || 'New chat',
    items: input.items,
    history: input.history,
    usage: input.usage,
    updated_at: new Date().toISOString(),
  }
  const { data } = await sb
    .from('copilot_conversations')
    .update(patch)
    .eq('id', input.id)
    .select('id')
  if (!data || data.length === 0) {
    await sb
      .from('copilot_conversations')
      .insert({ id: input.id, created_by: input.createdBy, ...patch })
  }
}

export async function deleteConversation(id: string): Promise<void> {
  if (!hasSupabase() || !id) return
  const sb = getServiceRoleClient()
  await sb.from('copilot_conversations').delete().eq('id', id)
}

export async function renameConversation(id: string, title: string): Promise<void> {
  if (!hasSupabase() || !id) return
  const sb = getServiceRoleClient()
  await sb
    .from('copilot_conversations')
    .update({ title: title.slice(0, 120) || 'New chat', updated_at: new Date().toISOString() })
    .eq('id', id)
}
