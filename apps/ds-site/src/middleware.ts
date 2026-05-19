/**
 * Next.js Edge Middleware.
 *
 * Handles two independent concerns:
 *
 * 1. MegaGym/Clients auth gate (existing, unchanged)
 *    Applies to: /clients/:path* and /MegaGym-Website/:path*
 *    Checks the megagym_auth cookie and logs visits to Supabase.
 *
 * 2. Admin + Analytics auth gate (new)
 *    Applies to: /admin/:path* (except /admin/login and /admin/logout)
 *                /$ecretAnalytics/:path*
 *    Validates Supabase Auth session and checks ADMIN_ALLOWED_EMAILS.
 *    Dev-mode: if NEXT_PUBLIC_SUPABASE_URL is unset, the gate is SKIPPED
 *    (intentional dev-only behaviour — production always has env vars set,
 *    so the gate is always enforced in deployed environments).
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// ── MegaGym constants (unchanged) ────────────────────────────────────────────

const AUTH_COOKIE = 'megagym_auth'
const AUTH_VALUE = 'ds2-mgym-v1'
const VISITOR_COOKIE = 'mgym_visitor'
const CLIENT_COOKIE = 'mgym_client'

function getBlockedIds(): string[] {
  try {
    return JSON.parse(process.env.MEGAGYM_BLOCKED ?? '[]')
  } catch {
    return []
  }
}

// ── Admin allowlist check (inline — cannot import server-only module here) ───
// Mirrors isAllowedEmail() from supabase-server.ts but runs in edge context.

function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false
  const raw = process.env.ADMIN_ALLOWED_EMAILS ?? ''
  if (!raw.trim()) return false
  const allowed = raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.trim().toLowerCase())
}

// ── Main middleware ───────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ── Branch 1: MegaGym / Clients gate ──────────────────────────────────────
  if (
    pathname.startsWith('/clients/') ||
    pathname.startsWith('/MegaGym-Website/')
  ) {
    const cookie = request.cookies.get(AUTH_COOKIE)

    if (cookie?.value !== AUTH_VALUE) {
      const url = request.nextUrl.clone()
      url.pathname = '/megagym-login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }

    const clientId = request.cookies.get(CLIENT_COOKIE)?.value ?? null
    if (clientId && getBlockedIds().includes(clientId)) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && serviceKey) {
        fetch(`${supabaseUrl}/rest/v1/visits`, {
          method: 'POST',
          headers: {
            apikey: serviceKey,
            Authorization: `Bearer ${serviceKey}`,
            'Content-Type': 'application/json',
            Prefer: 'return=minimal',
          },
          body: JSON.stringify({
            path: pathname,
            referrer: request.headers.get('referer') ?? null,
            country:
              (request as NextRequest & { geo?: { country?: string } }).geo
                ?.country ?? null,
            user_agent: request.headers.get('user-agent') ?? null,
            visitor_id: request.cookies.get(VISITOR_COOKIE)?.value ?? null,
            client_id: `${clientId} [blocked]`,
          }),
        }).catch(() => {})
      }

      const url = request.nextUrl.clone()
      url.pathname = '/megagym-login'
      url.searchParams.set('redirect', pathname)
      const res = NextResponse.redirect(url)
      res.cookies.delete(AUTH_COOKIE)
      res.cookies.delete(CLIENT_COOKIE)
      return res
    }

    const response = NextResponse.next()

    const accept = request.headers.get('accept') ?? ''
    if (!accept.includes('text/html')) return response

    let visitorId = request.cookies.get(VISITOR_COOKIE)?.value ?? null
    if (!visitorId) {
      visitorId = crypto.randomUUID()
      response.cookies.set(VISITOR_COOKIE, visitorId, {
        maxAge: 60 * 60 * 24 * 365,
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
      })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (supabaseUrl && serviceKey) {
      fetch(`${supabaseUrl}/rest/v1/visits`, {
        method: 'POST',
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          path: pathname,
          referrer: request.headers.get('referer') ?? null,
          country:
            (request as NextRequest & { geo?: { country?: string } }).geo
              ?.country ?? null,
          user_agent: request.headers.get('user-agent') ?? null,
          visitor_id: visitorId,
          client_id: request.cookies.get(CLIENT_COOKIE)?.value ?? null,
        }),
      }).catch(() => {})
    }

    return response
  }

  // ── Branch 2: Admin + Analytics gate ──────────────────────────────────────

  // Covers both bare paths (e.g. /admin) and sub-paths (e.g. /admin/project/x).
  const isAdminPath = pathname === '/admin' || pathname.startsWith('/admin/')
  const isAnalyticsPath =
    pathname === '/$ecretAnalytics' || pathname.startsWith('/$ecretAnalytics/')

  if (isAdminPath || isAnalyticsPath) {
    // Normalise trailing slash so /admin/login/ and /admin/login both match.
    // trailingSlash:true in next.config causes Next.js to 308-redirect bare
    // paths to their slash-suffixed equivalents, so pathname here will often
    // carry a trailing slash that must be stripped before comparison.
    const normalizedPath =
      pathname.length > 1 && pathname.endsWith('/')
        ? pathname.slice(0, -1)
        : pathname

    // Allow login and logout pages through without a session check.
    // Uses normalizedPath so both /admin/login and /admin/login/ are exempt.
    if (normalizedPath === '/admin/login' || normalizedPath === '/admin/logout') {
      return NextResponse.next()
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    // PRODUCTION FAIL-CLOSED (Fix 3): if Supabase env vars are absent in
    // production, protected paths must NOT be allowed through — redirect to
    // login so the gate stays enforced even if env vars are misconfigured.
    // In non-production (local dev / keyless dev workflow), fall through so
    // the mock data source remains accessible without a live Supabase project.
    if (!supabaseUrl || !supabaseAnonKey) {
      if (process.env.NODE_ENV === 'production') {
        const loginUrl = new URL('/admin/login/', request.url)
        loginUrl.searchParams.set('redirect', pathname)
        return NextResponse.redirect(loginUrl)
      }
      // Non-production + no env vars: allow through (keyless local dev).
      return NextResponse.next()
    }

    // Build a response object we can mirror cookie mutations onto, as required
    // by @supabase/ssr middleware pattern.
    let response = NextResponse.next({ request })

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Mirror cookies onto both the request (for downstream handlers) and
          // the response (so the browser receives the refreshed session token).
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          )
        },
      },
    })

    // getUser() validates the JWT with the Supabase Auth server — more secure
    // than getSession() which only reads the cookie without server validation.
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user || !isAdminEmail(user.email)) {
      // Redirect to /admin/login/ (with trailing slash) so trailingSlash:true
      // does not incur an extra 308 hop before the exempt check fires.
      const loginUrl = new URL('/admin/login/', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }

    return response
  }

  // ── All other paths: pass through ─────────────────────────────────────────
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/clients/:path*',
    '/MegaGym-Website/:path*',
    '/admin',
    '/admin/:path*',
    '/$ecretAnalytics',
    '/$ecretAnalytics/:path*',
  ],
}
