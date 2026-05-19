/**
 * Real Supabase Auth login for the DS2 admin panel.
 *
 * Security design:
 * - Resolves username → auth_user_id via the service-role client (bypasses
 *   RLS for this one lookup; the admin_users table RLS only allows reading
 *   your own row, so we need service-role for the username lookup direction).
 * - Validates the resolved email against ADMIN_ALLOWED_EMAILS before
 *   proceeding (defence-in-depth: even if a row exists in admin_users, the
 *   account email must be explicitly allowlisted).
 * - Uses a generic error message for ALL failure modes to prevent enumeration:
 *   "Incorrect username or password." — regardless of whether the username
 *   doesn't exist, the email isn't allowlisted, or the password is wrong.
 * - Never logs username, password, email, or keys.
 * - Redirect path is sanitised: must start with '/admin', else '/admin'.
 * - The signInWithPassword call uses the SSR server client so the session
 *   cookie is written correctly for App Router + middleware.
 */

'use server'

import { redirect } from 'next/navigation'
import { getServiceRoleClient, getSupabaseServerClient, isAllowedEmail } from '../../lib/supabase-server'

const GENERIC_ERROR = 'Incorrect username or password.'

function sanitiseRedirect(raw: string): string {
  if (typeof raw === 'string' && raw.startsWith('/admin') && !raw.startsWith('//')) {
    return raw
  }
  return '/admin'
}

export async function loginAction(
  formData: FormData,
): Promise<{ ok: false; error: string }> {
  const username = (formData.get('username') as string | null)?.trim().toLowerCase() ?? ''
  const password = (formData.get('password') as string | null) ?? ''
  const redirectTo = (formData.get('redirect') as string | null) ?? '/admin'

  // Reject immediately if required env vars are missing — do not surface
  // which specific var is absent to the browser.
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.ADMIN_ALLOWED_EMAILS
  ) {
    return { ok: false, error: GENERIC_ERROR }
  }

  if (!username || !password) {
    return { ok: false, error: GENERIC_ERROR }
  }

  const safeRedirect = sanitiseRedirect(redirectTo)

  // ── Step 1: resolve username → auth_user_id via service-role client ──────
  const serviceClient = getServiceRoleClient()
  const { data: adminRow, error: rowError } = await serviceClient
    .from('admin_users')
    .select('auth_user_id')
    .eq('username', username)
    .maybeSingle()

  if (rowError || !adminRow) {
    // Run a dummy constant-time operation to avoid trivial timing oracle.
    await new Promise(resolve => setTimeout(resolve, 50))
    return { ok: false, error: GENERIC_ERROR }
  }

  // ── Step 2: resolve auth_user_id → email via admin API ───────────────────
  const { data: userRecord, error: userError } =
    await serviceClient.auth.admin.getUserById(adminRow.auth_user_id)

  if (userError || !userRecord?.user?.email) {
    return { ok: false, error: GENERIC_ERROR }
  }

  const accountEmail = userRecord.user.email

  // ── Step 3: allowlist check (defence in depth) ────────────────────────────
  if (!isAllowedEmail(accountEmail)) {
    return { ok: false, error: GENERIC_ERROR }
  }

  // ── Step 4: sign in with Supabase Auth (writes session cookie) ───────────
  const supabase = await getSupabaseServerClient()
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: accountEmail,
    password,
  })

  if (signInError) {
    return { ok: false, error: GENERIC_ERROR }
  }

  // Success: redirect (throws internally in Next.js, do not catch it here).
  redirect(safeRedirect)
}
