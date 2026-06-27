/**
 * Shared guards for the /api/plutus/* routes: same-origin, per-IP rate limit, and
 * an auth resolver that returns the RLS-scoped Supabase client + the caller's
 * user id. Persistence routes need real storage, so they refuse the keyless dev
 * path (the read-only demo render covers that case without writes).
 */

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { getSessionUser, getSupabaseServerClient } from '../../../../admin/lib/supabase-server'

const IP_WINDOW_MS = 60_000
const IP_MAX = 30 // requests / minute / IP / instance
const ipHits = new Map<string, number[]>()

export function rateLimited(ip: string): boolean {
  const now = Date.now()
  if (ipHits.size > 5000) ipHits.clear()
  const arr = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS)
  arr.push(now)
  ipHits.set(ip, arr)
  return arr.length > IP_MAX
}

export function clientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for')
  return xff ? (xff.split(',')[0]?.trim() ?? 'unknown') : 'unknown'
}

export function sameOrigin(req: Request): boolean {
  // Prefer the Fetch-Metadata signal when present (modern browsers send it on
  // every request); same-origin/none pass, same-site/cross-site fail.
  const secFetchSite = req.headers.get('sec-fetch-site')
  if (secFetchSite) return secFetchSite === 'same-origin' || secFetchSite === 'none'

  // Fallback for older clients: require a matching Origin. These are
  // state-changing POSTs, so an entirely absent Origin is rejected (not allowed).
  const origin = req.headers.get('origin')
  if (!origin) return false
  try {
    return new URL(origin).host === req.headers.get('host')
  } catch {
    return false
  }
}

export function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export interface ApiSession {
  db: SupabaseClient
  userId: string
  email: string
}

export type ApiAuth = { ok: true; session: ApiSession } | { ok: false; status: number; error: string }

/** Resolve an authenticated, storage-backed session, or a typed failure to return. */
export async function resolveApiSession(): Promise<ApiAuth> {
  if (!hasSupabaseEnv()) {
    return { ok: false, status: 503, error: 'Workspace storage is not configured.' }
  }
  const user = await getSessionUser()
  if (!user) return { ok: false, status: 401, error: 'Please sign in.' }
  const db = await getSupabaseServerClient()
  return { ok: true, session: { db, userId: user.id, email: user.email ?? 'Your business' } }
}
