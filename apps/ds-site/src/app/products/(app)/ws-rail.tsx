'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TOOLS } from '../lib/tools-catalog'
import type { WorkspaceSession } from '../lib/workspace-auth'

const ICON = {
  home: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M3 11l9-7 9 7" /><path d="M5 10v9a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-9" /></svg>
  ),
  deck: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><rect x="3" y="4" width="18" height="13" rx="2" /><path d="M8 21h8M12 17v4" /></svg>
  ),
  admin: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l-6 6 6 6" /><path d="M3 12h12a6 6 0 0 1 6 6" /></svg>
  ),
  signout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17l5-5-5-5" /><path d="M20 12H9" /><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /></svg>
  ),
}

export function WsRail({ session }: { session: WorkspaceSession }) {
  const path = usePathname() ?? ''
  return (
    <nav className="ws-rail" aria-label="Products navigation">
      <Link href="/products" className="ws-rail__brand" aria-label="Products home">
        <img src="/brand/ds2-mark.png" alt="DS2" width={26} height={26} />
        <span className="ws-rail__brandname">Products</span>
      </Link>

      <div className="ws-rail__nav">
        <Link href="/products" className={`ws-rail__item${path === '/products' || path === '/products/' ? ' is-active' : ''}`}>
          {ICON.home}
          <span>All tools</span>
        </Link>
        {TOOLS.map((t) => {
          if (!t.href) return null
          const base = t.href.split('?')[0] ?? t.href
          const on = base.startsWith('/products/') && path.startsWith(base)
          return (
            <Link key={t.slug} href={t.href} className={`ws-rail__item${on ? ' is-active' : ''}`}>
              <i className="ws-rail__dot" style={{ background: t.accent }} />
              <span translate="no">{t.name}</span>
            </Link>
          )
        })}
        {session.role === 'internal' ? (
          <Link href="/products/presentations" className={`ws-rail__item${path.startsWith('/products/presentations') ? ' is-active' : ''}`}>
            {ICON.deck}
            <span>Presentations</span>
          </Link>
        ) : null}
      </div>

      <div className="ws-rail__spacer" />

      {session.role === 'internal' ? (
        <Link href="/admin" className="ws-rail__item">
          {ICON.admin}
          <span>Admin</span>
        </Link>
      ) : null}

      <div className="ws-rail__foot">
        <span className="ws-role" data-role={session.role}>{session.role === 'internal' ? 'Internal' : 'Client'}</span>
        <span className="ws-rail__email">{session.email}</span>
        <form method="post" action="/products/logout">
          <button type="submit" className="ws-rail__signout">
            {ICON.signout}
            <span>Sign out</span>
          </button>
        </form>
      </div>
    </nav>
  )
}
