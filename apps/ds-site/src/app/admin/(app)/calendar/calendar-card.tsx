import Link from 'next/link'
import { MONTHS, WEEKDAYS, type CalendarEvent, isoDate, monthGrid } from './lib/calendar'

const COLOR: Record<string, string> = { default: '#8dcbff', meeting: '#43a47a', deadline: '#c96868', personal: '#c89245' }
const colorHex = (c: string) => COLOR[c] ?? '#8dcbff'

/** Compact month card for the dashboard — links into the full calendar. */
export function CalendarCard({ events }: { events: CalendarEvent[] }) {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const today = isoDate(y, m, now.getDate())
  const grid = monthGrid(y, m)
  const withEvents = new Set(events.map((e) => e.eventDate))
  const upcoming = events.filter((e) => e.eventDate >= today && !e.done).slice(0, 3)

  return (
    <Link href="/admin/calendar" className="ds2-card ds2-calcard">
      <div className="ds2-calcard__head">
        <span className="ds2-card__eyebrow">Calendar</span>
        <span className="ds2-calcard__month">{MONTHS[m] ?? ''} {y}</span>
      </div>
      <div className="ds2-calmini">
        <div className="ds2-calmini__wd">
          {WEEKDAYS.map((w) => (
            <span key={w}>{w.charAt(0)}</span>
          ))}
        </div>
        <div className="ds2-calmini__grid">
          {grid.flat().map((cell) => (
            <span
              key={cell.date}
              className={`ds2-calmini__d${cell.inMonth ? '' : ' is-out'}${cell.date === today ? ' is-today' : ''}${withEvents.has(cell.date) ? ' has-ev' : ''}`}
            >
              {cell.day}
            </span>
          ))}
        </div>
      </div>
      <div className="ds2-calcard__up">
        {upcoming.length === 0 ? (
          <span className="ds2-calcard__empty">Nothing coming up — open to add</span>
        ) : (
          upcoming.map((e) => (
            <span key={e.id} className="ds2-calcard__ev">
              <i style={{ background: colorHex(e.color) }} />
              <span translate="no">{e.title}</span>
            </span>
          ))
        )}
      </div>
    </Link>
  )
}
