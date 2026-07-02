import Link from 'next/link'
import { getSupabaseServerClient } from '@/app/admin/lib/supabase-server'
import { rowToLead, LEAD_STATUSES, LEAD_STATUS_LABELS, type MarketingLead } from '@/app/admin/lib/leads-types'
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
  const category = pick(sp, 'category')
  const area = pick(sp, 'area')
  const analysis = pick(sp, 'analysis') // 'pending' | 'done'

  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  const PAGE_SIZE = 50
  const page = Math.max(1, Number(pick(sp, 'page') ?? 1) || 1)

  let leads: MarketingLead[] = []
  let areas: AreaRow[] = []
  let categories: string[] = []
  let pendingCount = 0
  let total = 0
  let loadError: string | null = null

  if (hasSupabase) {
    try {
      const supabase = await getSupabaseServerClient()
      let query = supabase
        .from('marketing_leads')
        .select('*', { count: 'exact' })
        .order('lead_score', { ascending: false })
        .order('created_at', { ascending: false })
      if (priority) query = query.eq('priority', priority)
      if (status) query = query.eq('status', status)
      if (contacted === 'yes') query = query.eq('contacted', true)
      if (contacted === 'no') query = query.eq('contacted', false)
      if (nosite) query = query.eq('has_website', false)
      if (category) query = query.eq('category', category)
      if (area) query = query.eq('area', area)
      if (analysis === 'pending') query = query.eq('analysis_status', 'pending')
      if (analysis === 'done') query = query.eq('analysis_status', 'done')
      if (search) query = query.ilike('name', `%${search}%`)
      query = query.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      const [leadsRes, areasRes, pend, catsRes] = await Promise.all([
        query,
        supabase.from('lead_areas').select('area_label, status, lead_count, run_at').order('run_at', { ascending: false }),
        supabase.from('marketing_leads').select('id', { count: 'exact', head: true }).eq('analysis_status', 'pending').not('website', 'is', null),
        supabase.from('marketing_leads').select('category').not('category', 'is', null).limit(2000),
      ])
      if (leadsRes.error) throw new Error(leadsRes.error.message)
      leads = (leadsRes.data ?? []).map((r) => rowToLead(r as Record<string, unknown>))
      total = leadsRes.count ?? leads.length
      areas = (areasRes.data ?? []) as AreaRow[]
      pendingCount = pend.count ?? 0
      categories = [...new Set((catsRes.data ?? []).map((r) => String((r as { category: string }).category)).filter(Boolean))].sort()
    } catch (err) {
      loadError = err instanceof Error ? err.message : 'Failed to load leads'
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const firstRow = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1
  const lastRow = Math.min(page * PAGE_SIZE, total)

  const filterHref = (params: Record<string, string | undefined>) => {
    const merged: Record<string, string | undefined> = {
      priority, status, contacted, nosite: nosite ? '1' : undefined, q: search,
      category, area, analysis, page: undefined, ...params,
    }
    const qs = Object.entries(merged).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&')
    return `/admin/funnel/leads${qs ? `?${qs}` : ''}`
  }
  const pageHref = (p: number) => filterHref({ page: String(p) })
  const hasFilters = Boolean(priority || status || contacted || nosite || search || category || area || analysis)

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <p className="admin-page-eyebrow">DS2 · Leads</p>
        <h1 className="admin-page-title">Leads</h1>
        <p className="admin-page-sub">
          {total.toLocaleString()} leads{pendingCount > 0 && ` · ${pendingCount} awaiting analysis`}
        </p>
      </div>

      {!hasSupabase && (
        <p className="admin-leads-note">Supabase isn’t configured in this environment, leads are read-only/empty here.</p>
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
            <h2 className="admin-section__title">All leads<span className="admin-section__count">{total}</span></h2>
          </div>
          <a href="/api/admin/leads/export" className="admin-repo-link" style={{ flexShrink: 0 }}>Export Excel &#8594;</a>
        </div>

        <form className="admin-leads-filters" action="/admin/funnel/leads" method="get">
          <input type="search" name="q" defaultValue={search ?? ''} placeholder="Search name…" className="admin-form__input admin-leads-filter--search" />
          <select name="priority" defaultValue={priority ?? ''} className="admin-leads-select">
            <option value="">Any priority</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
          <select name="category" defaultValue={category ?? ''} className="admin-leads-select">
            <option value="">Any category</option>
            {categories.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select name="area" defaultValue={area ?? ''} className="admin-leads-select">
            <option value="">Any area</option>
            {areas.map((a) => <option key={a.area_label} value={a.area_label}>{a.area_label}</option>)}
          </select>
          <select name="status" defaultValue={status ?? ''} className="admin-leads-select">
            <option value="">Any status</option>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
          </select>
          <select name="contacted" defaultValue={contacted ?? ''} className="admin-leads-select">
            <option value="">Contacted: any</option>
            <option value="no">Not contacted</option>
            <option value="yes">Contacted</option>
          </select>
          <select name="nosite" defaultValue={nosite ? '1' : ''} className="admin-leads-select">
            <option value="">Site: any</option>
            <option value="1">No website</option>
          </select>
          <select name="analysis" defaultValue={analysis ?? ''} className="admin-leads-select">
            <option value="">Analysis: any</option>
            <option value="pending">Pending</option>
            <option value="done">Analysed</option>
          </select>
          <button type="submit" className="admin-new-btn">Apply</button>
          {hasFilters && <Link href="/admin/funnel/leads" className="admin-filter-link">Clear</Link>}
        </form>

        {leads.length === 0 ? (
          <p style={{ color: 'var(--admin-text-muted)', fontSize: 14, padding: '20px 0' }}>
            {total === 0 && !search && !priority && !nosite && !contacted
              ? 'No leads yet. Run the finder for an area above, or paste some in.'
              : 'No leads match these filters.'}
          </p>
        ) : (
          <>
            <div className="admin-leads-pagebar">
              <span>Showing {firstRow.toLocaleString()}–{lastRow.toLocaleString()} of {total.toLocaleString()}</span>
              <span className="admin-leads-pagenav">
                {page > 1
                  ? <Link href={pageHref(page - 1)} className="admin-filter-link" aria-label="Previous page">← Prev</Link>
                  : <span className="admin-filter-link is-disabled">← Prev</span>}
                <span className="dim">page {page} / {pageCount}</span>
                {page < pageCount
                  ? <Link href={pageHref(page + 1)} className="admin-filter-link" aria-label="Next page">Next →</Link>
                  : <span className="admin-filter-link is-disabled">Next →</span>}
              </span>
            </div>
            <LeadsTable leads={leads} />
          </>
        )}
      </div>
    </div>
  )
}
