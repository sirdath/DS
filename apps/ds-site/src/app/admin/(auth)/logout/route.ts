/**
 * Admin logout route handler.
 *
 * POST /admin/logout — submitted by the topbar sign-out form.
 *   Signs out from Supabase Auth (clears session cookie) then redirects
 *   to /admin/login?signedout=1.
 *
 * GET /admin/logout — defensive fallback; redirects to /admin/login.
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '../../lib/supabase-server'

function loginUrl(request: NextRequest, params?: string): string {
  const origin = request.nextUrl.origin
  return `${origin}/admin/login${params ? `?${params}` : ''}`
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const supabase = await getSupabaseServerClient()
    await supabase.auth.signOut()
  } catch {
    // If sign-out fails (e.g. session already expired), still redirect to
    // login so the user ends up in a clean unauthenticated state.
  }

  return NextResponse.redirect(loginUrl(request, 'signedout=1'), { status: 303 })
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.redirect(loginUrl(request), { status: 303 })
}
