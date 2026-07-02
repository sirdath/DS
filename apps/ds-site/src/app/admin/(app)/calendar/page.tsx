import type { Metadata } from 'next'
import { loadMetricSources } from '@/app/admin/lib/metric-sources'
import { DeadlinesCard } from '../planning/deadlines-card'
import { loadDeadlines } from '../planning/lib/deadlines-source'
import { CalendarApp } from './calendar-app'
import { loadEvents } from './lib/calendar-source'

export const metadata: Metadata = { title: 'Calendar · DS2 Admin' }
export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const [events, deadlines, sources] = await Promise.all([loadEvents(), loadDeadlines(), loadMetricSources()])
  return <CalendarApp events={events} deadlinesPanel={<DeadlinesCard deadlines={deadlines} sources={sources} />} />
}
