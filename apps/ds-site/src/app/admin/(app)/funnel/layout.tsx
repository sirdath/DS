import type { ReactNode } from 'react'
import { FunnelTabs } from './funnel-tabs'

/** The Funnel hub: one nav tab holding Leads / Hunt / Outreach as sub-views.
 * Each sub-view keeps its own route, data loading, filters and deep-links — the
 * sub-tab bar just switches between them. */
export default function FunnelLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="admin-funnel__bar">
        <FunnelTabs />
      </div>
      {children}
    </>
  )
}
