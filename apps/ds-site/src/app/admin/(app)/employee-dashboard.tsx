import { loadEmployeeData } from '@/app/admin/lib/employee-data'
import './employee-dashboard.css'

const STATUS_LABEL: Record<string, string> = {
  lead: 'Lead',
  in_progress: 'In progress',
  delivered: 'Delivered',
  retainer: 'Retainer',
}

/**
 * The employee (non-owner) view of /admin. Shows only the projects the person
 * is assigned to and the notes tagged to them — no revenue, no funnel, no
 * competitors. Data is scoped server-side by email in loadEmployeeData.
 */
export async function EmployeeDashboard({ email, name }: { email: string | null; name: string }) {
  const { projects, notes } = await loadEmployeeData(email)
  const firstName = name.split(' ')[0] || ''

  return (
    <div className="emp">
      <header className="emp__head">
        <p className="emp__eyebrow">Your workspace</p>
        <h1 className="emp__title">Welcome{firstName ? `, ${firstName}` : ''}.</h1>
        <p className="emp__sub">
          Here&rsquo;s what you&rsquo;re working on. You only see the projects and notes assigned to you.
        </p>
      </header>

      <section className="emp__card">
        <div className="emp__cardhead">
          <h2 className="emp__h2">Your projects</h2>
          <span className="emp__count">{projects.length}</span>
        </div>
        {projects.length > 0 ? (
          <ul className="emp__list">
            {projects.map((p) => (
              <li key={p.id} className="emp__row">
                <span className="emp__name">{p.name}</span>
                <span className={`emp__pill emp__pill--${p.status}`}>
                  {STATUS_LABEL[p.status] ?? p.status}
                </span>
                <span className="emp__pct">{p.completion}%</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="emp__empty">
            No projects assigned yet. An owner will add you to the projects you&rsquo;re working on.
          </p>
        )}
      </section>

      <section className="emp__card">
        <div className="emp__cardhead">
          <h2 className="emp__h2">Shared notes</h2>
          <span className="emp__count">{notes.length}</span>
        </div>
        {notes.length > 0 ? (
          <ul className="emp__list">
            {notes.map((n) => (
              <li key={n.id} className="emp__row emp__row--note">
                <span className="emp__name">{n.title}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="emp__empty">No notes shared with you yet.</p>
        )}
      </section>
    </div>
  )
}
