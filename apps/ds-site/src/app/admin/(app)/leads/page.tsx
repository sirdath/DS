import Link from 'next/link'
import { getSupabaseServerClient } from '@/app/admin/lib/supabase-server'
import { rowToLead, type MarketingLead } from '@/app/admin/lib/leads-types'
import { LeadsTable } from '@/app/admin/leads-table'
import { RunAreaPanel } from '@/app/admin/run-area-panel'
import { PasteLeadsPanel } from '@/app/admin/paste-leads-panel'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

interface AreaRow {
  area_label: string
  status: string
  lead_count: number
  run_at: string
}

const PRIORITIES = ['High', 'Medium', 'Low'] as const

function pick(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key]
  return typeof v === 'string' && v ? v : undefined
}

export default async function LeadsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const priority = pick(sp, 'priority')
  const status = pick(sp, 'status')
  const contacted = pick(sp, 'contacted') // 'yes' | 'no'
  const nosite = pick(sp, 'nosite') === '1'
  const search = pick(sp, 'q')

  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let leads: MarketingLead[] = []
  let areas: AreaRow[] = []
  let pendingCount = 0
  let loadError: string | null = null

  if (hasSupabase) {
    try {
      const supabase = await getSupabaseServerClient()
      let query = supabase.from('marketing_leads').select('*').order('lead_score', { ascending: false }).limit(600)
      if (priority) query = query.eq('priority', priority)
      if (status) query = query.eq('status', status)
      if (contacted === 'yes') query = query.eq('contacted', true)
      if (contacted === 'no') query = query.eq('contacted', false)
      if (nosite) query = query.eq('has_website', false)
      if (search) query = query.ilike('name', `%${search}%`)

      const [{ data, error }, areasRes, pend] = await Promise.all([
        query,
        supabase.from('lead_areas').select('area_label, status, lead_count, run_at').order('run_at', { ascending: false }),
        supabase.from('marketing_leads').select('id', { count: 'exact', head: true }).eq('analysis_status', 'pending').not('website', 'is', null),
      ])
      if (error) throw new Error(error.message)
      leads = (data ?? []).map((r) => rowToLead(r as Record<string, unknown>))
      areas = (areasRes.data ?? []) as AreaRow[]
      pendingCount = pend.count ?? 0
    } catch (err) {
      loadError = err instanceof Error ? err.message : 'Failed to load leads'
    }
  }

  const totals = {
    all: leads.length,
    high: leads.filter((l) => l.priority === 'High').length,
    noSite: leads.filter((l) => !l.hasWebsite).length,
    contacted: leads.filter((l) => l.contacted).length,
  }

  const filterHref = (params: Record<string, string | undefined>) => {
    const merged = { priority, status, contacted, nosite: nosite ? '1' : undefined, q: search, ...params }
    const qs = Object.entries(merged).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&')
    return `/admin/leads${qs ? `?${qs}` : ''}`
  }

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <p className="admin-page-eyebrow">DS2 · Leads</p>
        <h1 className="admin-page-title">Leads</h1>
        <p className="admin-page-sub">
          {totals.all} shown · {totals.high} high · {totals.noSite} no-website · {totals.contacted} contacted
        </p>
      </div>

      {!hasSupabase && (
        <p className="admin-leads-note">Supabase isn’t configured in this environment — leads are read-only/empty here.</p>
      )}
      {loadError && <p className="admin-leads-note admin-leads-note--err">Couldn’t load leads: {loadError}. Has the migration been applied?</p>}

      <div className="admin-leads-panels">
        <RunAreaPanel pendingCount={pendingCount} areas={areas} />
        <PasteLeadsPanel />
      </div>

      <div className="admin-section">
        <div className="admin-section__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <p className="admin-section__eyebrow">Pipeline</p>
            <h2 className="admin-section__title">All leads<span className="admin-section__count">{totals.all}</span></h2>
          </div>
          <a href="/api/admin/leads/export" className="admin-repo-link" style={{ flexShrink: 0 }}>Export Excel &#8594;</a>
        </div>

        <div className="admin-filters">
          <Link href={filterHref({ priority: undefined })} className={`admin-filter-link${!priority ? ' is-active' : ''}`}>All priorities</Link>
          {PRIORITIES.map((p) => (
            <Link key={p} href={filterHref({ priority: p })} className={`admin-filter-link${priority === p ? ' is-active' : ''}`}>{p}</Link>
          ))}
          <span className="admin-filter-sep" />
          <Link href={filterHref({ nosite: nosite ? undefined : '1' })} className={`admin-filter-link${nosite ? ' is-active' : ''}`}>No website</Link>
          <Link href={filterHref({ contacted: contacted === 'no' ? undefined : 'no' })} className={`admin-filter-link${contacted === 'no' ? ' is-active' : ''}`}>Not contacted</Link>
          <Link href={filterHref({ contacted: contacted === 'yes' ? undefined : 'yes' })} className={`admin-filter-link${contacted === 'yes' ? ' is-active' : ''}`}>Contacted</Link>
        </div>

        <form className="admin-leads-search" action="/admin/leads" method="get">
          {priority && <input type="hidden" name="priority" value={priority} />}
          {nosite && <input type="hidden" name="nosite" value="1" />}
          <input type="search" name="q" defaultValue={search ?? ''} placeholder="Search business name…" className="admin-form__input" />
          <button type="submit" className="admin-new-btn">Search</button>
        </form>

        {leads.length === 0 ? (
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 14, padding: '20px 0' }}>
            No leads yet. Run the finder for an area above, or paste some in.
          </p>
        ) : (
          <LeadsTable leads={leads} />
        )}
      </div>
    </div>
  )
}
