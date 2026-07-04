import 'server-only'
import { getSessionUser, isAllowedEmail } from './supabase-server'

/**
 * Two-tier, email-based roles for the admin panel.
 *   • owner    — a founder. Email in ADMIN_ALLOWED_EMAILS. Sees everything.
 *   • employee — staff. Email in STAFF_EMAILS. Least-privilege scoped view.
 * Owners are resolved first, so a founder is never demoted by appearing in both.
 * Enforcement is layered: the middleware blocks employees from owner routes,
 * assertAdmin() already rejects any non-owner from owner actions/APIs, and the
 * scoped dashboard queries are filtered by the member's own email.
 */
export type Role = 'owner' | 'employee'

/** Emails allowed as employees (comma-separated STAFF_EMAILS). */
function staffEmails(): string[] {
  return (process.env.STAFF_EMAILS ?? '')
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean)
}

export function isStaffEmail(email: string): boolean {
  const e = email.trim().toLowerCase()
  return !!e && staffEmails().includes(e)
}

/** Resolve a role from an email, or null if the email is neither owner nor staff. */
export function roleForEmail(email: string | null | undefined): Role | null {
  if (!email) return null
  if (isAllowedEmail(email)) return 'owner'
  if (isStaffEmail(email)) return 'employee'
  return null
}

/** The current session's role. Keyless dev (no Supabase env) is treated as owner. */
export async function getCurrentRole(): Promise<Role | null> {
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!hasSupabase) return process.env.NODE_ENV === 'production' ? null : 'owner'
  const user = await getSessionUser()
  return roleForEmail(user?.email)
}

/** The current session's email (lower-cased) — used to scope employee queries. */
export async function getCurrentEmail(): Promise<string | null> {
  const user = await getSessionUser()
  return user?.email?.trim().toLowerCase() ?? null
}

/** Throw unless the caller is an owner. Use to guard owner-only server actions. */
export async function assertOwner(): Promise<void> {
  const role = await getCurrentRole()
  if (role !== 'owner') throw new Error('Unauthorized')
}
