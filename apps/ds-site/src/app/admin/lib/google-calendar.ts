import 'server-only'

import { createSign } from 'node:crypto'

/**
 * Minimal Google Calendar client for the two-way admin-calendar sync. Authenticates
 * a service account by signing a JWT with node:crypto (no SDK dependency) and trading
 * it for an access token, then calls the Calendar v3 REST API directly.
 *
 * Configure with two env vars (server-only):
 *   GOOGLE_SERVICE_ACCOUNT_JSON  the full service-account key JSON
 *   GOOGLE_CALENDAR_ID           the shared calendar's id (shared with the SA + both
 *                                founders so it appears + edits on their phones)
 * Unset → isCalendarSyncConfigured() is false and every call is a graceful no-op.
 */

const SCOPE = 'https://www.googleapis.com/auth/calendar'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const TZ = 'Europe/Athens'

interface ServiceAccount {
  client_email: string
  private_key: string
}

export interface GoogleEventInput {
  title: string
  description: string
  eventDate: string // YYYY-MM-DD
  startTime: string | null // HH:MM[:SS] or null (all-day)
}

export interface GoogleChange {
  id: string
  deleted: boolean
  title: string
  description: string
  eventDate: string | null
  startTime: string | null
}

function getConfig(): { sa: ServiceAccount; calendarId: string } | null {
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON
  const calendarId = process.env.GOOGLE_CALENDAR_ID
  if (!raw || !calendarId) return null
  try {
    const sa = JSON.parse(raw) as ServiceAccount
    if (!sa.client_email || !sa.private_key) return null
    return { sa, calendarId }
  } catch {
    return null
  }
}

export function isCalendarSyncConfigured(): boolean {
  return getConfig() !== null
}

let cached: { token: string; exp: number } | null = null

async function accessToken(sa: ServiceAccount): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  if (cached && cached.exp > now + 60) return cached.token

  const enc = (o: unknown) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const head = enc({ alg: 'RS256', typ: 'JWT' })
  const claims = enc({ iss: sa.client_email, scope: SCOPE, aud: TOKEN_URL, iat: now, exp: now + 3600 })
  const signingInput = `${head}.${claims}`
  const key = sa.private_key.includes('\\n') ? sa.private_key.replace(/\\n/g, '\n') : sa.private_key
  const signer = createSign('RSA-SHA256')
  signer.update(signingInput)
  const signature = signer.sign(key).toString('base64url')
  const jwt = `${signingInput}.${signature}`

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  })
  const json = (await res.json()) as { access_token?: string; expires_in?: number; error?: string }
  if (!json.access_token) throw new Error(`google token: ${json.error ?? res.status}`)
  cached = { token: json.access_token, exp: now + (json.expires_in ?? 3600) }
  return json.access_token
}

function calBase(calendarId: string): string {
  return `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`
}

