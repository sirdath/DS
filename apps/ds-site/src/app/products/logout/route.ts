/**
 * Workspace sign-out. POST clears the Supabase session and returns to login.
 * Tolerant of keyless dev (no Supabase env) — it just redirects.
 */

import { NextResponse } from 'next/server'
import { getSupabaseServerClient } from '../../admin/lib/supabase-server'

export const runtime = 'nodejs'

export async function POST(request: Request): Promise<Response> {
  try {
    const supabase = await getSupabaseServerClient()
    await supabase.auth.signOut()
  } catch {
    // No Supabase env (keyless dev) or already signed out — nothing to clear.
  }
  return NextResponse.redirect(new URL('/products/login', request.url), { status: 303 })
}
