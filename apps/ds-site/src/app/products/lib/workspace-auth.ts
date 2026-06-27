/**
 * Workspace session + role resolution.
 *
 * Reuses the admin Supabase helpers (a client = a Supabase auth user, per the
 * portal schema). Role is derived from the admin allowlist: founders are
 * "internal" and see everything; everyone else is a "client" scoped to their own
 * data by RLS. In keyless local dev (no Supabase env) the middleware lets
 * /workspace through, so we render as an internal dev user to keep the UI usable.
 */

import 'server-only'
import { getSessionUser, isAllowedEmail } from '../../admin/lib/supabase-server'

export type WorkspaceRole = 'internal' | 'client'

export interface WorkspaceSession {
  email: string
  role: WorkspaceRole
  userId: string | null
  devMode: boolean
}

function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

export async function resolveWorkspaceSession(): Promise<WorkspaceSession | null> {
  if (!hasSupabaseEnv()) {
    // Keyless dev only — production fails closed (middleware already redirected).
    if (process.env.NODE_ENV === 'production') return null
    return { email: 'dev@local', role: 'internal', userId: null, devMode: true }
  }

  const user = await getSessionUser()
  if (!user?.email) return null

  return {
    email: user.email,
    role: isAllowedEmail(user.email) ? 'internal' : 'client',
    userId: user.id,
    devMode: false,
  }
}
