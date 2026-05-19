/**
 * Admin logout route handler.
 *
 * PLACEHOLDER — NO REAL SESSION.
 * TODO(Phase 4): call supabase.auth.signOut() and clear the session cookie
 * before redirecting. See Task 13 in the plan.
 *
 * POST /admin/logout — submitted by the topbar sign-out form in layout.tsx
 * GET  /admin/logout  — defensive fallback
 */

import { type NextRequest, NextResponse } from 'next/server'

function buildRedirectUrl(request: NextRequest, path: string): string {
  const origin = request.nextUrl.origin
  return `${origin}${path}`
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // TODO(Phase 4): clear Supabase session here, e.g.
  //   const supabase = createServerClient(...)
  //   await supabase.auth.signOut()
  //   response.cookies.delete('sb-access-token')

  return NextResponse.redirect(
    buildRedirectUrl(request, '/admin/login?signedout=1'),
    { status: 303 },
  )
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Defensive: visiting /admin/logout directly sends to login
  return NextResponse.redirect(
    buildRedirectUrl(request, '/admin/login'),
    { status: 303 },
  )
}