function nextDay(date: string): string {
  const d = new Date(`${date}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return d.toISOString().slice(0, 10)
}

function normTime(t: string): string {
  // HH:MM or HH:MM:SS → HH:MM:SS
  return t.length === 5 ? `${t}:00` : t.slice(0, 8)
}

function addHour(t: string): string {
  const [h, m] = normTime(t).split(':')
  const hour = (Number(h) + 1) % 24
  return `${String(hour).padStart(2, '0')}:${m}:00`
}

function eventBody(ev: GoogleEventInput): Record<string, unknown> {
  const body: Record<string, unknown> = { summary: ev.title || 'Untitled', description: ev.description || '' }
  if (ev.startTime) {
    body.start = { dateTime: `${ev.eventDate}T${normTime(ev.startTime)}`, timeZone: TZ }
    body.end = { dateTime: `${ev.eventDate}T${addHour(ev.startTime)}`, timeZone: TZ }
  } else {
    body.start = { date: ev.eventDate }
    body.end = { date: nextDay(ev.eventDate) } // all-day end is exclusive
  }
  return body
}

/** Create (or PATCH if existingGoogleId given) the Google event; returns its id. */
export async function pushEvent(ev: GoogleEventInput, existingGoogleId?: string | null): Promise<string | null> {
  const cfg = getConfig()
  if (!cfg) return null
  const token = await accessToken(cfg.sa)
  const url = existingGoogleId ? `${calBase(cfg.calendarId)}/${existingGoogleId}` : calBase(cfg.calendarId)
  const res = await fetch(url, {
    method: existingGoogleId ? 'PATCH' : 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(eventBody(ev)),
  })
  if (!res.ok) {
    // A PATCH against a since-deleted event → recreate it instead.
    if (existingGoogleId && (res.status === 404 || res.status === 410)) return pushEvent(ev, null)
    throw new Error(`google push: ${res.status}`)
  }
  const json = (await res.json()) as { id?: string }
  return json.id ?? null
}

export async function deleteGoogleEvent(googleId: string): Promise<void> {
  const cfg = getConfig()
  if (!cfg) return
  const token = await accessToken(cfg.sa)
  const res = await fetch(`${calBase(cfg.calendarId)}/${googleId}`, {
    method: 'DELETE',
    headers: { authorization: `Bearer ${token}` },
  })
  if (!res.ok && res.status !== 404 && res.status !== 410) throw new Error(`google delete: ${res.status}`)
}

interface RawGoogleEvent {
  id?: string
  status?: string
  summary?: string
  description?: string
  start?: { date?: string; dateTime?: string }
}

function normalize(raw: RawGoogleEvent): GoogleChange | null {
  if (!raw.id) return null
  if (raw.status === 'cancelled') {
    return { id: raw.id, deleted: true, title: '', description: '', eventDate: null, startTime: null }
  }
  const start = raw.start ?? {}
  let eventDate: string | null = null
  let startTime: string | null = null
  if (start.date) {
    eventDate = start.date
  } else if (start.dateTime) {
    const d = new Date(start.dateTime)
    eventDate = d.toLocaleDateString('en-CA', { timeZone: TZ })
    startTime = d.toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: false })
  }
  return { id: raw.id, deleted: false, title: raw.summary ?? '', description: raw.description ?? '', eventDate, startTime }
}

/**
 * Incremental change feed. Pass the stored syncToken (or null for a first / reset
 * full sync). Returns normalized changes + the next token to persist. On a 410
 * (expired token) it transparently falls back to a full sync.
 */
export async function listChanges(
  syncToken: string | null,
): Promise<{ changes: GoogleChange[]; nextSyncToken: string | null }> {
  const cfg = getConfig()
  if (!cfg) return { changes: [], nextSyncToken: null }
  const token = await accessToken(cfg.sa)

  const changes: GoogleChange[] = []
  let pageToken: string | undefined
  let nextSyncToken: string | null = null
  let useToken = syncToken

  for (let guard = 0; guard < 50; guard += 1) {
    const params = new URLSearchParams({ showDeleted: 'true', singleEvents: 'true', maxResults: '250' })
    if (pageToken) params.set('pageToken', pageToken)
    else if (useToken) params.set('syncToken', useToken)
    else params.set('timeMin', new Date(Date.now() - 90 * 86_400_000).toISOString())

    const res = await fetch(`${calBase(cfg.calendarId)}?${params.toString()}`, {
      headers: { authorization: `Bearer ${token}` },
    })
    if (res.status === 410) {
      // Token expired → restart a full sync from scratch.
      useToken = null
      pageToken = undefined
      changes.length = 0
      continue
    }
    if (!res.ok) throw new Error(`google list: ${res.status}`)
    const json = (await res.json()) as { items?: RawGoogleEvent[]; nextPageToken?: string; nextSyncToken?: string }
    for (const item of json.items ?? []) {
      const n = normalize(item)
      if (n) changes.push(n)
    }
    if (json.nextSyncToken) nextSyncToken = json.nextSyncToken
    pageToken = json.nextPageToken
    if (!pageToken) break
  }

  return { changes, nextSyncToken }
}
