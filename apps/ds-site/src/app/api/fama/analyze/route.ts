/**
 * Fama live analysis. A founder posts a CSV of reviews + business context; we parse
 * it (quoted fields + embedded newlines handled), run the @ds/fama engine (per-review
 * reads + synthesis) on the founder's own Anthropic credential, and return the full
 * FamaReport (incl. token usage + USD cost). Founders-only for now — the analysis
 * bills a real key; portal visitors keep the demo report. Never logs review content.
 */

import { NextResponse } from 'next/server'
import { analyzeReviews, type Platform, type Review } from '@ds/fama'
import { assertAdmin } from '../../../admin/lib/assert-admin'
import { getFounderCredential } from '../../../admin/lib/founder-credential'
import { clientIp, rateLimited, sameOrigin } from '../../../products/(app)/plutus/lib/route-helpers'

export const runtime = 'nodejs'
export const maxDuration = 300

const CSV_MAX = 2_000_000 // 2 MB
const MAX_REVIEWS = 60 // per-review model calls — cap one run's cost/duration

interface AnalyzeBody {
  csv?: unknown
  business?: { name?: unknown; type?: unknown; location?: unknown }
}

/** Parse a whole CSV: RFC-style quoted fields, escaped quotes, newlines inside quotes. */
function parseCsv(text: string, delim: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === delim) {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.some((f) => f.trim() !== '')) rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  row.push(field)
  if (row.some((f) => f.trim() !== '')) rows.push(row)
  return rows
}

function detectDelim(csv: string): string {
  // Sniff from the first non-blank line (a leading blank line is common when
  // pasting from a spreadsheet and would otherwise force the comma fallback).
  const headerLine = csv.split(/\r?\n/).find((l) => l.trim() !== '') ?? ''
  const counts: Array<[string, number]> = [
    [',', (headerLine.match(/,/g) ?? []).length],
    [';', (headerLine.match(/;/g) ?? []).length],
    ['\t', (headerLine.match(/\t/g) ?? []).length],
  ]
  counts.sort((a, b) => b[1] - a[1])
  return counts[0]?.[1] ? counts[0][0] : ','
}

const findCol = (headers: string[], names: string[]): number =>
  headers.findIndex((h) => names.some((n) => h.includes(n)))

function toPlatform(v: string): Platform {
  const s = v.toLowerCase()
  if (s.includes('google')) return 'google'
  if (s.includes('booking')) return 'booking'
  if (s.includes('trip')) return 'tripadvisor'
  return 'other'
}

const pad2 = (n: number) => (n < 10 ? `0${n}` : String(n))

function toIsoDate(v: string): string {
  const s = v.trim()
  const iso = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (iso) return `${iso[1]}-${pad2(Number(iso[2]))}-${pad2(Number(iso[3]))}`
  // EL-locale exports are DD/MM/YYYY — new Date() would read them as US MM/DD.
  const eu = s.match(/^(\d{1,2})[/.](\d{1,2})[/.](\d{4})/)
  if (eu) {
    const day = Number(eu[1])
    const month = Number(eu[2])
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) return `${eu[3]}-${pad2(month)}-${pad2(day)}`
  }
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? new Date().toISOString().slice(0, 10) : d.toISOString().slice(0, 10)
}

interface ParsedReviews {
  reviews: Review[]
  skipped: number
  truncated: number
}

function reviewsFromCsv(csv: string): ParsedReviews | { error: string } {
  const rows = parseCsv(csv, detectDelim(csv))
  if (rows.length < 2) return { error: 'Need a header row plus at least one review row.' }
  const headers = (rows[0] ?? []).map((h) => h.trim().toLowerCase())
  const textCol = findCol(headers, ['text', 'review', 'comment', 'body', 'content'])
  const ratingCol = findCol(headers, ['rating', 'stars', 'score'])
  if (textCol === -1 || ratingCol === -1) {
    return { error: `Could not find a review-text and a rating column. Headers found: ${headers.join(', ')}` }
  }
  const authorCol = findCol(headers, ['author', 'name', 'reviewer', 'user', 'guest'])
  const dateCol = findCol(headers, ['date', 'created', 'time'])
  const platformCol = findCol(headers, ['platform', 'source', 'site', 'channel'])

  const reviews: Review[] = []
  let skipped = 0
  for (const row of rows.slice(1)) {
    // More fields than headers = a mis-tokenised row (e.g. an unquoted decimal-comma
    // rating in a comma file). Reading shifted columns would bill a wrong analysis —
    // skip and count it instead.
    if (row.length > headers.length) {
      skipped++
      continue
    }
    const text = (row[textCol] ?? '').trim().slice(0, 2000)
    const ratingRaw = (row[ratingCol] ?? '').trim()
    const rating = Number(ratingRaw.replace(',', '.'))
    // Number('') is 0, not NaN — an empty rating must skip, not become a 1-star.
    if (!text || !ratingRaw || !Number.isFinite(rating)) {
      skipped++
      continue
    }
    reviews.push({
      id: `r${reviews.length + 1}`,
      platform: platformCol === -1 ? 'other' : toPlatform(row[platformCol] ?? ''),
      author: authorCol === -1 ? 'Anonymous' : (row[authorCol] ?? '').trim() || 'Anonymous',
      rating: Math.min(5, Math.max(1, Math.round(rating))),
      text,
      date: dateCol === -1 ? new Date().toISOString().slice(0, 10) : toIsoDate(row[dateCol] ?? ''),
    })
  }
  const truncated = Math.max(0, reviews.length - MAX_REVIEWS)
  return { reviews: reviews.slice(0, MAX_REVIEWS), skipped, truncated }
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Bad origin.' }, { status: 403 })
  if (rateLimited(clientIp(request))) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  try {
    await assertAdmin()
  } catch {
    return NextResponse.json({ error: 'Founders only for now — the analysis bills a real API key.' }, { status: 401 })
  }

  let body: AnalyzeBody
  try {
    body = (await request.json()) as AnalyzeBody
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }
  const csv = typeof body.csv === 'string' ? body.csv : ''
  if (!csv.trim()) return NextResponse.json({ error: 'No CSV provided.' }, { status: 400 })
  if (csv.length > CSV_MAX) return NextResponse.json({ error: 'CSV too large (2 MB max).' }, { status: 413 })
  const name = typeof body.business?.name === 'string' ? body.business.name.trim().slice(0, 120) : ''
  if (!name) return NextResponse.json({ error: 'Business name is required.' }, { status: 400 })
  const type = typeof body.business?.type === 'string' ? body.business.type.trim().slice(0, 80) : ''
  const location = typeof body.business?.location === 'string' ? body.business.location.trim().slice(0, 120) : ''

  const parsed = reviewsFromCsv(csv)
  if ('error' in parsed) return NextResponse.json({ error: parsed.error }, { status: 400 })
  if (parsed.reviews.length === 0) {
    return NextResponse.json({ error: 'No usable rows (each needs review text + a 1-5 rating).' }, { status: 400 })
  }

  const credential = await getFounderCredential()
  if (!credential) {
    return NextResponse.json(
      { error: 'No Anthropic credential — add yours in Admin → Competitors → Your Anthropic key.' },
      { status: 400 },
    )
  }

  try {
    const report = await analyzeReviews(parsed.reviews, { name, type: type || 'business', location: location || undefined }, { apiKey: credential })
    return NextResponse.json({ report, skipped: parsed.skipped, truncated: parsed.truncated })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Analysis failed.'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
