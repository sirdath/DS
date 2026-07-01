import { loadMetricSources } from '@/app/admin/lib/metric-sources'
import { loadEvents } from '../calendar/lib/calendar-source'
import { loadDeadlines } from './lib/deadlines-source'
import { DeadlinesCard } from './deadlines-card'
import { PlanningApp } from './planning-app'
import './planning.css'

export const dynamic = 'force-dynamic'

export default async function PlanningPage() {
  const [events, deadlines, sources] = await Promise.all([loadEvents(), loadDeadlines(), loadMetricSources()])
  return (
    <div className="admin-container">
      <div className="ds-page-header">
        <p className="ds-page-header__eyebrow">DS2 · Planning</p>
        <h1 className="ds-page-header__title">Planning</h1>
        <p className="ds-page-header__sub">
          Add calendar events, meetings and deadlines, and see what&rsquo;s coming up, all in one place.
        </p>
      </div>
      <div className="plan-page">
        <div className="plan-page__col">
          <PlanningApp events={events} />
        </div>
        <div className="plan-page__col">
          <DeadlinesCard deadlines={deadlines} sources={sources} />
        </div>
      </div>
    </div>
  )
}
