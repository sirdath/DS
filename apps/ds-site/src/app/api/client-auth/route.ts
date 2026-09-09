import { timingSafeEqual } from 'node:crypto'
import { NextResponse } from 'next/server'
import { AUTH_COOKIE, AUTH_VALUE, CLIENT_COOKIE, GATE_COOKIE_OPTS } from '../../admin/lib/client-gate'
import { clientIp, rateLimited } from '../../products/(app)/plutus/lib/route-helpers'

// Node runtime: needs node:crypto for the constant-time password compare.
export const runtime = 'nodejs'

// Brute-force budget for this endpoint. Deliberately far tighter than the
// general 30/min guard: this is a password oracle, and the only legitimate
// reason to hit it repeatedly is a human mistyping. 8/min leaves room for a
// few fat-fingered attempts (the UI itself gives up after 5) while cutting a
// guessing run to a rate that gets nowhere against any non-trivial password.
// Its own scope so unrelated traffic from the same IP can't consume it.
const LOGIN_MAX_PER_MIN = 8
const LOGIN_SCOPE = 'client-auth'

// Held before every failed answer, so an attacker pacing themselves just under
// the rate limit still pays for each guess. Short enough to read as ordinary
// network latency to someone who mistyped once.
const FAILURE_DELAY_MS = 500

interface PasswordEntry {
  id: string
  password: string
  redirect: string
}

function getPasswords(): PasswordEntry[] {
  // CLIENT_PASSWORDS is the canonical var; fall back to the legacy
  // MEGAGYM_PASSWORDS so nothing breaks before the env var is renamed.
  const raw = process.env.CLIENT_PASSWORDS ?? process.env.MEGAGYM_PASSWORDS ?? '[]'
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Constant-time string compare. timingSafeEqual throws on length mismatch, so
 * lengths are checked first, the same convention as verifyThread in /api/contact.
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a)
  const bufB = Buffer.from(b)
  if (bufA.length !== bufB.length) return false
  return timingSafeEqual(bufA, bufB)
}

/**
 * Check the candidate against every configured entry with no early exit, so the
 * work done doesn't depend on which entry matched (or that one matched at all).
 * The list is a handful of client passwords, so the full sweep costs microseconds.
 */
function findMatch(passwords: PasswordEntry[], candidate: string): PasswordEntry | null {
  let match: PasswordEntry | null = null
  for (const entry of passwords) {
    if (safeEqual(entry.password, candidate) && match === null) match = entry
  }
  return match
}

export async function POST(request: Request) {
  // Rate limit first: a throttled caller costs us nothing beyond this check,
  // and the 429 returns immediately (no failure delay, since holding the
  // connection open for someone already over the limit only helps them tie up
  // the server).
  if (rateLimited(clientIp(request), { max: LOGIN_MAX_PER_MIN, scope: LOGIN_SCOPE })) {
    return NextResponse.json({ error: 'Too many attempts. Wait a minute and try again.' }, { status: 429 })
  }

  // Malformed JSON is a transport problem, not a login attempt: 400, no delay.
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }

  // Anything that isn't a string password is a failed attempt, reported
  // identically to a wrong password so it gives an attacker no extra signal.
  const candidate = (body as { password?: unknown } | null)?.password
  if (typeof candidate !== 'string') {
    await sleep(FAILURE_DELAY_MS)
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  const match = findMatch(getPasswords(), candidate)

  if (!match) {
    await sleep(FAILURE_DELAY_MS)
    return NextResponse.json({ error: 'Wrong password' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true, redirect: match.redirect })
  res.cookies.set(AUTH_COOKIE, AUTH_VALUE, GATE_COOKIE_OPTS)
  res.cookies.set(CLIENT_COOKIE, match.id, GATE_COOKIE_OPTS)
  return res
}
