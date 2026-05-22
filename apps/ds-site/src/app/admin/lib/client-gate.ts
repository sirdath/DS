/**
 * Shared constants for the client-site password gate cookie, used by both the
 * password route (/api/client-auth) and the admin auto-login route
 * (/admin/open/[site]). The Edge middleware keeps its own inlined copies
 * (it can't import app modules), so keep these values in sync with middleware.ts.
 */

export const AUTH_COOKIE = 'megagym_auth'
export const AUTH_VALUE = 'ds2-mgym-v1'
export const CLIENT_COOKIE = 'mgym_client'

export const GATE_COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
}
