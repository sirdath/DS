import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { PROJECTS } from './projects'
import ProjectCard from './ProjectCard'

export const dynamic = 'force-dynamic'

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
      if (error) {
        fetchError = error.message
      } else if (data) {
        allVisits = data as VisitRow[]
      }
    } catch (err) {
      fetchError = err instanceof Error ? err.message : 'Unknown fetch error.'
    }
  }

  const week = sevenDaysAgo()

  const projectStats = PROJECTS.map(project => {
    const visits = allVisits.filter(v =>
      v.path?.startsWith(project.pathPrefix),
    )
    const weekVisits = visits.filter(v => v.created_at > week)
    const uniqueVisitors = new Set(
      visits.map(v => v.visitor_id).filter(Boolean),
    ).size
    const countryCounts = visits.reduce<Record<string, number>>((acc, v) => {
      const k = v.country ?? 'Unknown'
      acc[k] = (acc[k] ?? 0) + 1
      return acc
    }, {})
    const topCountry = Object.entries(countryCounts).sort((a, b) => b[1] - a[1])[0]

    return {
      project,
      total: visits.length,
      weekCount: weekVisits.length,
      uniqueVisitors,
      topCountry: topCountry?.[0] ?? null,
      lastVisit: visits[0]?.created_at ?? null,
    }
  })

  return (
    <main style={{
      minHeight: '100vh',
      background: '#0a0a0a',
      color: '#f5f5f5',
      padding: '52px 36px',
      fontFamily: 'var(--font-inter), ui-sans-serif, sans-serif',
    }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        <div style={{ marginBottom: '52px' }}>
          <p style={{ fontSize: '11px', color: '#444', letterSpacing: '0.22em', textTransform: 'uppercase', fontFamily: 'ui-monospace, monospace', marginBottom: '10px' }}>
            DS2 · Analytics
          </p>
          <h1 style={{ fontSize: '32px', fontWeight: 300, letterSpacing: '-0.025em', margin: 0 }}>
            Client projects
          </h1>
          <p style={{ marginTop: '8px', fontSize: '14px', color: '#555', lineHeight: 1.5 }}>
            {PROJECTS.length} active {PROJECTS.length === 1 ? 'project' : 'projects'} · click any card for deeper insights
          </p>
        </div>

        {fetchError && (
          <div style={{
            marginBottom: '32px',
            padding: '18px 22px',
            border: '1px solid rgba(255,170,80,0.32)',
            background: 'rgba(255,170,80,0.06)',
            borderRadius: '10px',
            color: '#e8b46a',
            fontSize: '13px',
            lineHeight: 1.55,
            fontFamily: 'ui-monospace, monospace',
          }}>
            <strong style={{ color: '#f5c98a' }}>Analytics data unavailable.</strong>{' '}
            {fetchError} The page is rendering with empty stats — check Vercel project env vars.
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '14px' }}>
          {projectStats.map(({ project, total, weekCount, uniqueVisitors, topCountry, lastVisit }) => (
            <ProjectCard
              key={project.slug}
              slug={project.slug}
              name={project.name}
              url={project.url}
              description={project.description}
              total={total}
              weekCount={weekCount}
              uniqueVisitors={uniqueVisitors}
              topCountry={topCountry}
              lastVisit={lastVisit}
            />
          ))}
        </div>

      </div>
    </main>
  )
}
