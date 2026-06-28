import Link from 'next/link'
import type { SiteActivity } from '@/app/admin/lib/site-activity'

/** Dashboard "Site activity" card — per-tracked-site views today with the delta
 * vs yesterday, and the 7-day total + unique visitors. Each row links to that
 * site's full analytics. */
export function SiteActivityCard({ activity }: { activity: SiteActivity[] }) {
  return (
    <section className="ds2-card">
      <div className="ds2-list__head">
        <span className="ds2-list__title">Site activity</span>
        <Link href="/admin/projects" className="ds2-list__all">
          Analytics →
        </Link>
      </div>
      {activity.length === 0 ? (
        <p className="ds2-empty">No tracked sites yet.</p>
      ) : (
        activity.map(({ site, today, yesterday, last7, uniqueVisitors7 }) => {
          const delta = today - yesterday
          const dir = delta > 0 ? 'is-up' : delta < 0 ? 'is-down' : ''
          const deltaLabel = delta > 0 ? `▲ ${delta}` : delta < 0 ? `▼ ${Math.abs(delta)}` : '±0'
          return (
            <Link href={`/admin/projects/analytics/${site.slug}`} className="ds2-act" key={site.slug}>
              <div className="ds2-act__top">
                <span className="ds2-act__name" translate="no">
                  {site.name}
                </span>
                <span className="ds2-act__today">
                  <b>{today}</b> today
                </span>
              </div>
              <div className="ds2-act__meta">
                <span className={`ds2-act__delta ${dir}`}>{deltaLabel} vs yesterday</span>
                <span className="ds2-act__7">
                  {last7} in 7d · {uniqueVisitors7} visitor{uniqueVisitors7 === 1 ? '' : 's'}
                </span>
              </div>
            </Link>
          )
        })
      )}
    </section>
  )
}
