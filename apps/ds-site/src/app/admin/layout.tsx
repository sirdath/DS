import './admin.css'
import Link from 'next/link'
import type { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <span className="admin-topbar__eyebrow">DS2 · Admin</span>

        <nav className="admin-topbar__nav" aria-label="Admin navigation">
          <Link href="/admin" className="admin-topbar__link">
            Projects
          </Link>
          <Link href="/admin/analytics" className="admin-topbar__link">
            Analytics
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
