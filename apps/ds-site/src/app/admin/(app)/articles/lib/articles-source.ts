import 'server-only'

import { getSupabaseServerClient } from '../../../lib/supabase-server'
import type { AdminArticle, ArticleStatus } from '../types'

type Row = Record<string, unknown>
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d)

export function toAdminArticle(r: Row): AdminArticle {
  const status = str(r.status, 'draft')
  return {
    id: str(r.id),
    slug: str(r.slug),
    lang: r.lang === 'el' ? 'el' : 'en',
    hreflangGroup: str(r.hreflang_group),
    title: str(r.title),
    description: str(r.description),
    bodyMd: str(r.body_md),
    topic: str(r.topic),
    status: (status === 'review' || status === 'published' ? status : 'draft') as ArticleStatus,
    publishedAt: typeof r.published_at === 'string' ? r.published_at : null,
    createdAt: str(r.created_at),
    updatedAt: str(r.updated_at),
  }
}

/** Every article, any status, newest first. Returns [] (never throws) if the
 * DB is unreachable or the table is absent (migration not yet applied). */
export async function loadAllArticles(): Promise<AdminArticle[]> {
  try {
    const db = await getSupabaseServerClient()
    const { data, error } = await db
      .from('articles')
      .select('*')
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return (data as Row[]).map(toAdminArticle)
  } catch {
    return []
  }
}
