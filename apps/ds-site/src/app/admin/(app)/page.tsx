import Link from 'next/link'
import { getDataSource } from '@/app/admin/lib/get-data-source'
import { portfolioTotals, partitionProjects } from '@/app/admin/lib/derive'
import { PROJECT_STATUSES, STATUS_LABELS } from '@/app/admin/types'
import { CountUp } from '@/app/admin/count-up'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  const ds = getDataSource()
  const all = await ds.listProjects()
  const { leads, active } = partitionProjects(all)
  const totals = portfolioTotals(active)

  const pipelineValue = leads.reduce((sum, p) => sum + (p.estimatedValue ?? 0), 0)
  const collectionRate =
    totals.totalContractValue > 0
      ? Math.round((totals.totalCollected / totals.totalContractValue) * 100)
      : 0
  const collectedPct = Math.min(100, Math.max(0, collectionRate))

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <p className="admin-page-eyebrow">DS2 · Admin</p>
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-sub">The book at a glance — money in, money owed, recurring.</p>
      </div>

      {/* ── Money tiles (active book) ── */}
      <div className="admin-totals">
        <MoneyCell label="Contract value" value={totals.totalContractValue} />
        <MoneyCell label="Collected" value={totals.totalCollected} />
        <MoneyCell label="Outstanding" value={totals.totalOutstanding} />
        {totals.monthlyRecurringRevenue > 0 ? (
          <MoneyCell label="MRR / mo" value={totals.monthlyRecurringRevenue} />
        ) : (
          <TotalCell label="MRR / mo" value="—" />
        )}
        <div className="admin-total admin-total--pipeline">
          <span className="admin-total__label">Pipeline value</span>
          <span className="admin-total__value">
            {pipelineValue > 0 ? <CountUp prefix="€" value={pipelineValue} /> : '—'}
          </span>
          <span className="admin-total__sub">{leads.length} open lead{leads.length === 1 ? '' : 's'}</span>
        </div>
      </div>

      {/* ── Collected vs outstanding ── */}
      <div className="admin-dash-bar">
        <div className="admin-dash-bar__head">
          <span className="admin-dash-bar__label">Collected vs outstanding</span>
          <span className="admin-dash-bar__pct">{collectionRate}% collected</span>
        </div>
        <div className="admin-dash-bar__track" role="img" aria-label={`${collectionRate}% of contract value collected`}>
          <div className="admin-dash-bar__fill" style={{ width: `${collectedPct}%` }} />
        </div>
        <div className="admin-dash-bar__legend">
          <span><i className="admin-dash-dot admin-dash-dot--collected" /> Collected €{totals.totalCollected.toLocaleString()}</span>
          <span><i className="admin-dash-dot admin-dash-dot--outstanding" /> Outstanding €{totals.totalOutstanding.toLocaleString()}</span>
        </div>
      </div>

      {/* ── Status distribution ── */}
      <div className="admin-totals admin-totals--counts">
        {PROJECT_STATUSES.map((s) => (
          <TotalCell key={s} label={STATUS_LABELS[s]} value={String(totals.countByStatus[s])} sub="projects" />
        ))}
      </div>

      <div className="admin-dash-cta">
        <Link href="/admin/projects" className="admin-new-btn">View all projects →</Link>
      </div>
    </div>
  )
}

function TotalCell({ label, value, sub }: { label: string; value: string; sub?: string }) {
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
