/**
 * not-found.tsx — shown when a project id doesn't exist.
 */
import Link from 'next/link'

export default function ProjectNotFound() {
  return (
    <div className="admin-container">
      <div className="admin-not-found">
        <span className="admin-not-found__code">404</span>
        <p className="admin-not-found__msg">Project not found.</p>
        <Link href="/admin" className="admin-back-link" style={{ marginBottom: 0 }}>
          &#8592; Back to projects
        </Link>
      </div>
    </div>
  )
}
