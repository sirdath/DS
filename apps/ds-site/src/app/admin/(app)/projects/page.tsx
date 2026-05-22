import Link from 'next/link'
import { getDataSource } from '@/app/admin/lib/get-data-source'
import { partitionProjects } from '@/app/admin/lib/derive'
import { PROJECT_STATUSES, STATUS_LABELS, PROJECT_TYPE_LABELS, OUTREACH_LABELS } from '@/app/admin/types'
import type { Project, ProjectStatus } from '@/app/admin/types'
import { ProjectGrid } from '@/app/admin/project-grid'
import { LeadGrid } from '@/app/admin/lead-grid'
import { unarchiveProjectAction, deleteProjectAction } from '@/app/admin/actions'
import { ConfirmButton } from '@/app/admin/confirm-button'
import { formatDate } from '@/app/admin/format'
import AnalyticsOverview from './AnalyticsOverview'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function ProjectsPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const view = sp['view'] === 'analytics' ? 'analytics' : 'overview'
  const rawStatus = typeof sp['status'] === 'string' ? sp['status'] : undefined
  const activeStatus: ProjectStatus | undefined =
    rawStatus !== undefined && (PROJECT_STATUSES as readonly string[]).includes(rawStatus)
      ? (rawStatus as ProjectStatus)
      : undefined

  const ds = getDataSource()
  const all = await ds.listProjects()
  const { leads, active, archived } = partitionProjects(all)
  const filteredActive = activeStatus ? active.filter((p) => p.status === activeStatus) : active

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <p className="admin-page-eyebrow">DS2 · Projects</p>
        <h1 className="admin-page-title">Projects</h1>
        <p className="admin-page-sub">
          {active.length} active{leads.length > 0 && ` · ${leads.length} in pipeline`}
        </p>
      </div>

      {/* ── Tabs: Overview | Analytics ── */}
      <div className="admin-tabs">
        <Link href="/admin/projects" className={`admin-tab${view === 'overview' ? ' is-active' : ''}`}>
          Overview
        </Link>
        <Link
          href="/admin/projects?view=analytics"
          className={`admin-tab${view === 'analytics' ? ' is-active' : ''}`}
        >
          Analytics
        </Link>
      </div>

      {view === 'analytics' ? (
        <div className="admin-section">
          <div className="admin-section__header">
            <p className="admin-section__eyebrow">Visit tracking</p>
            <h2 className="admin-section__title">Who visited the live sites</h2>
          </div>
          <AnalyticsOverview />
        </div>
      ) : (
        <>
          {/* ── Potential Leads ── */}
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

          {/* ── Active Projects ── */}
          <div className="admin-section">
            <div className="admin-section__header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <p className="admin-section__eyebrow">Active book</p>
                <h2 className="admin-section__title">
                  Active Projects
                  <span className="admin-section__count">{active.length}</span>
                </h2>
              </div>
              <Link href="/admin/new" className="admin-new-btn" style={{ flexShrink: 0, marginTop: 2 }}>
                + New project
              </Link>
            </div>

            <div className="admin-filters">
              <Link href="/admin/projects" className={`admin-filter-link${!activeStatus ? ' is-active' : ''}`}>
                All
              </Link>
              {PROJECT_STATUSES.map((s) => (
                <Link
                  key={s}
                  href={`/admin/projects?status=${s}`}
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

          {/* ── Archived ── */}
          <details className="admin-archived">
            <summary className="admin-archived__summary">
              <span className="admin-section__eyebrow">Archived</span>
              <span className="admin-section__count">{archived.length}</span>
            </summary>
            <div className="admin-archived__body">
              {archived.length === 0 ? (
                <p className="admin-archived__empty">Nothing archived.</p>
              ) : (
                <ul className="admin-archived-list">
                  {archived.map((p) => (
                    <ArchivedRow key={p.id} project={p} />
                  ))}
                </ul>
              )}
            </div>
          </details>
        </>
      )}
    </div>
  )
}

function ArchivedRow({ project: p }: { project: Project }) {
  const unarchiveBound = unarchiveProjectAction.bind(null, p.id)
  const deleteBound = deleteProjectAction.bind(null, p.id)

  const typeLabel = PROJECT_TYPE_LABELS[p.projectType]
  const stageLabel = p.outreachStage ? OUTREACH_LABELS[p.outreachStage] : STATUS_LABELS[p.status]

  return (
    <li className="admin-archived-row">
      <Link href={`/admin/project/${p.id}`} className="admin-archived-row__meta">
        <span className="admin-archived-row__name">{p.name}</span>
        <span className="admin-archived-row__tags">
          <span className="admin-type-tag">{typeLabel}</span>
          <span className="admin-archived-row__status">{stageLabel}</span>
        </span>
        <span className="admin-archived-row__details">
          {p.lead} &middot; updated {formatDate(p.updatedAt)}
        </span>
      </Link>
      <div className="admin-archived-row__actions">
        <ConfirmButton action={unarchiveBound} label="Restore" confirmText="" variant="neutral" />
        <ConfirmButton
          action={deleteBound}
          label="Delete permanently"
          confirmText="Permanently delete? This cannot be undone."
          variant="danger"
        />
      </div>
    </li>
  )
}
