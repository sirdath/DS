/**
 * Workspace login — email + password via Supabase Auth.
 *
 * A client = a Supabase auth user; founders are additionally allowlisted (role is
 * derived later, in workspace-auth). Generic error on every failure path + a
 * constant-time floor to resist enumeration/timing oracles. Never logs
 * credentials. Redirect is confined to /workspace. (Magic-link onboarding for
 * clients — the portal's intended flow — can replace this later.)
 */

'use server'

import { redirect } from 'next/navigation'
import { getSupabaseServerClient } from '../../../admin/lib/supabase-server'

export interface LoginState {
  ok: false
  error: string
}

const GENERIC_ERROR = 'Incorrect email or password.'
const MIN_RESPONSE_MS = 300

function sanitiseRedirect(raw: unknown): string {
  if (typeof raw !== 'string' || raw === '') return '/products'
  try {
    const u = new URL(raw, 'https://invalid.local')
    if (u.host !== 'invalid.local') return '/products'
    if (u.pathname !== '/products' && !u.pathname.startsWith('/products/')) return '/products'
    if (u.pathname.startsWith('/products//') || u.pathname.includes('\\')) return '/products'
    return u.pathname + u.search
  } catch {
    return '/products'
  }
}

export async function workspaceLoginAction(formData: FormData): Promise<LoginState> {
  const startMs = Date.now()
  async function failWithDelay(): Promise<LoginState> {
    const remaining = MIN_RESPONSE_MS - (Date.now() - startMs)
    if (remaining > 0) await new Promise((resolve) => setTimeout(resolve, remaining))
    return { ok: false, error: GENERIC_ERROR }
  }

  const email = (formData.get('email') as string | null)?.trim().toLowerCase() ?? ''
  const password = (formData.get('password') as string | null) ?? ''
  const redirectTo = (formData.get('redirect') as string | null) ?? '/products'

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return failWithDelay()
  }
  if (!email || !password) return failWithDelay()

  const safeRedirect = sanitiseRedirect(redirectTo)
  const supabase = await getSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) return failWithDelay()

  redirect(safeRedirect) // throws internally — do not catch
}
