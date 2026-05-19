/**
 * project-detail-view.tsx
 * Read-only data sections rendered on the project detail page.
 * Server component.
 */
import type { Project } from './types'
import { formatMoney, formatDate } from './format'
import { outstanding } from './lib/derive'

interface Props {
  project: Project
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="admin-detail__field">
      <span className="admin-detail__field-label">{label}</span>
      <span className="admin-detail__field-value">{children}</span>
    </div>
  )
}

function ExternalLink({ href, label }: { href: string | null; label: string }) {
  if (!href) return <span style={{ color: 'var(--admin-text-dim)' }}>—</span>
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {label} &#8599;
    </a>
  )
}

export function ProjectDetailView({ project: p }: Props) {
  const owed = outstanding(p)

  return (
    <div className="admin-detail__sections">
      {/* Money */}
      <section className="admin-detail__section">
        <h2 className="admin-detail__section-title">Money</h2>
        <div className="admin-detail__grid">
          <Field label="Contract">{formatMoney(p.contractValue)}</Field>
          <Field label="Paid">{formatMoney(p.amountPaid)}</Field>
          <Field label="Outstanding">{formatMoney(owed)}</Field>
          {p.retainerMonthly !== null && (
            <Field label="Retainer / mo">{formatMoney(p.retainerMonthly)}</Field>
          )}
          <Field label="Completion">{p.completionPct}%</Field>
        </div>
      </section>

      {/* Dates */}
      <section className="admin-detail__section">
        <h2 className="admin-detail__section-title">Dates</h2>
        <div className="admin-detail__grid">
          <Field label="Start">{formatDate(p.startDate)}</Field>
          <Field label="Target">{formatDate(p.targetDate)}</Field>
          <Field label="Delivered">{formatDate(p.deliveredDate)}</Field>
        </div>
      </section>

      {/* Links */}
      <section className="admin-detail__section">
        <h2 className="admin-detail__section-title">Links</h2>
        <div className="admin-detail__grid">
          <Field label="Live site">
            <ExternalLink href={p.url || null} label="Open site" />
          </Field>
          <Field label="Current / old site">
            <ExternalLink href={p.currentWebsiteUrl} label="Open old site" />
          </Field>
          <Field label="Proposal / demo">
            <ExternalLink href={p.proposalUrl} label="Open demo" />
          </Field>
          <Field label="Repo">
            <ExternalLink href={p.repoUrl} label="Open repo" />
          </Field>
        </div>
      </section>

      {/* Client contact */}
      <section className="admin-detail__section">
        <h2 className="admin-detail__section-title">Client contact</h2>
        <div className="admin-detail__grid">
          <Field label="Company">{p.clientCompany ?? '—'}</Field>
          <Field label="Contact">{p.clientContact ?? '—'}</Field>
          <Field label="Email">
            {p.clientEmail
              ? <a href={`mailto:${p.clientEmail}`}>{p.clientEmail}</a>
              : '—'}
          </Field>
          <Field label="Phone">{p.clientPhone ?? '—'}</Field>
        </div>
      </section>

      {/* Outreach — only when relevant */}
      {(p.whyThem ?? p.source ?? p.estimatedValue) !== null && (
        <section className="admin-detail__section">
          <h2 className="admin-detail__section-title">Outreach</h2>
          <div className="admin-detail__grid">
            {p.estimatedValue !== null && (
              <Field label="Est. value">{formatMoney(p.estimatedValue)}</Field>
            )}
            {p.source && <Field label="Source">{p.source}</Field>}
          </div>
          {p.whyThem && (
            <p className="admin-detail__notes" style={{ marginTop: 16 }}>
              {p.whyThem}
            </p>
          )}
        </section>
      )}

      {/* Notes */}
      {p.notes && (
        <section className="admin-detail__section">
          <h2 className="admin-detail__section-title">Notes</h2>
          <p className="admin-detail__notes">{p.notes}</p>
        </section>
      )}
    </div>
  )
}
