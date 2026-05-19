'use client'
import Link from 'next/link'
import type { Project, ProjectStatus } from './types'
import { STATUS_LABELS } from './types'
import { outstanding, isOverdue } from './lib/derive'
import { formatMoney } from './format'
import { useStaggerIn } from './use-stagger-in'

interface Props {
  projects: Project[]
}

export function ProjectGrid({ projects }: Props) {
  const gridRef = useStaggerIn<HTMLDivElement>()

  if (projects.length === 0) {
    return (
      <p style={{ color: 'var(--admin-text-muted)', fontSize: '14px', padding: '40px 0' }}>
        No projects match this filter.
      </p>
    )
  }

  return (
    <div className="admin-grid" ref={gridRef}>
      {projects.map((p) => (
        <ProjectCard key={p.id} project={p} />
      ))}
    </div>
  )
}

function ProjectCard({ project: p }: { project: Project }) {
  const owed = outstanding(p)
  const overdue = isOverdue(p)

  return (
    <Link
      href={`/admin/project/${p.id}`}
      className="admin-card"
      data-stagger
    >
      <div className="admin-card__header">
        <div>
          <div className="admin-card__name">{p.name}</div>
          <div className="admin-card__lead">{p.lead}</div>
        </div>
        <StatusPill status={p.status} />
      </div>

      <ProgressBar pct={p.completionPct} status={p.status} />

      <div className="admin-card__money">
        <span className="admin-card__money-paid">{formatMoney(p.amountPaid)} paid</span>
        <span>/</span>
        <span>{formatMoney(owed)} outstanding</span>
      </div>

      {overdue && (
        <div className="admin-card__meta">
          <span className="admin-overdue">Overdue</span>
        </div>
      )}
    </Link>
  )
}

function StatusPill({ status }: { status: ProjectStatus }) {
  return (
    <span className={`admin-status-pill is-${status}`}>
      {STATUS_LABELS[status]}
    </span>
  )
}

function ProgressBar({ pct, status }: { pct: number; status: ProjectStatus }) {
  const label = `${pct}%`
  return (
    <div className="admin-progress" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`Completion: ${label}`}>
      <div className="admin-progress__track">
        <div
          className="admin-progress__fill"
          style={{ width: `${pct}%` }}
          data-status={status}
        />
      </div>
      <span className="admin-progress__label">{label}</span>
    </div>
  )
}
