/**
 * /admin/project/[id] — project detail page.
 * Server component, force-dynamic.
 */
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getDataSource } from '@/app/admin/lib/get-data-source'
import { STATUS_LABELS, OUTREACH_LABELS, PROJECT_TYPE_LABELS } from '@/app/admin/types'
import { updateProjectAction, archiveProjectAction, unarchiveProjectAction, deleteProjectAction } from '@/app/admin/actions'
import { ProjectForm } from '@/app/admin/project-form'
import { ProjectDetailView } from '@/app/admin/project-detail-view'
import { ActivityFeed } from '@/app/admin/activity-feed'
import { ConfirmButton } from '@/app/admin/confirm-button'

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
  const archiveBound = archiveProjectAction.bind(null, id)
  const unarchiveBound = unarchiveProjectAction.bind(null, id)
  const deleteBound = deleteProjectAction.bind(null, id)

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
          {p.archived && (
            <span className="admin-archived-badge">Archived</span>
          )}
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

      {/* Edit section — prominent collapsible */}
      <details className="admin-edit-details admin-edit-details--prominent">
        <summary className="admin-edit-details__summary--prominent">Edit project</summary>
        <div className="admin-edit-details__body">
          <ProjectForm
            action={updateBound}
            project={p}
            submitLabel="Save changes, update record"
          />
        </div>
      </details>

      {/* Archive / Restore / Delete zone */}
      <div className="admin-danger-zone">
        {p.archived ? (
          <>
            <p className="admin-danger-zone__label">Archived project</p>
            <div className="admin-danger-zone__actions">
              <ConfirmButton
                action={unarchiveBound}
                label="Restore project"
                confirmText=""
                variant="neutral"
              />
              <ConfirmButton
                action={deleteBound}
                label="Delete permanently"
                confirmText="Permanently delete? This cannot be undone."
                variant="danger"
              />
            </div>
          </>
        ) : (
          <>
            <p className="admin-danger-zone__label">Archive this project</p>
            <ConfirmButton
              action={archiveBound}
              label="Archive project"
              confirmText="Archive this project? You can restore it later."
              variant="neutral"
            />
          </>
        )}
      </div>
    </div>
  )
}
