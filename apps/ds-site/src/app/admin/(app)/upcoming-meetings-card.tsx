import Link from 'next/link'
import { type CalendarEvent, assigneeLabel, meetingTypeLabel, relativeWhen } from './calendar/lib/calendar'

const pad = (n: number) => (n < 10 ? `0${n}` : String(n))

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Dashboard card: the next few booked meetings (calendar events with a meeting type),
 * each with a relative "when" chip, its type, the team on it, and a Join link. */
export function UpcomingMeetingsCard({ events }: { events: CalendarEvent[] }) {
  const today = todayIso()
  const meetings = events
    .filter((e) => e.meetingType !== '' && !e.done && e.eventDate >= today)
    .slice(0, 3)

  return (
    <section className="ds2-card">
      <div className="ds2-list__head">
        <span className="ds2-list__title">Upcoming meetings</span>
        <Link href="/admin/calendar" className="ds2-list__all">
          View all →
        </Link>
      </div>
      {meetings.length === 0 ? (
        <p className="ds2-empty">No meetings booked. Add one in the calendar with the “Meeting” category.</p>
      ) : (
        meetings.map((e) => {
          const team = assigneeLabel(e.assignee)
          return (
            <div className="plan-row" key={e.id}>
              <div className="plan-row__main">
                <span className="plan-row__title" translate="no">
                  {e.title}
                </span>
                <span className="plan-meta">
                  <span className="ds-chip ds-chip--accent">{relativeWhen(e)}</span>
                  <span className="ds-chip">{meetingTypeLabel(e.meetingType)}</span>
                  {team ? <span className="ds-chip">{team}</span> : null}
                </span>
              </div>
              {e.meetingLink ? (
                <a className="plan-join" href={e.meetingLink} target="_blank" rel="noopener noreferrer">
                  Join ↗
                </a>
              ) : null}
            </div>
          )
        })
      )}
    </section>
  )
}
