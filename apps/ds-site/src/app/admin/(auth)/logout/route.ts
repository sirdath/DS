/**
 * Admin logout route handler.
 *
 * POST /admin/logout — submitted by the topbar sign-out form.
 *   Verifies the request Origin matches the app origin (CSRF/Origin check)
 *   before signing out from Supabase Auth, then redirects to
 *   /admin/login?signedout=1.
 *
 * GET /admin/logout — returns 405 Method Not Allowed with Allow: POST header.
 *   GET requests must NOT carry logout semantics (Fix 11).
 */

import { type NextRequest, NextResponse } from 'next/server'
import { getSupabaseServerClient } from '../../lib/supabase-server'

function loginUrl(request: NextRequest, params?: string): string {
  const origin = request.nextUrl.origin
  // Include trailing slash so trailingSlash:true does not incur an extra 308
  // hop; the middleware exempt check then matches /admin/login/ directly.
  return `${origin}/admin/login/${params ? `?${params}` : ''}`
}

/**
 * Verifies the request came from the same origin.
 * Checks the Origin header first (present on form POSTs in all modern
 * browsers); falls back to the Referer header if Origin is absent.
 * Returns true iff the request is same-origin.
 */
function isSameOrigin(request: NextRequest): boolean {
  const appOrigin = request.nextUrl.origin
  const originHeader = request.headers.get('origin')
  if (originHeader) {
    // Strip trailing slash for a clean comparison.
    return originHeader.replace(/\/$/, '') === appOrigin.replace(/\/$/, '')
  }
  // Fallback: Referer (less reliable but better than nothing for old clients).
  const referer = request.headers.get('referer')
  if (referer) {
    try {
      return new URL(referer).origin === appOrigin
    } catch {
      return false
    }
  }
  // No origin evidence at all — reject to be safe.
  return false
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  // CSRF / Origin check: reject cross-origin logout attempts (Fix 11).
  if (!isSameOrigin(request)) {
    return new NextResponse('Forbidden', { status: 403 })
  }

  try {
    const supabase = await getSupabaseServerClient()
    await supabase.auth.signOut()
  } catch {
    // If sign-out fails (e.g. session already expired), still redirect to
    // login so the user ends up in a clean unauthenticated state.
  }

  return NextResponse.redirect(loginUrl(request, 'signedout=1'), { status: 303 })
}

// GET logout carries no semantics — return 405 with correct Allow header (Fix 11).
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest): Promise<NextResponse> {
  return new NextResponse('Method Not Allowed', {
    status: 405,
    headers: { Allow: 'POST' },
  })
}
