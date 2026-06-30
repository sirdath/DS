'use server'

/**
 * Competitors tab actions. add/delete go through the RLS admin client; analyze is the
 * "Scan": scrape the competitor's site, then ask Claude (official @anthropic-ai/sdk,
 * forced tool-use → structured JSON) for a DS2-framed competitive analysis — the scrape
 * + SDK call live in ./(app)/competitors/lib/analyze, shared with the practice script.
 *
 * Per-founder billing: the scan uses the LOGGED-IN admin's own Anthropic key — keys are
 * an `email=key` map in ADMIN_ANTHROPIC_KEYS (same shape as ADMIN_ALLOWED_EMAILS), so
 * Dath's scans bill Dath and Stel's bill Stel; falls back to a shared ANTHROPIC_API_KEY.
 */

import { revalidatePath } from 'next/cache'
import { assertAdmin } from './lib/assert-admin'
import { getSessionUser, getSupabaseServerClient } from './lib/supabase-server'
import { analyzeUrl } from './(app)/competitors/lib/analyze'

async function db() {
  await assertAdmin()
  return getSupabaseServerClient()
}

/** The Anthropic key for the logged-in founder: their entry in ADMIN_ANTHROPIC_KEYS
 *  (`email=key,email=key`), else the shared ANTHROPIC_API_KEY. */
function keyForEmail(email: string | null | undefined): string | undefined {
  const target = (email ?? '').trim().toLowerCase()
  if (target) {
    const raw = process.env.ADMIN_ANTHROPIC_KEYS ?? ''
    for (const pair of raw.split(',')) {
      const i = pair.indexOf('=')
      if (i === -1) continue
      if (pair.slice(0, i).trim().toLowerCase() === target) {
        const key = pair.slice(i + 1).trim()
        if (key) return key
      }
    }
  }
  return process.env.ANTHROPIC_API_KEY
}

function refresh() {
  revalidatePath('/admin/competitors')
}

function normUrl(raw: string): string {
  const u = raw.trim()
  return /^https?:\/\//i.test(u) ? u : `https://${u}`
}

export async function addCompetitor(input: { url: string; name?: string }): Promise<string> {
  const supabase = await db()
  const url = normUrl(input.url)
  let host = ''
  try {
    host = new URL(url).hostname.replace(/^www\./, '')
  } catch {
    throw new Error('That URL does not look right.')
  }
  const name = (input.name?.trim() || host).slice(0, 120)
  const { data, error } = await supabase
    .from('competitors')
    .insert({ name, url, status: 'pending' })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  refresh()
  return String(data?.id ?? '')
}

export async function deleteCompetitor(id: string): Promise<void> {
  const supabase = await db()
  const { error } = await supabase.from('competitors').delete().eq('id', id)
  if (error) throw new Error(error.message)
  refresh()
}

export async function analyzeCompetitor(id: string): Promise<void> {
  const supabase = await db()
  const { data: row } = await supabase.from('competitors').select('name, url').eq('id', id).maybeSingle()
  if (!row) throw new Error('Competitor not found.')

  let email: string | null = null
  try {
    email = (await getSessionUser())?.email ?? null
  } catch {
    email = null
  }
  const apiKey = keyForEmail(email)
  if (!apiKey) {
    throw new Error('No Anthropic key for your account. Add yours to ADMIN_ANTHROPIC_KEYS (email=key), or set ANTHROPIC_API_KEY.')
  }

  await supabase.from('competitors').update({ status: 'analyzing' }).eq('id', id)
  refresh()
  try {
    const { analysis } = await analyzeUrl({ apiKey, name: String(row.name), url: String(row.url) })
    await supabase
      .from('competitors')
      .update({ analysis, summary: analysis.summary ?? '', status: 'analyzed', scraped_at: new Date().toISOString() })
      .eq('id', id)
  } catch (err) {
    await supabase.from('competitors').update({ status: 'error' }).eq('id', id)
    throw new Error(err instanceof Error ? err.message : 'Scan failed.')
  }
  refresh()
}
