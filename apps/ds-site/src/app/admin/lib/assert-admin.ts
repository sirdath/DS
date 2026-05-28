import 'server-only'
import { getSessionUser, isAllowedEmail } from './supabase-server'

/**
 * Shared admin guard for the leads API routes + server actions. Mirrors the
 * guard in admin/actions.ts: dev passes through without Supabase env; production
 * requires a valid session whose email is allow-listed.
 */
export async function assertAdmin(): Promise<void> {
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!hasSupabase) {
    if (process.env.NODE_ENV === 'production') throw new Error('Unauthorized')
    return
  }
  const user = await getSessionUser()
  if (!user || !isAllowedEmail(user.email ?? '')) throw new Error('Unauthorized')
}
