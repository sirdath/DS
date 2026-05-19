/**
 * PLACEHOLDER — NO REAL AUTH.
 *
 * Phase 4 (Task 13) replaces this with Supabase Auth + allowlist.
 * Until then /admin is NOT actually protected (middleware gate is Task 14).
 *
 * This server action exists solely to make the login flow navigable
 * and demoable. It does NOT set any session cookie, does NOT verify
 * credentials against any database, and MUST NOT be treated as secure.
 *
 * TODO(Phase 4): replace with Supabase username→account resolution +
 *   email allowlist + signInWithPassword. See Task 13 in the plan.
 */

'use server'

import { redirect } from 'next/navigation'

export async function loginAction(
  formData: FormData,
): Promise<{ ok: false; error: string }> {
  const username = (formData.get('username') as string | null)?.trim() ?? ''
  const password = (formData.get('password') as string | null)?.trim() ?? ''
  const redirectTo = (formData.get('redirect') as string | null) ?? '/admin'

  // TODO(Phase 4): replace with Supabase username→account resolution +
  // email allowlist + signInWithPassword. Do NOT use this placeholder in
  // production — it accepts any non-empty username+password.
  if (!username || !password) {
    return { ok: false, error: 'invalid' }
  }

  // Safe redirect: only allow same-origin relative paths
  const safePath =
    redirectTo.startsWith('/') && !redirectTo.startsWith('//')
      ? redirectTo
      : '/admin'

  redirect(safePath)
}
