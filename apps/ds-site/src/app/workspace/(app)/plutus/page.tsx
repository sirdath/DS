import { formatMoney, getSample, InMemorySource, runDailyCycle, SAMPLE_TODAY, type AgeingBucket } from '@ds/plutus'
import Link from 'next/link'
import { ApprovalQueue, type QueueVM } from './approval-queue'
import { DEMO_DRAFTS } from './demo-drafts'
import './plutus.css'

const BUCKETS: AgeingBucket[] = ['current', '1-30', '31-60', '61-90', '90+']
const BAND_CLASS: Record<string, string> = { low: 'is-low', medium: 'is-medium', high: 'is-high', severe: 'is-severe' }

export default async function PlutusWorkspacePage() {
  const t = getSample()
  const source = new InMemorySource({ customers: t.customers, invoices: t.invoices, payments: t.payments })
  // Computed live from the engine, scan-only — no key needed.
  const result = await runDailyCycle({
    tenantId: t.tenantId,
    business: t.business,
    source,
    sequences: t.sequences,
    today: SAMPLE_TODAY,
    scanOnly: true,
  })
  const { snapshot, priority, queue } = result
  const cur = snapshot.currency
  const k = snapshot.kpis
  const nameById = new Map(t.customers.map((c) => [c.id, c.name]))

  const queueVM: QueueVM[] = queue.map((q) => {
    const f = q.step.facts
    const draft = DEMO_DRAFTS[q.step.invoiceId]
    return {
      invoiceId: q.step.invoiceId,
      customerName: f.customerName,
      invoiceNumber: f.invoiceNumber,
      amount: formatMoney(f.amountDue, f.currency),
      daysOverdue: f.daysOverdue,
      tone: f.tone,
      subject: draft?.subject ?? '',
      body: draft?.body ?? '',
    }
  })

  return (
    <>
      <Link href="/workspace" className="ws-back">
        ← All tools
      </Link>

      <div className="ws-head">
        <span className="ws-head__eyebrow">Plutus · Collections</span>
        <h1 className="ws-head__title">Get paid faster</h1>
        <p className="ws-head__sub">
          Plutus reads your receivables, predicts which invoices will pay late, ranks who to chase first, and drafts
          the reminder in Greek or English — you approve every send.
        </p>
      </div>

      <div className="ws-demo-banner">
        <span className="ws-demo-banner__tag">Example</span>
        <span className="ws-demo-banner__text">
          A demo business&rsquo;s receivables — computed live by the engine. Connect a client&rsquo;s invoices to make
          it real.
        </span>
      </div>

      {/* KPIs */}
      <div className="wp-kpis">
        <div className="wp-kpi wp-kpi--lead">
          <span className="wp-kpi__label">Cash to collect</span>
          <span className="wp-kpi__value">{formatMoney(k.totalAr, cur)}</span>
          <span className="wp-kpi__sub">
            {formatMoney(k.pastDueAr, cur)} overdue ({Math.round(k.pastDuePct * 100)}%)
          </span>
        </div>
        <div className="wp-kpi">
          <span className="wp-kpi__label">DSO</span>
          <span className="wp-kpi__value">{k.dso}</span>
          <span className="wp-kpi__sub">best possible {k.bestPossibleDso}</span>
        </div>
        <div className="wp-kpi">
          <span className="wp-kpi__label">Avg days to pay</span>
          <span className="wp-kpi__value">{k.avgDaysToPay}</span>
          <span className="wp-kpi__sub">{k.averageDaysDelinquent} days delinquent</span>
        </div>
      </div>

      <section className="wp-card">
        <h3 className="wp-h3">Ageing</h3>
        <div className="wp-ageing">
          {BUCKETS.map((b) => (
            <div className="wp-age-row" key={b}>
              <span className="wp-age-label">{b}</span>
              <span className="wp-age-track">
                <span className="wp-age-fill" style={{ width: `${Math.round(k.bucketPct[b] * 100)}%` }} />
              </span>
              <span className="wp-age-val">{formatMoney(k.buckets[b], cur)}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Chase list */}
      <section className="wp-card">
        <h3 className="wp-h3">Chase list — who to chase first</h3>
        <div className="wp-table-wrap">
          <table className="wp-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Risk</th>
                <th className="wp-num">Exposure</th>
                <th className="wp-num">Overdue</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              {priority.map((p) => {
                const why = p.risk.contributions
                  .filter((c) => c.contribution > 0)
                  .slice(0, 2)
                  .map((c) => c.explanation)
                  .join('; ')
                return (
                  <tr key={p.customerId}>
                    <td>{p.rank}</td>
                    <td translate="no">{nameById.get(p.customerId) ?? p.customerId}</td>
                    <td>
                      <span className={`wp-band ${BAND_CLASS[p.risk.band] ?? ''}`}>
                        {p.risk.band} {p.risk.score}
                      </span>
                      {p.risk.lowConfidence ? <span className="wp-lc" title="thin history — low confidence">·?</span> : null}
                    </td>
                    <td className="wp-num">{formatMoney(p.exposure, cur)}</td>
                    <td className="wp-num">{p.oldestDaysOverdue}d</td>
                    <td className="wp-why">{why || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Approval queue */}
      <section className="wp-card">
        <h3 className="wp-h3">Approval queue — {queueVM.length} to review</h3>
        <ApprovalQueue items={queueVM} />
      </section>
    </>
  )
}
