/**
 * CSV import. A signed-in client posts a receivables export; the pure parser
 * (@ds/plutus parseInvoicesCsv) turns it into customers + invoices, which we upsert
 * under the caller's user_id (RLS keeps it private). Returns row counts + per-row
 * warnings so the UI can show exactly what landed and what was skipped. Never logs
 * file contents.
 */

import { parseInvoicesCsv } from '@ds/plutus'
import { NextResponse } from 'next/server'
import {
  clientIp,
  rateLimited,
  resolveApiSession,
  sameOrigin,
} from '../../../products/(app)/plutus/lib/route-helpers'
import { upsertReceivables } from '../../../products/(app)/plutus/lib/persist'

export const runtime = 'nodejs'

const CSV_MAX = 2_000_000 // 2 MB

interface ImportBody {
  csv?: unknown
  defaultCurrency?: unknown
  calendar?: unknown
  lang?: unknown
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Bad origin.' }, { status: 403 })
  if (rateLimited(clientIp(request))) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const auth = await resolveApiSession()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  let body: ImportBody
  try {
    body = (await request.json()) as ImportBody
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const csv = typeof body.csv === 'string' ? body.csv : ''
  if (!csv.trim()) return NextResponse.json({ error: 'No CSV provided.' }, { status: 400 })
  if (csv.length > CSV_MAX) return NextResponse.json({ error: 'File too large (max 2 MB).' }, { status: 413 })

  const currency = body.defaultCurrency === 'GBP' || body.defaultCurrency === 'USD' ? body.defaultCurrency : 'EUR'
  const lang = body.lang === 'en' ? 'en' : 'el'
  const calendar = typeof body.calendar === 'string' ? body.calendar : 'GR'

  const { customers, invoices, warnings } = parseInvoicesCsv(csv, { defaultCurrency: currency, lang, calendar })

  if (invoices.length === 0) {
    return NextResponse.json({ error: 'No valid invoices found.', warnings }, { status: 422 })
  }

  try {
    await upsertReceivables(auth.session.db, auth.session.userId, customers, invoices)
  } catch {
    return NextResponse.json({ error: 'Could not save the import.' }, { status: 502 })
  }

  return NextResponse.json({ customers: customers.length, invoices: invoices.length, warnings })
}
