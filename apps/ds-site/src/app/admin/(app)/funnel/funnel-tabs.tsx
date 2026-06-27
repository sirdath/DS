'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const TABS = [
  { href: '/admin/funnel/leads', label: 'Leads' },
  { href: '/admin/funnel/hunt', label: 'Hunt' },
  { href: '/admin/funnel/outreach', label: 'Outreach' },
] as const

/** Segmented sub-nav for the unified Funnel tab. Deep-linked; active by pathname
 * (trailingSlash:true is on, so match both with and without the trailing slash). */
export function FunnelTabs() {
  const path = usePathname()
  return (
    <div className="admin-funnel__tabs" role="tablist" aria-label="Funnel views">
      {TABS.map((t) => {
        const on = path === t.href || path === `${t.href}/`
        return (
          <Link
            key={t.href}
            href={t.href}
            role="tab"
            aria-selected={on}
            className={`admin-outreach__seg-btn${on ? ' is-on' : ''}`}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}
