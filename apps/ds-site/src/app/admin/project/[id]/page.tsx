/**
 * /admin/project/[id] — project detail page.
 * Server component, force-dynamic.
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDataSource } from '../../lib/get-data-source'
import { STATUS_LABELS, OUTREACH_LABELS, PROJECT_TYPE_LABELS } from '../../types'
import { updateProjectAction } from '../../actions'
import { ProjectForm } from '../../project-form'
import { ProjectDetailView } from '../../project-detail-view'
import { ActivityFeed } from '../../activity-feed'
import { DeleteButton } from '../../delete-button'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { id } = await params
  const ds = getDataSource()
  const [project, activity] = await Promise.all([
    ds.getProject(id),
    ds.listActivity(id),
  ])

  if (!project) notFound()

  const p = project
  const isLead = p.status === 'lead'
  const updateBound = updateProjectAction.bind(null, id)

  const statusLabel = isLead && p.outreachStage
    ? OUTREACH_LABELS[p.outreachStage]
    : STATUS_LABELS[p.status]

  const statusClass = isLead
    ? `admin-outreach-pill is-${p.outreachStage ?? 'identified'}`
    : `admin-status-pill is-${p.status}`

  return (
    <div className="admin-container">
      <Link href="/admin" className="admin-back-link">
        &#8592; Back to projects
      </Link>

      {/* Header */}
      <div className="admin-detail__header">
        <div className="admin-detail__tags">
          <span className="admin-type-tag">{PROJECT_TYPE_LABELS[p.projectType]}</span>
          <span className={statusClass}>{statusLabel}</span>
          {p.retainerMonthly !== null && (
            <span className="admin-retainer-detail-badge">
              &#8364;{p.retainerMonthly}/mo
            </span>
          )}
        </div>
        <h1 className="admin-detail__name">{p.name}</h1>
        <p className="admin-detail__sub">Lead: {p.lead}</p>
      </div>

      {/* Read view */}
      <ProjectDetailView project={p} />

      {/* Activity feed */}
      <ActivityFeed projectId={id} activity={activity} />

      {/* Edit section — collapsible */}
      <details className="admin-edit-details">
        <summary>Edit project</summary>
        <div className="admin-edit-details__body">
          <ProjectForm
            action={updateBound}
            project={p}
            submitLabel="Save changes"
          />
        </div>
      </details>

      {/* Delete */}
      <DeleteButton id={id} name={p.name} />
    </div>
  )
}
