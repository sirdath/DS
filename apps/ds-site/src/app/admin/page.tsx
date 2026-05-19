import Link from 'next/link'
import { getDataSource } from './lib/get-data-source'
import { portfolioTotals, splitProjects } from './lib/derive'
import { PROJECT_STATUSES, STATUS_LABELS } from './types'
import type { ProjectStatus } from './types'
import { ProjectGrid } from './project-grid'
import { LeadGrid } from './lead-grid'
import { CountUp } from './count-up'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const rawStatus = typeof sp['status'] === 'string' ? sp['status'] : undefined
  const activeStatus: ProjectStatus | undefined =
    rawStatus !== undefined && (PROJECT_STATUSES as readonly string[]).includes(rawStatus)
      ? (rawStatus as ProjectStatus)
      : undefined

  const ds = getDataSource()
  const all = await ds.listProjects()
  const { leads, active } = splitProjects(all)
  const totals = portfolioTotals(active)

  // Pipeline stats: open leads count + summed estimatedValue
  const openLeadCount = leads.length
  const pipelineValue = leads.reduce((sum, p) => sum + (p.estimatedValue ?? 0), 0)

  const filteredActive = activeStatus
    ? active.filter((p) => p.status === activeStatus)
    : active

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <p className="admin-page-eyebrow">DS2 · Projects</p>
        <h1 className="admin-page-title">Portfolio</h1>
        <p className="admin-page-sub">
          {active.length} {active.length === 1 ? 'project' : 'projects'} active
          {leads.length > 0 && ` · ${leads.length} in pipeline`}
        </p>
      </div>

      {/* ── Totals bar — reflects real book (active only) ── */}
      <div className="admin-totals">
        <MoneyCell label="Contract value" value={totals.totalContractValue} />
        <MoneyCell label="Collected" value={totals.totalCollected} />
        <MoneyCell label="Outstanding" value={totals.totalOutstanding} />
        {totals.monthlyRecurringRevenue > 0 ? (
          <MoneyCell label="MRR / mo" value={totals.monthlyRecurringRevenue} />
        ) : (
          <TotalCell label="MRR / mo" value="—" />
        )}
        {/* Pipeline mini-stat */}
        <div className="admin-total admin-total--pipeline">
          <span className="admin-total__label">Pipeline leads</span>
          <span className="admin-total__value">{openLeadCount}</span>
          {pipelineValue > 0 && (
            <span className="admin-total__sub">
              <CountUp prefix="€" value={pipelineValue} /> est.
            </span>
          )}
        </div>
        {PROJECT_STATUSES.map((s) => (
          <TotalCell
            key={s}
            label={STATUS_LABELS[s]}
            value={String(totals.countByStatus[s])}
            sub="projects"
          />
        ))}
      </div>

      {/* ── Section: Potential Leads ── */}
      <div className="admin-section">
        <div className="admin-section__header">
          <p className="admin-section__eyebrow">Outreach pipeline</p>
          <h2 className="admin-section__title">
            Potential Leads
            <span className="admin-section__count">{leads.length}</span>
          </h2>
        </div>
        <LeadGrid leads={leads} />
      </div>

      {/* ── Section: Active Projects ── */}
      <div className="admin-section">
        <div className="admin-section__header">
          <p className="admin-section__eyebrow">Active book</p>
          <h2 className="admin-section__title">
            Active Projects
            <span className="admin-section__count">{active.length}</span>
          </h2>
        </div>

        {/* Status filter applies to active only */}
        <div className="admin-filters">
          <Link
            href="/admin"
            className={`admin-filter-link${!activeStatus ? ' is-active' : ''}`}
          >
            All
          </Link>
          {PROJECT_STATUSES.map((s) => (
            <Link
              key={s}
              href={`/admin?status=${s}`}
              className={`admin-filter-link${activeStatus === s ? ' is-active' : ''}`}
            >
              {STATUS_LABELS[s]}
            </Link>
          ))}
        </div>

        {filteredActive.length === 0 ? (
          <p style={{ color: 'var(--admin-text-muted)', fontSize: '14px', padding: '20px 0' }}>
            No active projects.
          </p>
        ) : (
          <ProjectGrid projects={filteredActive} />
        )}
      </div>
    </div>
  )
}

function TotalCell({
  label,
  value,
  sub,
}: {
  label: string
  value: string
  sub?: string
}) {
  return (
    <div className="admin-total">
      <span className="admin-total__label">{label}</span>
      <span className="admin-total__value">{value}</span>
      {sub && <span className="admin-total__sub">{sub}</span>}
    </div>
  )
}

function MoneyCell({ label, value }: { label: string; value: number }) {
  return (
    <div className="admin-total">
      <span className="admin-total__label">{label}</span>
      <span className="admin-total__value">
        <CountUp value={value} prefix="€" />
      </span>
    </div>
  )
}
