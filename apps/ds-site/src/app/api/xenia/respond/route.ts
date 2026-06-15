/**
 * Xenia chat backend. Runs the engine server-side (the model key never reaches
 * the browser). Auth: a Supabase session is required when Supabase is configured;
 * keyless local dev is allowed so the playground works offline. Rate-limited and
 * same-origin-guarded like /api/contact. Conversation state is client-held for
 * this base (a demo playground) — durable per-tenant persistence to the xenia_*
 * tables (20260614_xenia_workspace.sql) is the next step. Never logs message text.
 */

import {
  createConversation,
  getSample,
  InMemoryStore,
  respond,
  SAMPLE_KEYS,
  type ConversationState,
  type SampleKey,
} from '@ds/xenia'
import { NextResponse } from 'next/server'
import { getSessionUser } from '../../../admin/lib/supabase-server'

export const runtime = 'nodejs'

const IP_WINDOW_MS = 60_000
const IP_MAX = 20 // messages / minute / IP / instance
const MESSAGE_MAX = 1000
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
  const origin = req.headers.get('origin')
  if (!origin) return true // same-origin fetches may omit Origin — allow
  try {
    return new URL(origin).host === req.headers.get('host')
  } catch {
    return false
  }
}

function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function isConversationState(v: unknown): v is ConversationState {
  if (typeof v !== 'object' || v === null) return false
  const s = v as Record<string, unknown>
  return typeof s.businessId === 'string' && Array.isArray(s.history) && typeof s.status === 'string'
}

interface RequestBody {
  sample?: unknown
  state?: unknown
  text?: unknown
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Bad origin.' }, { status: 403 })
  if (rateLimited(clientIp(request))) return NextResponse.json({ error: 'Too many messages — slow down.' }, { status: 429 })

  if (hasSupabaseEnv()) {
    const user = await getSessionUser()
    if (!user) return NextResponse.json({ error: 'Please sign in.' }, { status: 401 })
  } else if (process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Workspace is not configured.' }, { status: 503 })
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'Xenia is not configured (no model key).' }, { status: 503 })
  }

  let body: RequestBody
  try {
    body = (await request.json()) as RequestBody
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const sample: SampleKey =
    typeof body.sample === 'string' && (SAMPLE_KEYS as readonly string[]).includes(body.sample)
      ? (body.sample as SampleKey)
      : 'taverna'
  const text = typeof body.text === 'string' ? body.text.slice(0, MESSAGE_MAX).trim() : ''
  if (!text) return NextResponse.json({ error: 'Empty message.' }, { status: 400 })

  const business = getSample(sample)
  const state = isConversationState(body.state) ? body.state : createConversation(business)

  try {
    const result = await respond(business, state, text, { store: new InMemoryStore() })
    return NextResponse.json({ reply: result.reply, state: result.state, status: result.state.status })
  } catch {
    // Never surface internals or message content.
    return NextResponse.json({ error: 'Xenia could not respond just now.' }, { status: 502 })
  }
}
