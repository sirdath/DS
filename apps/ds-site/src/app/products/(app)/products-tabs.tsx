'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { TOOLS } from '../lib/tools-catalog'

// The Products top tool-nav. Press between tools — each opens within the admin
// shell (same chrome, no reset). This is route navigation, so it's a real <nav> of
// links with aria-current on the active one (not an ARIA tablist — there are no
// tabpanels). Built from the same catalog the launcher uses, so it never drifts.
const TOOL_TABS = TOOLS.map((t) => ({ href: t.href ?? '/products', label: t.name }))

export function ProductsTabs() {
  const path = usePathname() ?? ''
  // Which tool (if any) owns this path. "All tools" is the hub home — and the
  // default-active when no tool owns the route (e.g. /products/presentations), so
  // the nav is never left in a no-selection state.
  const activeTool = TOOL_TABS.find((t) => path.startsWith(t.href))
  const homeActive = !activeTool && path.startsWith('/products')

  return (
    <nav className="ws-tabs" aria-label="Products tools">
      <Link
        href="/products"
        className={`ws-tab${homeActive ? ' is-on' : ''}`}
        aria-current={homeActive ? 'page' : undefined}
      >
        All tools
      </Link>
      {TOOL_TABS.map((t) => {
        const on = t === activeTool
        return (
          <Link
            key={`${t.href}:${t.label}`}
            href={t.href}
            className={`ws-tab${on ? ' is-on' : ''}`}
            aria-current={on ? 'page' : undefined}
            translate="no"
          >
            {t.label}
          </Link>
        )
      })}
    </nav>
  )
}
