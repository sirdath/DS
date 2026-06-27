import Link from 'next/link'
import { getDataSource } from '@/app/admin/lib/get-data-source'
import { portfolioTotals, partitionProjects } from '@/app/admin/lib/derive'
import { getAdminDisplayName } from '@/app/admin/lib/get-admin-display-name'
import { CountUp } from '@/app/admin/count-up'

export const dynamic = 'force-dynamic'

const fmt = (n: number) => '€' + n.toLocaleString('en-GB')

const SEARCH_ICON = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></svg>
)

export default async function DashboardPage() {
  const ds = getDataSource()
  const [all, name] = await Promise.all([ds.listProjects(), getAdminDisplayName()])
  const { leads, active } = partitionProjects(all)
  const totals = portfolioTotals(active)

  const pipelineValue = leads.reduce((sum, p) => sum + (p.estimatedValue ?? 0), 0)
  const collectionRate =
    totals.totalContractValue > 0 ? Math.round((totals.totalCollected / totals.totalContractValue) * 100) : 0

  const topLeads = [...leads].sort((a, b) => (b.estimatedValue ?? 0) - (a.estimatedValue ?? 0)).slice(0, 5)
  const maxLead = Math.max(1, ...topLeads.map((l) => l.estimatedValue ?? 0))

  // Collection ring geometry (r=74 in a 168 box).
  const R = 74
  const C = 2 * Math.PI * R
  const offset = C * (1 - Math.min(100, Math.max(0, collectionRate)) / 100)

  return (
    <div className="ds2-dash animate-page-in">
      <header className="ds2-head">
        <div className="ds2-head__greet">
          <h1 className="ds2-head__hi">Hi, {name}</h1>
          <p className="ds2-head__sub">Here&rsquo;s the book today — money in, owed, and in the pipeline.</p>
        </div>
        <form className="ds2-search" action="/admin/funnel/leads" method="get">
          {SEARCH_ICON}
          <input type="search" name="q" placeholder="Search leads…" aria-label="Search leads" />
        </form>
        <Link href="/admin/projects" className="ds2-action">+ New project</Link>
      </header>

      <div className="ds2-grid">
        <div className="ds2-col">
          {/* Hero — the active book at a glance */}
          <section className="ds2-card ds2-hero">
            <span className="ds2-hero__blob ds2-hero__blob--ice" />
            <span className="ds2-hero__blob ds2-hero__blob--warm" />
            <div className="ds2-hero__in">
              <span className="ds2-card__eyebrow">The book at a glance</span>
              <div className="ds2-hero__value"><CountUp value={totals.totalContractValue} prefix="€" /></div>
              <span className="ds2-hero__cap">
                Total contract value across {active.length} active project{active.length === 1 ? '' : 's'}
              </span>
              <div className="ds2-hero__stats">
                <div className="ds2-hero__stat"><b>{fmt(totals.totalCollected)}</b><span>Collected</span></div>
                <div className="ds2-hero__stat"><b>{fmt(totals.totalOutstanding)}</b><span>Outstanding</span></div>
                <div className="ds2-hero__stat"><b>{fmt(pipelineValue)}</b><span>Pipeline</span></div>
              </div>
            </div>
          </section>

          {/* Two small stat cards */}
          <div className="ds2-statrow">
            <section className="ds2-card">
              <span className="ds2-card__eyebrow">Pipeline</span>
              <div className="ds2-stat__val">{pipelineValue > 0 ? <CountUp value={pipelineValue} prefix="€" /> : '—'}</div>
              <span className="ds2-stat__sub">{leads.length} open lead{leads.length === 1 ? '' : 's'}</span>
            </section>
            <section className="ds2-card">
              <span className="ds2-card__eyebrow">Recurring</span>
              <div className="ds2-stat__val">
                {totals.monthlyRecurringRevenue > 0 ? <CountUp value={totals.monthlyRecurringRevenue} prefix="€" /> : '—'}
              </div>
              <span className="ds2-stat__sub">per month</span>
            </section>
          </div>
        </div>

        <div className="ds2-col">
          {/* Dark collection ring */}
          <section className="ds2-card ds2-ring-card">
            <span className="ds2-card__eyebrow">Collection</span>
            <div className="ds2-ring">
              <svg width="168" height="168" viewBox="0 0 168 168" role="img" aria-label={`${collectionRate}% of contract value collected`}>
                <circle className="ds2-ring__c-bg" cx="84" cy="84" r={R} fill="none" strokeWidth="12" />
                <circle className="ds2-ring__c-fg" cx="84" cy="84" r={R} fill="none" strokeWidth="12" strokeDasharray={C} strokeDashoffset={offset} />
              </svg>
              <div className="ds2-ring__label">
                <span className="ds2-ring__pct">{collectionRate}%</span>
                <span className="ds2-ring__cap">collected</span>
              </div>
            </div>
            <div className="ds2-ring-legend">
              <span><i style={{ background: 'var(--ds2-ice)' }} />{fmt(totals.totalCollected)}</span>
              <span><i style={{ background: 'rgba(255,255,255,0.14)' }} />{fmt(totals.totalOutstanding)}</span>
            </div>
          </section>

          {/* Top open leads */}
          <section className="ds2-card">
            <div className="ds2-list__head">
              <span className="ds2-list__title">Top open leads</span>
              <Link href="/admin/projects" className="ds2-list__all">View all →</Link>
            </div>
            {topLeads.length === 0 ? (
              <p className="ds2-empty">No open leads yet.</p>
            ) : (
              topLeads.map((l) => (
                <div className="ds2-row" key={l.id}>
                  <span className="ds2-row__name" translate="no">{l.name || 'Untitled'}</span>
                  <span className="ds2-row__val">{l.estimatedValue ? fmt(l.estimatedValue) : '—'}</span>
                  <span className="ds2-row__bar">
                    <span className="ds2-row__fill" style={{ width: `${Math.round(((l.estimatedValue ?? 0) / maxLead) * 100)}%` }} />
                  </span>
                </div>
              ))
            )}
          </section>
        </div>
      </div>
    </div>
  )
}
