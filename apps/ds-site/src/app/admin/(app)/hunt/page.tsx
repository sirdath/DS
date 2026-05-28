import Link from 'next/link'
import { getSupabaseServerClient } from '@/app/admin/lib/supabase-server'
import { rowToTarget, VISION_TIERS, TIER_LABEL, type RedesignTarget, type VisionTier } from '@/app/admin/lib/leads-types'
import { HuntGrid } from '@/app/admin/hunt-grid'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function pick(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key]
  return typeof v === 'string' && v ? v : undefined
}

export default async function HuntPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const industry = pick(sp, 'industry')
  const area = pick(sp, 'area')
  const tier = pick(sp, 'tier')
  const contacted = pick(sp, 'contacted')
  const PAGE_SIZE = 48
  const page = Math.max(1, Number(pick(sp, 'page') ?? 1) || 1)

  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  let targets: RedesignTarget[] = []
  let total = 0
  let industries: string[] = []
  const tierCounts: Record<string, number> = {}
  let pending = 0
  let loadError: string | null = null

  if (hasSupabase) {
    try {
      const supabase = await getSupabaseServerClient()
      let q = supabase
        .from('redesign_targets')
        .select('*', { count: 'exact' })
        .order('vision_score', { ascending: false, nullsFirst: false })
        .order('heuristic_score', { ascending: false, nullsFirst: false })
      if (industry) q = q.eq('industry', industry)
      if (area) q = q.eq('area', area)
      if (tier) q = q.eq('vision_tier', tier)
      if (contacted === 'no') q = q.eq('contacted', false)
      if (contacted === 'yes') q = q.eq('contacted', true)
      q = q.range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1)

      const [res, indRes, pendRes, ...tierRes] = await Promise.all([
        q,
        supabase.from('redesign_targets').select('industry').limit(20000),
        supabase.from('redesign_targets').select('id', { count: 'exact', head: true }).eq('vision_status', 'pending'),
        ...VISION_TIERS.map((t) =>
          supabase.from('redesign_targets').select('id', { count: 'exact', head: true }).eq('vision_tier', t),
        ),
      ])
      if (res.error) throw new Error(res.error.message)
      targets = (res.data ?? []).map((r) => rowToTarget(r as Record<string, unknown>))
      total = res.count ?? targets.length
      industries = [...new Set((indRes.data ?? []).map((r) => String((r as { industry: string }).industry)))].sort()
      pending = pendRes.count ?? 0
      VISION_TIERS.forEach((t, i) => { tierCounts[t] = tierRes[i]?.count ?? 0 })
    } catch (err) {
      loadError = err instanceof Error ? err.message : 'Failed to load'
    }
  }

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE))
  const href = (params: Record<string, string | undefined>) => {
    const merged: Record<string, string | undefined> = { industry, area, tier, contacted, page: undefined, ...params }
    const qs = Object.entries(merged).filter(([, v]) => v).map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`).join('&')
    return `/admin/hunt${qs ? `?${qs}` : ''}`
  }
  const shotBase = `${process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''}/storage/v1/object/public/redesign-shots`

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <p className="admin-page-eyebrow">DS2 · Hunt</p>
        <h1 className="admin-page-title">Ugly-site hunt</h1>
        <p className="admin-page-sub">{total.toLocaleString()} targets{pending > 0 && ` · ${pending} awaiting visual score`}</p>
      </div>

      {!hasSupabase && <p className="admin-leads-note">Supabase isn’t configured here.</p>}
      {loadError && <p className="admin-leads-note admin-leads-note--err">Couldn’t load: {loadError}. Has the redesign_targets migration been applied?</p>}

      {/* Scoreboard */}
      <div className="admin-hunt-scoreboard">
        {VISION_TIERS.map((t) => (
          <Link key={t} href={href({ tier: tier === t ? undefined : t })} className={`admin-hunt-tile is-${t}${tier === t ? ' on' : ''}`}>
            <span className="admin-hunt-tile__n">{tierCounts[t] ?? 0}</span>
            <span className="admin-hunt-tile__l">{TIER_LABEL[t as VisionTier]}</span>
          </Link>
        ))}
      </div>

      <div className="admin-filters">
        <Link href={href({ industry: undefined })} className={`admin-filter-link${!industry ? ' is-active' : ''}`}>All</Link>
        {industries.slice(0, 16).map((i) => (
          <Link key={i} href={href({ industry: i })} className={`admin-filter-link${industry === i ? ' is-active' : ''}`}>{i}</Link>
        ))}
        <span className="admin-filter-sep" />
        <Link href={href({ contacted: contacted === 'no' ? undefined : 'no' })} className={`admin-filter-link${contacted === 'no' ? ' is-active' : ''}`}>Not contacted</Link>
        {(industry || area || tier || contacted) && <Link href="/admin/hunt" className="admin-filter-link">Clear</Link>}
      </div>

      {targets.length === 0 ? (
        <p style={{ color: 'var(--admin-text-muted)', fontSize: 14, padding: '20px 0' }}>
          No targets yet. Run the hunt pipeline (gyms/restaurants first, then lawyers) to populate this.
        </p>
      ) : (
        <>
          <div className="admin-leads-pagebar">
            <span>Showing {((page - 1) * PAGE_SIZE + 1).toLocaleString()}–{Math.min(page * PAGE_SIZE, total).toLocaleString()} of {total.toLocaleString()}</span>
            <span className="admin-leads-pagenav">
              {page > 1 ? <Link href={href({ page: String(page - 1) })} className="admin-filter-link">← Prev</Link> : <span className="admin-filter-link is-disabled">← Prev</span>}
              <span className="dim">page {page} / {pageCount}</span>
              {page < pageCount ? <Link href={href({ page: String(page + 1) })} className="admin-filter-link">Next →</Link> : <span className="admin-filter-link is-disabled">Next →</span>}
            </span>
          </div>
          <HuntGrid targets={targets} shotBase={shotBase} />
        </>
      )}
    </div>
  )
}
