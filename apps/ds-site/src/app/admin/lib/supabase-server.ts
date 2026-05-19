/**
 * Server-only Supabase client helpers for the admin panel.
 *
 * Security notes:
 * - getServiceRoleClient() — SERVER ONLY: bypasses RLS. Used solely for
 *   the username→auth_user_id lookup at login time. Never expose this
 *   client to browser code or import this module from a 'use client' file.
 * - getSupabaseServerClient() — RLS-enforced, carries the user session via
 *   cookies. Safe for any authenticated server action or server component.
 * - SUPABASE_SERVICE_ROLE_KEY must NEVER appear in NEXT_PUBLIC_ vars or
 *   in any file imported by 'use client' code.
 */

import 'server-only'

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function requireEnv(key: string): string {
  const val = process.env[key]
  if (!val) {
    throw new Error(
      `[admin] Required environment variable "${key}" is not set. ` +
        'Add it to .env.local (development) or Vercel environment variables (production).',
    )
  }
  return val
}

/**
 * RLS-enforced SSR client. Reads and writes session cookies so the user
 * session is available in Server Components, Server Actions, and Route
 * Handlers. Use this for all data operations that should respect RLS.
 */
export async function getSupabaseServerClient() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  const cookieStore = await cookies()

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        } catch {
          // In Server Components the cookie store is read-only; set/remove
          // calls will throw. This is expected — session refresh happens in
          // middleware. Swallow silently as the SSR docs prescribe.
        }
      },
    },
  })
}

/**
 * Service-role client — SERVER ONLY, bypasses RLS.
 * Used exclusively for username→auth_user_id resolution at login time.
 * Session is never persisted (persistSession: false).
 */
export function getServiceRoleClient() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  // SERVICE_ROLE_KEY: server-only — bypasses RLS. Never expose to the browser.
  const serviceRoleKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}

/**
 * Returns the authenticated Supabase user from the current session cookie,
 * or null if there is no valid session. Uses getUser() (validates with the
 * Supabase Auth server) rather than the cheaper but less secure getSession().
 */
export async function getSessionUser() {
  try {
    const supabase = await getSupabaseServerClient()
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()
    if (error || !user) return null
    return user
  } catch {
    return null
  }
}

/**
 * Returns true iff the given email (case-insensitive, trimmed) is in the
 * ADMIN_ALLOWED_EMAILS environment variable (comma-separated list).
 * Returns false if the env var is unset or empty.
 */
export function isAllowedEmail(email: string): boolean {
  const raw = process.env.ADMIN_ALLOWED_EMAILS ?? ''
  if (!raw.trim()) return false
  const allowed = raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean)
  return allowed.includes(email.trim().toLowerCase())
}
