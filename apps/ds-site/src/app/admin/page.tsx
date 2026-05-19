import Link from 'next/link'
import { getDataSource } from './lib/get-data-source'
import { portfolioTotals } from './lib/derive'
import { PROJECT_STATUSES, STATUS_LABELS } from './types'
import type { ProjectStatus } from './types'
import { ProjectGrid } from './project-grid'
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
  const projects = await ds.listProjects()
  const totals = portfolioTotals(projects)

  const filtered = activeStatus
    ? projects.filter((p) => p.status === activeStatus)
    : projects

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <p className="admin-page-eyebrow">DS2 · Projects</p>
        <h1 className="admin-page-title">Portfolio</h1>
        <p className="admin-page-sub">
          {projects.length} {projects.length === 1 ? 'project' : 'projects'}
        </p>
      </div>

      <div className="admin-totals">
        <MoneyCell label="Contract value" value={totals.totalContractValue} />
        <MoneyCell label="Collected" value={totals.totalCollected} />
        <MoneyCell label="Outstanding" value={totals.totalOutstanding} />
        {totals.monthlyRecurringRevenue > 0 ? (
          <MoneyCell label="MRR" value={totals.monthlyRecurringRevenue} />
        ) : (
          <TotalCell label="MRR" value="—" />
        )}
        {PROJECT_STATUSES.map((s) => (
          <TotalCell
            key={s}
            label={STATUS_LABELS[s]}
            value={String(totals.countByStatus[s])}
            sub="projects"
          />
        ))}
      </div>

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

      <ProjectGrid projects={filtered} />
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
