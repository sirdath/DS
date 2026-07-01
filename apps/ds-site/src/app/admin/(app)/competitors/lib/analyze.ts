/**
 * Competitor analysis — scrape + Claude (official @anthropic-ai/sdk, forced tool-use
 * → structured JSON). Pure server-side logic: no DB, no auth, no `server-only`, so the
 * admin server action AND the local practice script can both import it. NEVER import
 * this from a client component — it carries the Anthropic key.
 *
 * Scraping is a polite browser-UA fetch; heavily bot-protected sites would need a real
 * scraper (Firecrawl/scrapling) — a future upgrade.
 */

import Anthropic from '@anthropic-ai/sdk'
import type { CompetitorAnalysis } from '../types'

export const MODEL = 'claude-sonnet-4-6'

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

const ANALYSIS_SCHEMA: Anthropic.Tool.InputSchema = {
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

/** Fetch the page with a browser UA, strip scripts/styles/tags, cap to 24k chars. */
export async function scrapeText(url: string): Promise<string> {
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

function buildPrompt(name: string, url: string, content: string): string {
  return (
    `You are analysing a competitor for DS2 — a senior digital-solutions consultancy (strategy, engineering, applied AI; Athens/London; challenge-first; fixed-fee / end-to-end delivery plus an optional monthly stewardship phase; we build client products like AI receptionists, review intelligence, site audits).\n\n` +
    `Competitor: ${name} (${url}).\n\n` +
    `Produce a competitive analysis: (1) a one-paragraph summary; (2) what their WEBSITE does well + what DS2 can take/improve on ours; (3) the SERVICES/products they offer + the GAPS vs DS2 (what they have that we don't); (4) pricing/packaging and how it compares; (5) concrete OPPORTUNITIES DS2 could build or do to close the gap (be specific and actionable). Ground everything in the scraped content; do not invent facts.\n\n` +
    `Scraped site content:\n${content}`
  )
}

export interface AnalyzeResult {
  analysis: CompetitorAnalysis
  usage: Anthropic.Usage
}

/** Build a client from the founder's stored credential. A metered API key (sk-ant-api…)
 *  authenticates with x-api-key; a Claude subscription OAuth token (sk-ant-oat…) uses
 *  Bearer + the oauth beta header. Omit to fall back to the SDK's own env resolution. */
function makeClient(credential?: string): Anthropic {
  if (!credential) return new Anthropic()
  if (credential.startsWith('sk-ant-oat')) {
    return new Anthropic({
      apiKey: null,
      authToken: credential,
      defaultHeaders: { 'anthropic-beta': 'oauth-2025-04-20' },
    })
  }
  return new Anthropic({ apiKey: credential })
}

/** Scrape `url`, then ask Claude for a DS2-framed competitive analysis. `credential` is
 *  the logged-in founder's own key/token (their own billing). */
export async function analyzeUrl(opts: { credential?: string; name: string; url: string }): Promise<AnalyzeResult> {
  const content = await scrapeText(opts.url)
  const client = makeClient(opts.credential)
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 3000,
    tools: [{ name: 'competitor_analysis', description: 'Structured competitive analysis for DS2.', input_schema: ANALYSIS_SCHEMA }],
    tool_choice: { type: 'tool', name: 'competitor_analysis' },
    messages: [{ role: 'user', content: buildPrompt(opts.name, opts.url, content) }],
  })
  const block = res.content.find((b): b is Anthropic.ToolUseBlock => b.type === 'tool_use')
  if (!block) throw new Error('No analysis returned.')
  return { analysis: block.input as CompetitorAnalysis, usage: res.usage }
}
