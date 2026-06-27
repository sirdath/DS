import 'server-only'

import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import { getSite } from '@/app/admin/lib/sites'
import FilterBar from './FilterBar'

export const dynamic = 'force-dynamic'

interface VisitRow {
  id: string | number
  path: string | null
  created_at: string
  country: string | null
  referrer: string | null
  visitor_id: string | null
  client_id: string | null
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

function formatDate(iso: string, tz: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
    timeZone: tz,
  })
}

function truncate(str: string | null, n: number) {
  if (!str) return '—'
  return str.length > n ? str.slice(0, n) + '…' : str
}

function last30DaysInTZ(tz: string): string[] {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - (29 - i))
    return d.toLocaleDateString('en-CA', { timeZone: tz })
  })
}

function getLocalDay(iso: string, tz: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: tz })
}

function sevenDaysAgo() {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString()
}

export default async function ProjectAnalytics({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ from?: string; to?: string; tz?: string; group?: string }>
}) {
  const { slug } = await params
  const { from, to, tz = 'Europe/London', group } = await searchParams

  const project = getSite(slug)
  if (!project) notFound()

  const sb = getSupabase()

  let visits: VisitRow[] = []
  let fetchError: string | null = null

  if (!sb) {
    fetchError = 'Supabase env vars not set (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY).'
  } else {
    try {
      const { data, error } = await sb
        .from('visits')
        .select('*')
        .like('path', `${project.pathPrefix}%`)
        .order('created_at', { ascending: false })
        .limit(2000)
      if (error) {
        fetchError = error.message
      } else if (data) {
        visits = data as VisitRow[]
      }
    } catch (err) {
      fetchError = err instanceof Error ? err.message : 'Unknown fetch error.'
    }
  }

  // Apply date range + group filter
  const all = visits.filter(v => {
    if (from && v.created_at < `${from}T00:00:00Z`) return false
    if (to && v.created_at > `${to}T23:59:59Z`) return false
    if (group === 'leads' && v.client_id?.endsWith('-admin')) return false
    if (group === 'admins' && !v.client_id?.endsWith('-admin')) return false
    return true
  })

  const total = all.length
  const weekVisits = all.filter(v => v.created_at > sevenDaysAgo())
  const uniqueVisitors = new Set(all.map(v => v.visitor_id).filter(Boolean)).size

  // Chart grouped by day in selected timezone
  const days = last30DaysInTZ(tz)
  const byDay = all.reduce<Record<string, number>>((acc, v) => {
    const day = getLocalDay(v.created_at, tz)
    acc[day] = (acc[day] ?? 0) + 1
    return acc
  }, {})
  const chartData = days.map(day => ({ day, count: byDay[day] ?? 0 }))
  const maxCount = Math.max(...chartData.map(d => d.count), 1)

  // Top pages
  const pageCounts = all.reduce<Record<string, number>>((acc, v) => {
    const k = v.path ?? '/'
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
  const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Top countries
  const countryCounts = all.reduce<Record<string, number>>((acc, v) => {
    const k = v.country ?? 'Unknown'
    acc[k] = (acc[k] ?? 0) + 1
    return acc
  }, {})
  const topCountries = Object.entries(countryCounts).sort((a, b) => b[1] - a[1]).slice(0, 8)

  // Top referrers
  const refCounts = all.reduce<Record<string, number>>((acc, v) => {
    if (!v.referrer) return acc
    try {
      const host = new URL(v.referrer).hostname
      acc[host] = (acc[host] ?? 0) + 1
    } catch {
      acc[v.referrer] = (acc[v.referrer] ?? 0) + 1
    }
    return acc
  }, {})
  const topReferrers = Object.entries(refCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#f5f5f5',
      padding: '52px 36px',
      fontFamily: 'var(--font-inter), ui-sans-serif, sans-serif',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* Back + header */}
        <div style={{ marginBottom: '44px' }}>
          <Link href="/admin/projects?view=analytics" style={{ fontSize: '12px', color: '#555', textDecoration: 'none', fontFamily: 'ui-monospace, monospace', letterSpacing: '0.04em', display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '20px' }}>
            ← All analytics
          </Link>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '24px', flexWrap: 'wrap' }}>
            <div>
              <p style={{ fontSize: '11px', color: '#444', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace', marginBottom: '8px' }}>
                DS2 · Analytics
              </p>
              <h1 style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '-0.025em', margin: 0 }}>
                {project.name}
              </h1>
              <p style={{ marginTop: '6px', fontSize: '12px', color: '#555', fontFamily: 'ui-monospace, monospace' }}>
                {project.url}
              </p>
            </div>
            <Suspense>
              <FilterBar initialTz={tz} activeGroup={group ?? null} />
            </Suspense>
          </div>
        </div>

        {fetchError && (
          <div style={{
            marginBottom: '24px',
            padding: '18px 22px',
            border: '1px solid rgba(141,203,255,0.32)',
            background: 'rgba(141,203,255,0.06)',
            borderRadius: '10px',
            color: '#8dcbff',
            fontSize: '13px',
            lineHeight: 1.55,
            fontFamily: 'ui-monospace, monospace',
          }}>
            <strong style={{ color: '#f5c98a' }}>Analytics data unavailable.</strong>{' '}
            {fetchError} Stats below show zero — check Vercel project env vars.
          </div>
        )}

        {/* Stat cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginBottom: '32px' }}>
          <StatCard label="Unique visitors" value={uniqueVisitors} />
          <StatCard label="Total views" value={total} />
          <StatCard label="This week" value={weekVisits.length} />
          <StatCard label="Top country" value={topCountries[0]?.[0] ?? '—'} />
        </div>

        {/* Visits over time chart */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px',
          padding: '28px 28px 20px',
          marginBottom: '16px',
        }}>
          <p style={{ fontSize: '11px', color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace', marginBottom: '24px' }}>
            Visits — last 30 days ({tz === 'Europe/Athens' ? 'Athens time' : 'London time'})
          </p>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '80px' }}>
            {chartData.map(({ day, count }) => (
              <div
                key={day}
                title={`${day}: ${count} visit${count !== 1 ? 's' : ''}`}
                style={{
                  flex: 1,
                  height: count > 0 ? `${Math.max((count / maxCount) * 100, 8)}%` : '2px',
                  background: count > 0 ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.06)',
                  borderRadius: '2px 2px 0 0',
                  transition: 'background 0.15s',
                  cursor: 'default',
                }}
              />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '11px', color: '#444', fontFamily: 'ui-monospace, monospace' }}>{days[0]}</span>
            <span style={{ fontSize: '11px', color: '#444', fontFamily: 'ui-monospace, monospace' }}>{days[days.length - 1]}</span>
          </div>
        </div>

        {/* Pages + Countries + Referrers */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '16px' }}>
          <BreakdownTable title="Top pages" rows={topPages} total={total} labelFn={l => l.replace(project.pathPrefix, '') || '/'} />
          <BreakdownTable title="Top countries" rows={topCountries} total={total} />
          <BreakdownTable title="Referrers" rows={topReferrers} total={total} />
        </div>

        {/* Recent visits */}
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ fontSize: '11px', color: '#555', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace', margin: 0 }}>
              Recent visits
            </p>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  {['Time', 'Page', 'Country', 'Via', 'Referrer'].map(h => (
                    <th key={h} style={{ padding: '11px 20px', textAlign: 'left', color: '#444', fontWeight: 400, fontFamily: 'ui-monospace, monospace', fontSize: '10px', letterSpacing: '0.1em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {all.slice(0, 50).map(v => (
                  <tr key={v.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
                    <td style={{ padding: '12px 20px', color: '#555', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
                      {formatDate(v.created_at, tz)}
                    </td>
                    <td style={{ padding: '12px 20px', color: '#ccc', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
                      {(v.path ?? '/').replace(project.pathPrefix, '') || '/'}
                    </td>
                    <td style={{ padding: '12px 20px', color: '#777' }}>
                      {v.country ?? '—'}
                    </td>
                    <td style={{ padding: '12px 20px', color: v.client_id ? (v.client_id.includes('[blocked]') ? '#c96868' : v.client_id.endsWith('-admin') ? '#43a47a' : '#a78bfa') : '#444', fontFamily: 'ui-monospace, monospace', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {v.client_id ?? '—'}
                    </td>
                    <td style={{ padding: '12px 20px', color: '#555', maxWidth: '260px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {truncate(v.referrer, 48)}
                    </td>
                  </tr>
                ))}
                {total === 0 && (
                  <tr>
                    <td colSpan={5} style={{ padding: '36px 20px', textAlign: 'center', color: '#444', fontFamily: 'ui-monospace, monospace', fontSize: '12px' }}>
                      No visits recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </main>
  )
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.03)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '10px',
      padding: '22px 24px',
    }}>
      <p style={{ fontSize: '10px', color: '#444', letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace', margin: '0 0 8px' }}>
        {label}
      </p>
      <p style={{ fontSize: '34px', fontWeight: 300, letterSpacing: '-0.03em', margin: 0, lineHeight: 1 }}>
        {value}
      </p>
    </div>
  )
}

function BreakdownTable({
  title, rows, total, labelFn,
}: {
  title: string
  rows: [string, number][]
  total: number
  labelFn?: (l: string) => string
}) {
  return (
    <div style={{
      background: 'rgba(255,255,255,0.02)',
      border: '1px solid rgba(255,255,255,0.07)',
      borderRadius: '12px',
      overflow: 'hidden',
    }}>
      <div style={{ padding: '16px 18px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <p style={{ fontSize: '10px', color: '#444', letterSpacing: '0.12em', textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace', margin: 0 }}>
          {title}
        </p>
      </div>
      <div style={{ padding: '6px 0' }}>
        {rows.length === 0 && (
          <p style={{ padding: '16px 18px', color: '#444', fontSize: '12px', fontFamily: 'ui-monospace, monospace' }}>No data yet.</p>
        )}
        {rows.map(([label, count]) => {
          const pct = total > 0 ? (count / total) * 100 : 0
          const display = labelFn ? labelFn(label) : label
          return (
            <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 18px' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '12px', color: '#ccc', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: 'ui-monospace, monospace' }}>
                  {display}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                <div style={{ width: '56px', height: '2px', background: 'rgba(255,255,255,0.07)', borderRadius: '99px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: 'rgba(255,255,255,0.38)', borderRadius: '99px' }} />
                </div>
                <span style={{ fontSize: '11px', color: '#555', fontFamily: 'ui-monospace, monospace', minWidth: '20px', textAlign: 'right' }}>{count}</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
