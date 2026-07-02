import 'server-only'

/**
 * Public blog reads. Uses a plain anon-key client (no cookies) so the /blog
 * pages stay statically renderable with ISR — RLS only exposes published rows
 * to anon, which is exactly what these pages show. Every loader degrades to
 * empty results if the env or the articles table is missing (migration not
 * yet applied), so the blog never crashes the site.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

/** Canonical public origin — used by sitemap, robots, RSS and JSON-LD. */
export const SITE_URL = 'https://www.ds2-consulting.com'

export interface BlogArticle {
  id: string
  slug: string
  lang: 'el' | 'en'
  title: string
  description: string
  bodyMd: string
  topic: string
  publishedAt: string | null
  updatedAt: string
}

const LIST_COLUMNS = 'id, slug, lang, title, description, body_md, topic, published_at, updated_at'

/** "12 Mar 2026" / "12 Μαρ 2026" — locale follows the article's language. */
export function formatArticleDate(iso: string | null, lang: 'el' | 'en'): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleDateString(lang === 'el' ? 'el-GR' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

type Row = Record<string, unknown>
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d)

function toArticle(r: Row): BlogArticle {
  return {
    id: str(r.id),
    slug: str(r.slug),
    lang: r.lang === 'el' ? 'el' : 'en',
    title: str(r.title),
    description: str(r.description),
    bodyMd: str(r.body_md),
    topic: str(r.topic),
    publishedAt: typeof r.published_at === 'string' ? r.published_at : null,
    updatedAt: str(r.updated_at),
  }
}

function anonClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

/** Published articles, newest first. Returns [] (never throws) on any failure. */
export async function loadPublishedArticles(limit = 100): Promise<BlogArticle[]> {
  try {
    const db = anonClient()
    if (!db) return []
    const { data, error } = await db
      .from('articles')
      .select(LIST_COLUMNS)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return (data as Row[]).map(toArticle)
  } catch {
    return []
  }
}

/** One published article by slug, or null. */
export async function getPublishedArticle(slug: string): Promise<BlogArticle | null> {
  try {
    const db = anonClient()
    if (!db) return null
    const { data, error } = await db
      .from('articles')
      .select(LIST_COLUMNS)
      .eq('status', 'published')
      .eq('slug', slug)
      .maybeSingle()
    if (error || !data) return null
    return toArticle(data as Row)
  } catch {
    return null
  }
}

/** Up to `limit` other published articles sharing a topic (for "related" blocks). */
export async function loadRelatedArticles(topic: string, excludeId: string, limit = 3): Promise<BlogArticle[]> {
  if (!topic.trim()) return []
  try {
    const db = anonClient()
    if (!db) return []
    const { data, error } = await db
      .from('articles')
      .select(LIST_COLUMNS)
      .eq('status', 'published')
      .eq('topic', topic)
      .neq('id', excludeId)
      .order('published_at', { ascending: false })
      .limit(limit)
    if (error || !data) return []
    return (data as Row[]).map(toArticle)
  } catch {
    return []
  }
}
