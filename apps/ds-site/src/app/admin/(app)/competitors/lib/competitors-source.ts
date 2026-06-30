import 'server-only'

import { getSupabaseServerClient } from '../../../lib/supabase-server'
import type { Competitor, CompetitorAnalysis, CompetitorStatus } from '../types'

type Row = Record<string, unknown>
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d)

function toCompetitor(r: Row): Competitor {
  const a = r.analysis
  return {
    id: str(r.id),
    name: str(r.name),
    url: str(r.url),
    summary: str(r.summary),
    analysis: a && typeof a === 'object' ? (a as CompetitorAnalysis) : null,
    status: (str(r.status, 'pending') as CompetitorStatus),
    scrapedAt: typeof r.scraped_at === 'string' ? r.scraped_at : null,
    createdAt: str(r.created_at),
  }
}

/** All competitors, newest first. Returns [] (never throws) if the DB is unreachable
 * or the table is absent (the migration not yet applied). */
export async function loadCompetitors(): Promise<Competitor[]> {
  try {
    const db = await getSupabaseServerClient()
    const { data, error } = await db
      .from('competitors')
      .select('*')
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return (data as Row[]).map(toCompetitor)
  } catch {
    return []
  }
}

export async function getCompetitor(id: string): Promise<Competitor | null> {
  try {
    const db = await getSupabaseServerClient()
    const { data, error } = await db.from('competitors').select('*').eq('id', id).maybeSingle()
    if (error || !data) return null
    return toCompetitor(data as Row)
  } catch {
    return null
  }
}
