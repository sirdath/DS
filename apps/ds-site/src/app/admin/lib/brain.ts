import 'server-only'
import { getServiceRoleClient } from './supabase-server'

/**
 * The DS2 brain — shared semantic memory. Durable facts the copilot carries
 * across conversations (client preferences, decisions, who-owns-what, rules),
 * shared across the founders. Recall is keyless for now (full-text + trigram via
 * the ds2_brain_recall SQL function); a vector/hybrid layer slots in once an
 * embedding provider is chosen. Server-only, service-role.
 */
export interface BrainFact {
  id: string
  content: string
  kind: string
  tags: string[]
  score?: number
}

function hasSupabase(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

export async function rememberFact(input: {
  content: string
  kind?: string
  tags?: string[]
  source?: string
  createdBy?: string
}): Promise<BrainFact | null> {
  if (!hasSupabase() || !input.content.trim()) return null
  const sb = getServiceRoleClient()
  const { data } = await sb
    .from('ds2_brain')
    .insert({
      content: input.content.trim(),
      kind: input.kind || 'fact',
      tags: input.tags ?? [],
      source: input.source ?? null,
      created_by: input.createdBy ?? '',
    })
    .select('id,content,kind,tags')
    .maybeSingle()
  if (!data) return null
  return { id: data.id as string, content: data.content as string, kind: data.kind as string, tags: (data.tags as string[]) ?? [] }
}

export async function recallFacts(query: string, k = 6): Promise<BrainFact[]> {
  if (!hasSupabase() || !query.trim()) return []
  const sb = getServiceRoleClient()
  const { data } = await sb.rpc('ds2_brain_recall', { q: query.trim(), k })
  return ((data as unknown[]) ?? []).map((r) => {
    const row = r as { id: string; content: string; kind: string; tags: string[]; score: number }
    return { id: row.id, content: row.content, kind: row.kind, tags: row.tags ?? [], score: row.score }
  })
}

export async function listFacts(limit = 100): Promise<BrainFact[]> {
  if (!hasSupabase()) return []
  const sb = getServiceRoleClient()
  const { data } = await sb
    .from('ds2_brain')
    .select('id,content,kind,tags')
    .order('updated_at', { ascending: false })
    .limit(limit)
  return ((data as unknown[]) ?? []).map((r) => {
    const row = r as { id: string; content: string; kind: string; tags: string[] }
    return { id: row.id, content: row.content, kind: row.kind, tags: row.tags ?? [] }
  })
}

export async function forgetFact(id: string): Promise<void> {
  if (!hasSupabase() || !id) return
  const sb = getServiceRoleClient()
  await sb.from('ds2_brain').delete().eq('id', id)
}
