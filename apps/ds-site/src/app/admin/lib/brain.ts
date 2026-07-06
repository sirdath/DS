import 'server-only'
import { getServiceRoleClient } from './supabase-server'

/**
 * The DS2 brain — shared semantic memory. Durable facts the copilot carries
 * across conversations, shared across the founders. Retrieval is HYBRID: gte-small
 * vectors (384-dim, generated in-stack by the brain-embed Edge Function — nothing
 * leaves Supabase) fused with full-text + trigram via RRF (the ds2_brain_recall_hybrid
 * SQL fn). remember() dedups on write (refreshes a near-identical fact instead of
 * piling up), and superseded facts are filtered out of recall. Content is canonical;
 * the vector is a rebuildable index. If embedding is unavailable it degrades to the
 * keyless text recall. Server-only, service-role.
 */
export interface BrainFact {
  id: string
  content: string
  kind: string
  tags: string[]
  score?: number
}

const EMBED_MODEL = 'gte-small'
const EMBED_DIM = 384
// cosine distance below which two facts are treated as the same (similarity > 0.92)
const DEDUP_DISTANCE = 0.08

function hasSupabase(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
}

const toVec = (arr: number[]): string => `[${arr.join(',')}]`

/** Embed via the in-stack gte-small Edge Function. Returns null on any failure
 *  so callers degrade to keyless text recall / vector-less inserts. */
async function embed(texts: string[]): Promise<number[][] | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key || texts.length === 0) return null
  try {
    const res = await fetch(`${url}/functions/v1/brain-embed`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${key}` },
      body: JSON.stringify({ texts }),
    })
    if (!res.ok) return null
    const data = (await res.json()) as { embeddings?: number[][] }
    return Array.isArray(data.embeddings) ? data.embeddings : null
  } catch {
    return null
  }
}
const embedOne = async (text: string): Promise<number[] | null> => (await embed([text]))?.[0] ?? null

const rowToFact = (r: unknown): BrainFact => {
  const row = r as { id: string; content: string; kind: string; tags: string[]; score?: number }
  return { id: row.id, content: row.content, kind: row.kind, tags: row.tags ?? [], score: row.score }
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
  const content = input.content.trim()
  const kind = input.kind || 'fact'
  const tags = input.tags ?? []
  const vec = await embedOne(content)

  // Dedup-on-write: if a near-identical live fact exists, refresh it in place
  // instead of piling up a duplicate.
  if (vec) {
    const { data: near } = await sb.rpc('ds2_brain_nearest', { q_embedding: toVec(vec) })
    const top = ((near as unknown[]) ?? [])[0] as { id: string; distance: number } | undefined
    if (top && top.distance < DEDUP_DISTANCE) {
      const { data: upd } = await sb
        .from('ds2_brain')
        .update({
          content,
          kind,
          tags,
          embedding: toVec(vec),
          embedding_model: EMBED_MODEL,
          embedding_dim: EMBED_DIM,
          updated_at: new Date().toISOString(),
        })
        .eq('id', top.id)
        .select('id,content,kind,tags')
        .maybeSingle()
      if (upd) return rowToFact(upd)
    }
  }

  const { data } = await sb
    .from('ds2_brain')
    .insert({
      content,
      kind,
      tags,
      source: input.source ?? null,
      created_by: input.createdBy ?? '',
      embedding: vec ? toVec(vec) : null,
      embedding_model: vec ? EMBED_MODEL : null,
      embedding_dim: vec ? EMBED_DIM : null,
    })
    .select('id,content,kind,tags')
    .maybeSingle()
  return data ? rowToFact(data) : null
}

export async function recallFacts(query: string, k = 6): Promise<BrainFact[]> {
  if (!hasSupabase() || !query.trim()) return []
  const sb = getServiceRoleClient()
  const q = query.trim()
  const vec = await embedOne(q)
  if (vec) {
    const { data } = await sb.rpc('ds2_brain_recall_hybrid', { q, q_embedding: toVec(vec), match_count: k })
    if (Array.isArray(data)) return (data as unknown[]).map(rowToFact)
  }
  // Fallback: keyless text recall.
  const { data } = await sb.rpc('ds2_brain_recall', { q, k })
  return ((data as unknown[]) ?? []).map(rowToFact)
}

export async function listFacts(limit = 100): Promise<BrainFact[]> {
  if (!hasSupabase()) return []
  const sb = getServiceRoleClient()
  const { data } = await sb
    .from('ds2_brain')
    .select('id,content,kind,tags')
    .is('superseded_by', null)
    .order('updated_at', { ascending: false })
    .limit(limit)
  return ((data as unknown[]) ?? []).map(rowToFact)
}

export async function forgetFact(id: string): Promise<void> {
  if (!hasSupabase() || !id) return
  const sb = getServiceRoleClient()
  await sb.from('ds2_brain').delete().eq('id', id)
}
