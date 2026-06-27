import Link from 'next/link'
import type { ReactNode } from 'react'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <span className="admin-topbar__eyebrow">DS2 · Admin</span>

        <nav className="admin-topbar__nav" aria-label="Admin navigation">
          <Link href="/admin" className="admin-topbar__link">
            Dashboard
          </Link>
          <Link href="/admin/projects" className="admin-topbar__link">
            Projects
          </Link>
          <Link href="/admin/funnel/leads" className="admin-topbar__link">
            Funnel
          </Link>
          <Link href="/admin/notes" className="admin-topbar__link">
            Notes
          </Link>
          <Link href="/products" className="admin-topbar__link">
            Products
          </Link>
        </nav>

        <div className="admin-topbar__actions">
          <form method="post" action="/admin/logout">
            <button type="submit" className="admin-topbar__signout">
              Sign out
            </button>
          </form>
        </div>
      </header>

      {children}
    </div>
  )
}
