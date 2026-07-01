'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { type ReactNode, useEffect, useState } from 'react'

const ICONS: Record<string, ReactNode> = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></svg>
  ),
  copilot: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" /><path d="M19 15l.9 2.1L22 18l-2.1.9L19 21l-.9-2.1L16 18l2.1-.9z" /></svg>
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
  calendar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
  ),
  planning: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4h6v3H9z" /><path d="m8.5 12 2 2 4-4" /></svg>
  ),
  products: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="6" cy="6" r="2.4" /><circle cx="18" cy="6" r="2.4" /><circle cx="6" cy="18" r="2.4" /><circle cx="18" cy="18" r="2.4" /></svg>
  ),
  competitors: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="3.5" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3" /></svg>
  ),
  signout: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M15 17l5-5-5-5" /><path d="M20 12H9" /><path d="M9 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h3" /></svg>
  ),
  collapse: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m13 17-5-5 5-5" /><path d="m18 17-5-5 5-5" /></svg>
  ),
  sun: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
  ),
  moon: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
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
  { href: '/admin/copilot', label: 'Copilot', icon: ICONS.copilot, match: (p) => p.startsWith('/admin/copilot') },
  { href: '/admin/funnel/leads', label: 'Funnel', icon: ICONS.funnel, match: (p) => p.startsWith('/admin/funnel') },
  { href: '/admin/projects', label: 'Projects', icon: ICONS.projects, match: (p) => p.startsWith('/admin/projects') },
  { href: '/admin/calendar', label: 'Calendar', icon: ICONS.calendar, match: (p) => p.startsWith('/admin/calendar') },
  { href: '/admin/planning', label: 'Planning', icon: ICONS.planning, match: (p) => p.startsWith('/admin/planning') },
  { href: '/admin/notes', label: 'Notes', icon: ICONS.notes, match: (p) => p.startsWith('/admin/notes') },
  { href: '/products', label: 'Products', icon: ICONS.products, match: (p) => p.startsWith('/products') },
  { href: '/admin/competitors', label: 'Competitors', icon: ICONS.competitors, match: (p) => p.startsWith('/admin/competitors') },
]

export function AdminRail() {
  const path = usePathname() ?? ''
  const [collapsed, setCollapsed] = useState(false)
  useEffect(() => {
    setCollapsed(window.localStorage.getItem('ds-admin-rail') === 'collapsed')
  }, [])
  function toggle() {
    setCollapsed((c) => {
      const next = !c
      window.localStorage.setItem('ds-admin-rail', next ? 'collapsed' : 'open')
      return next
    })
  }
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark')
  }, [])
  function toggleTheme() {
    setTheme((t) => {
      const next = t === 'dark' ? 'light' : 'dark'
      if (next === 'light') document.documentElement.setAttribute('data-theme', 'light')
      else document.documentElement.removeAttribute('data-theme')
      window.localStorage.setItem('ds-theme', next)
      return next
    })
  }
  return (
    <nav className={`admin-rail${collapsed ? ' is-collapsed' : ''}`} aria-label="Admin navigation">
      <Link href="/admin" className="admin-rail__brand" aria-label="DS2 Admin home">
        <img src="/brand/ds2-mark.png" alt="DS2" width={26} height={26} />
        <span className="admin-rail__brandname">Admin</span>
      </Link>
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
      <button
        type="button"
        className="admin-rail__collapse is-theme"
        onClick={toggleTheme}
        aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      >
        {theme === 'dark' ? ICONS.sun : ICONS.moon}
        <span className="admin-rail__label">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
      </button>
      <button
        type="button"
        className="admin-rail__collapse"
        onClick={toggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-pressed={collapsed}
      >
        {ICONS.collapse}
        <span className="admin-rail__label">Collapse</span>
      </button>
      <form method="post" action="/admin/logout">
        <button type="submit" className="admin-rail__signout" aria-label="Sign out">
          {ICONS.signout}
          <span className="admin-rail__label">Sign out</span>
        </button>
      </form>
    </nav>
  )
}
