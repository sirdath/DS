import type { Metadata } from 'next'
import { CalendarApp } from './calendar-app'
import { loadEvents } from './lib/calendar-source'

export const metadata: Metadata = { title: 'Calendar · DS2 Admin' }
export const dynamic = 'force-dynamic'

export default async function CalendarPage() {
  const events = await loadEvents()
  return <CalendarApp events={events} />
}
