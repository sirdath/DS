/**
 * Newsletter signup from the public blog. POST { email, lang } → inserts into
 * blog_subscribers via the anon-key client (RLS allows public inserts only).
 * Same-origin + per-IP rate limited like the other public POST routes.
 * Duplicate signups return ok (idempotent from the visitor's point of view).
 * Never logs email addresses.
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export const runtime = 'nodejs'

const IP_WINDOW_MS = 60_000
const IP_MAX = 5 // signups / minute / IP / instance
const EMAIL_MAX = 254
const ipHits = new Map<string, number[]>()

function rateLimited(ip: string): boolean {
  const now = Date.now()
  if (ipHits.size > 5000) ipHits.clear()
  const arr = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS)
  arr.push(now)
  ipHits.set(ip, arr)
  return arr.length > IP_MAX
}

function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  return xff ? (xff.split(',')[0]?.trim() ?? 'unknown') : 'unknown'
}

function sameOrigin(req: Request): boolean {
  const secFetchSite = req.headers.get('sec-fetch-site')
  if (secFetchSite) return secFetchSite === 'same-origin' || secFetchSite === 'none'
  const origin = req.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).host === req.headers.get('host')
  } catch {
    return false
  }
}

function isValidEmail(email: string): boolean {
  return email.length <= EMAIL_MAX && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)
}

interface SubscribeBody {
  email?: unknown
  lang?: unknown
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Bad origin.' }, { status: 403 })
  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ error: 'Too many attempts, try again in a minute.' }, { status: 429 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'Signups are not configured yet.' }, { status: 503 })
  }

  let body: SubscribeBody
  try {
    body = (await request.json()) as SubscribeBody
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: 'That email does not look right.' }, { status: 400 })
  }
  const lang = body.lang === 'el' ? 'el' : 'en'

  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
  const { error } = await db.from('blog_subscribers').insert({ email, lang })
  // 23505 = already subscribed — treat as success so the form stays idempotent.
  if (error && error.code !== '23505') {
    return NextResponse.json({ error: 'Could not save that just now.' }, { status: 502 })
  }
  return NextResponse.json({ ok: true })
}
