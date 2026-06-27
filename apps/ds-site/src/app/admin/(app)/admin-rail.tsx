'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { ReactNode } from 'react'

const ICONS: Record<string, ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
  ),
  funnel: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M3 5h18l-7 8v6l-4 2v-8z" /></svg>
  ),
  projects: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="m12 3 9 5-9 5-9-5z" /><path d="m3 13 9 5 9-5" /></svg>
  ),
  notes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /><path d="M9 13h6M9 17h6" /></svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="6" cy="6" r="2.4" /><circle cx="18" cy="6" r="2.4" /><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="18" r="2.4" /></svg>
  ),
  signout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17l5-5-5-5" /><path d="M20 12H9" /><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /></svg>
  ),
}

interface Item {
  href: string
  label: string
  icon: ReactNode
  match: (p: string) => boolean
}

const ITEMS: Item[] = [
  { href: '/admin', label: 'Dashboard', icon: ICONS.dashboard, match: (p) => p === '/admin' || p === '/admin/' },
  { href: '/admin/funnel/leads', label: 'Funnel', icon: ICONS.funnel, match: (p) => p.startsWith('/admin/funnel') },
  { href: '/admin/projects', label: 'Projects', icon: ICONS.projects, match: (p) => p.startsWith('/admin/projects') },
  { href: '/admin/notes', label: 'Notes', icon: ICONS.notes, match: (p) => p.startsWith('/admin/notes') },
  { href: '/products', label: 'Products', icon: ICONS.products, match: (p) => p.startsWith('/products') },
]

export function AdminRail() {
  const path = usePathname() ?? ''
  return (
    <nav className="admin-rail" aria-label="Admin navigation">
      <Link href="/admin" className="admin-rail__brand" aria-label="DS2 Admin home">DS</Link>
      <div className="admin-rail__nav">
        {ITEMS.map((it) => {
          const on = it.match(path)
          return (
            <Link
              key={it.href}
              href={it.href}
              className={`admin-rail__item${on ? ' is-active' : ''}`}
              aria-label={it.label}
              aria-current={on ? 'page' : undefined}
            >
              {it.icon}
              <span className="admin-rail__label">{it.label}</span>
            </Link>
          )
        })}
      </div>
      <div className="admin-rail__spacer" />
      <form method="post" action="/admin/logout">
        <button type="submit" className="admin-rail__signout" aria-label="Sign out">{ICONS.signout}</button>
      </form>
    </nav>
  )
}
