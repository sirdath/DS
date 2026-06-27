import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { TRACKED_SITES } from '@/app/admin/lib/sites'
import AnalyticsCard from './AnalyticsCard'

interface VisitRow {
  path: string | null
  created_at: string
  country: string | null
  visitor_id: string | null
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function sevenDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString()
}

/** Per-site visit overview cards. Embedded in the Projects → Analytics tab. */
export default async function AnalyticsOverview() {
  const sb = getSupabase()

  let allVisits: VisitRow[] = []
  let fetchError: string | null = null

  if (!sb) {
    fetchError = 'Supabase env vars not set (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).'
  } else {
    try {
      const { data, error } = await sb
        .from('visits')
        .select('path, created_at, country, visitor_id')
        .order('created_at', { ascending: false })
      if (error) fetchError = error.message
      else if (data) allVisits = data as VisitRow[]
    } catch (err) {
      fetchError = err instanceof Error ? err.message : 'Unknown fetch error.'
    }
  }

  const week = sevenDaysAgo()

  const stats = TRACKED_SITES.map((site) => {
    const visits = allVisits.filter((v) => v.path?.startsWith(site.pathPrefix))
    const weekVisits = visits.filter((v) => v.created_at > week)
    const uniqueVisitors = new Set(visits.map((v) => v.visitor_id).filter(Boolean)).size
    const countryCounts = visits.reduce<Record<string, number>>((acc, v) => {
      const k = v.country ?? 'Unknown'
      acc[k] = (acc[k] ?? 0) + 1
      return acc
    }, {})
    const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]
    return {
      site,
      total: visits.length,
      weekCount: weekVisits.length,
      uniqueVisitors,
      topCountry: topCountry?.[0] ?? null,
      lastVisit: visits[0]?.created_at ?? null,
    }
  })

  return (
    <div>
      {fetchError && (
        <div style={{
          marginBottom: '20px', padding: '16px 20px',
          border: '1px solid rgba(141,203,255,0.32)', background: 'rgba(141,203,255,0.06)',
          borderRadius: '10px', color: '#8dcbff', fontSize: '13px', lineHeight: 1.55,
          fontFamily: 'ui-monospace, monospace',
        }}>
          <strong style={{ color: '#f5c98a' }}>Analytics data unavailable.</strong>{' '}
          {fetchError} Cards show empty stats — check the deployment env vars.
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
        {stats.map(({ site, total, weekCount, uniqueVisitors, topCountry, lastVisit }) => (
          <AnalyticsCard
            key={site.slug}
            slug={site.slug}
            name={site.name}
            url={site.url}
            description={site.description}
            total={total}
            weekCount={weekCount}
            uniqueVisitors={uniqueVisitors}
            topCountry={topCountry}
            lastVisit={lastVisit}
          />
        ))}
      </div>
    </div>
  )
}
