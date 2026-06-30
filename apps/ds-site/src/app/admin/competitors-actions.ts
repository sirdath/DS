'use server'

/**
 * Competitors tab actions. add/delete go through the RLS admin client; analyze is the
 * "Scan": fetch the competitor's site, then ask Claude (forced tool-use → structured
 * JSON) for a competitive analysis framed for DS2. Scraping is a polite browser-UA
 * fetch; heavily-protected sites would need a real scraper (Firecrawl/scrapling) — a
 * future upgrade, noted in the UI.
 */

import { revalidatePath } from 'next/cache'
import { assertAdmin } from './lib/assert-admin'
import { getSupabaseServerClient } from './lib/supabase-server'
import type { CompetitorAnalysis } from './(app)/competitors/types'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'
const MODEL = 'claude-sonnet-4-6'

async function db() {
  await assertAdmin()
  return getSupabaseServerClient()
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

const ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'One-paragraph competitive profile.' },
    website: {
      type: 'object',
      properties: {
        strengths: { type: 'array', items: { type: 'string' }, description: 'What their website does well.' },
        takeaways: { type: 'array', items: { type: 'string' }, description: 'What DS2 can take or improve on our own site.' },
      },
      required: ['strengths', 'takeaways'],
    },
    services: {
      type: 'object',
      properties: {
        offerings: { type: 'array', items: { type: 'string' }, description: 'Services/products they offer.' },
        gaps: { type: 'array', items: { type: 'string' }, description: "What they offer that DS2 doesn't (the gap)." },
      },
      required: ['offerings', 'gaps'],
    },
    pricing: { type: 'string', description: 'Pricing / packaging notes and how it compares to DS2.' },
    opportunities: {
      type: 'array',
      items: {
        type: 'object',
        properties: { title: { type: 'string' }, detail: { type: 'string' } },
        required: ['title', 'detail'],
      },
      description: 'Concrete things DS2 could build or do to close the gap.',
    },
  },
  required: ['summary', 'website', 'services', 'pricing', 'opportunities'],
}

async function scrapeText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'text/html,application/xhtml+xml' },
    redirect: 'follow',
    signal: AbortSignal.timeout(20_000),
  })
  const html = await res.text()
  const text = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  if (!text) throw new Error('Nothing readable was scraped (the site may block bots).')
  return text.slice(0, 24_000)
}

interface ToolUseBlock {
  type: string
  input?: unknown
}

async function runAnalysis(key: string, name: string, url: string, content: string): Promise<CompetitorAnalysis> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2500,
      tools: [{ name: 'competitor_analysis', description: 'Structured competitive analysis for DS2.', input_schema: ANALYSIS_SCHEMA }],
      tool_choice: { type: 'tool', name: 'competitor_analysis' },
      messages: [
        {
          role: 'user',
          content:
            `You are analysing a competitor for DS2 — a senior digital-solutions consultancy (strategy, engineering, applied AI; Athens/London; challenge-first; fixed-fee / end-to-end delivery plus an optional monthly stewardship phase; we build client products like AI receptionists, review intelligence, site audits).\n\n` +
            `Competitor: ${name} (${url}).\n\n` +
            `Produce a competitive analysis: (1) a one-paragraph summary; (2) what their WEBSITE does well + what DS2 can take/improve on ours; (3) the SERVICES/products they offer + the GAPS vs DS2 (what they have that we don't); (4) pricing/packaging and how it compares; (5) concrete OPPORTUNITIES DS2 could build or do to close the gap (be specific and actionable). Ground everything in the scraped content; do not invent facts.\n\n` +
            `Scraped site content:\n${content}`,
        },
      ],
    }),
  })
  const json = (await res.json()) as { content?: ToolUseBlock[]; error?: { message?: string } }
  if (!res.ok) throw new Error(json.error?.message ?? `anthropic ${res.status}`)
  const tool = (json.content ?? []).find((b) => b.type === 'tool_use')
  if (!tool?.input) throw new Error('No analysis returned.')
  return tool.input as CompetitorAnalysis
}

export async function analyzeCompetitor(id: string): Promise<void> {
  const supabase = await db()
  const { data: row } = await supabase.from('competitors').select('name, url').eq('id', id).maybeSingle()
  if (!row) throw new Error('Competitor not found.')
  const key = process.env.ANTHROPIC_API_KEY
  if (!key) throw new Error('Scan needs ANTHROPIC_API_KEY set on the deployment.')

  await supabase.from('competitors').update({ status: 'analyzing' }).eq('id', id)
  refresh()
  try {
    const content = await scrapeText(String(row.url))
    const analysis = await runAnalysis(key, String(row.name), String(row.url), content)
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
