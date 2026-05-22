import { NextResponse } from 'next/server'
import { getSessionUser, isAllowedEmail } from '@/app/admin/lib/supabase-server'
import { getSite, adminLabel } from '@/app/admin/lib/sites'
import { AUTH_COOKIE, AUTH_VALUE, CLIENT_COOKIE, GATE_COOKIE_OPTS } from '@/app/admin/lib/client-gate'

export const dynamic = 'force-dynamic'

/**
 * Admin auto-login into a client site. The admin is already authenticated
 * (this route is under the /admin gate), so we set the client-gate cookie on
 * their behalf and redirect to the site — no client password needed. The
 * visit is tagged `<admin>-admin` so it shows in analytics as that admin.
 */
export async function GET(request: Request, ctx: { params: Promise<{ site: string }> }) {
  const { site: slug } = await ctx.params
  const site = getSite(slug)
  if (!site) return NextResponse.json({ error: 'Unknown site' }, { status: 404 })

  // Resolve the acting admin — mirrors assertAdmin() in admin/actions.ts.
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  let label = 'admin'
  if (hasSupabase) {
    const user = await getSessionUser()
    if (!user || !isAllowedEmail(user.email ?? '')) {
      return NextResponse.redirect(new URL('/admin/login/', request.url))
    }
    label = adminLabel(user.email)
  } else {
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    label = 'dimitris' // dev mock default (no Supabase locally)
  }

  const res = NextResponse.redirect(new URL(site.openPath, request.url))
  res.cookies.set(AUTH_COOKIE, AUTH_VALUE, GATE_COOKIE_OPTS)
  res.cookies.set(CLIENT_COOKIE, `${label}-admin`, GATE_COOKIE_OPTS)
  return res
}
