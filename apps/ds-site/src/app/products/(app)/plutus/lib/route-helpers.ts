/**
 * Shared route guards. `rateLimited`, `clientIp` and `sameOrigin` carry no
 * plutus-specific logic and are reused across the API surface (/api/plutus/*,
 * /api/fama/*, /api/client-auth); the Supabase session helpers below are still
 * specific to the storage-backed plutus routes, which refuse the keyless dev
 * path (the read-only demo render covers that case without writes).
 */

import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { getSessionUser, getSupabaseServerClient } from '../../../../admin/lib/supabase-server'

const IP_WINDOW_MS = 60_000
const IP_MAX = 30 // requests / minute / IP / instance
const ipHits = new Map<string, number[]>()

export interface RateLimitOptions {
  /** Requests allowed per IP in the 60s window. Defaults to the general 30/min. */
  max?: number
  /**
   * Counter namespace. Callers that need a tighter ceiling (a login endpoint,
   * say) must pass their own scope, otherwise unrelated traffic from the same
   * IP would burn through their smaller budget and lock out real users.
   */
  scope?: string
}

/**
 * In-memory sliding-window limiter. Honest limitation: counters are per
 * instance, so the effective global ceiling is higher under serverless
 * scale-out. A hard global limit would need Upstash/Supabase.
 */
export function rateLimited(ip: string, options: RateLimitOptions = {}): boolean {
  const { max = IP_MAX, scope = 'default' } = options
  const now = Date.now()
  if (ipHits.size > 5000) ipHits.clear()
  const key = `${scope}:${ip}`
  const arr = (ipHits.get(key) ?? []).filter((t) => now - t < IP_WINDOW_MS)
  arr.push(now)
  ipHits.set(key, arr)
  return arr.length > max
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
