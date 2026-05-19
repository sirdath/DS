/**
 * /admin/new — create a new project
 * Server component.
 */
import Link from 'next/link'
import { createProjectAction } from '../actions'
import { ProjectForm } from '../project-form'

export default function NewProjectPage() {
  return (
    <div className="admin-container">
      <Link href="/admin" className="admin-back-link">
        &#8592; Back to projects
      </Link>

      <div className="admin-page-header">
        <p className="admin-page-eyebrow">DS2 · Admin</p>
        <h1 className="admin-page-title">New project</h1>
        <p className="admin-page-sub">
          Fill in the details below to add a project or lead to the portfolio.
        </p>
      </div>

      <ProjectForm action={createProjectAction} submitLabel="Create project" />
    </div>
  )
}
