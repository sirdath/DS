'use client'

/**
 * Calendar view surfaces: month (events as chips in slots), week/day time grids,
 * and agenda. All views work on DisplayEvent — the event with its wall time already
 * converted to the viewing timezone — so rendering never does tz math.
 */

import { Fragment, type ReactNode } from 'react'
import { MONTHS, WEEKDAYS, type CalendarEvent, type DayCell, assigneeLabel, meetingTypeLabel } from './lib/calendar'

export interface DisplayEvent extends CalendarEvent {
  dispDate: string // YYYY-MM-DD in the viewing tz
  dispStart: string | null // HH:MM in the viewing tz
  dispEnd: string | null
}

export type ColorMode = 'category' | 'person'

const CATEGORY_HEX: Record<string, string> = {
  default: '#8dcbff',
  meeting: '#43a47a',
  deadline: '#c96868',
  personal: '#c89245',
}
// Monday-style person colours: one colour per founder, stable everywhere.
const PERSON_HEX: Record<string, string> = {
  dath: '#8dcbff',
  stel: '#c89245',
  both: '#b58ae6',
  '': '#626872',
}

export function eventColor(e: CalendarEvent, mode: ColorMode): string {
  if (mode === 'person') return PERSON_HEX[e.assignee] ?? '#626872'
  return CATEGORY_HEX[e.color] ?? '#8dcbff'
}

export function displayRange(e: DisplayEvent): string {
  if (!e.dispStart) return ''
  return e.dispEnd ? `${e.dispStart}–${e.dispEnd}` : e.dispStart
}

/** Render note text with http(s) links clickable. */
export function Linkified({ text }: { text: string }): ReactNode {
  const parts = text.split(/(https?:\/\/[^\s]+)/g)
  return (
    <>
      {parts.map((p, i) =>
        /^https?:\/\//.test(p) ? (
          <a key={i} href={p} target="_blank" rel="noopener noreferrer">
            {p.length > 42 ? `${p.slice(0, 40)}…` : p}
          </a>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  )
}

function Chip({ e, mode, onClick }: { e: DisplayEvent; mode: ColorMode; onClick: (id: string) => void }) {
  const hex = eventColor(e, mode)
  return (
    <button
      type="button"
      className={`calv-chip${e.done ? ' is-done' : ''}`}
      style={{ background: `color-mix(in srgb, ${hex} 22%, transparent)`, borderColor: `color-mix(in srgb, ${hex} 45%, transparent)` }}
      onClick={(ev) => {
        ev.stopPropagation()
        onClick(e.id)
      }}
      title={`${e.title}${e.description ? `\n${e.description}` : ''}`}
    >
      {e.dispStart ? <span className="calv-chip__t">{e.dispStart}</span> : null}
      <span className="calv-chip__n">{e.title}</span>
    </button>
  )
}

interface CommonProps {
  mode: ColorMode
  onEventClick: (id: string) => void
}

/* ── Month: events as chips inside the day slots ── */
export function MonthView({
  weeks,
  byDate,
  today,
  selected,
  onSelect,
  mode,
  onEventClick,
}: CommonProps & {
  weeks: DayCell[][]
  byDate: Map<string, DisplayEvent[]>
  today: string
  selected: string
  onSelect: (d: string) => void
}) {
  return (
    <div className="calv-month">
      <div className="cal__weekdays">
        {WEEKDAYS.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="calv-month__grid">
        {weeks.flat().map((cell) => {
          const evs = byDate.get(cell.date) ?? []
          const shown = evs.slice(0, 3)
          return (
            <div
              key={cell.date}
              className={`calv-cell${cell.inMonth ? '' : ' is-out'}${cell.date === today ? ' is-today' : ''}${cell.date === selected ? ' is-sel' : ''}`}
              onClick={() => onSelect(cell.date)}
              role="button"
              tabIndex={0}
              onKeyDown={(ev) => {
                if (ev.key === 'Enter' || ev.key === ' ') onSelect(cell.date)
              }}
              aria-label={`Select ${cell.date}`}
            >
              <span className="calv-cell__num">{cell.day}</span>
              <div className="calv-cell__evs">
                {shown.map((e) => (
                  <Chip key={e.id} e={e} mode={mode} onClick={onEventClick} />
                ))}
                {evs.length > shown.length ? <span className="calv-cell__more">+{evs.length - shown.length} more</span> : null}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

/* ── Week / Day: a real time grid, events as positioned blocks ── */
const HOUR_START = 7
const HOUR_END = 22
const PX_PER_MIN = 0.8

const mins = (t: string): number => {
  const [h, m] = t.split(':').map(Number)
  return (h ?? 0) * 60 + (m ?? 0)
}

function Block({ e, mode, onClick }: { e: DisplayEvent; mode: ColorMode; onClick: (id: string) => void }) {
  const hex = eventColor(e, mode)
  // Clamp into the visible window from BOTH sides: a 23:30 event pins to the last
  // slot instead of drawing past the grid with negative height.
  const start = Math.min(Math.max(mins(e.dispStart ?? '07:00'), HOUR_START * 60), HOUR_END * 60 - 25)
  const rawEnd = e.dispEnd ? mins(e.dispEnd) : start + 45
  const end = Math.min(Math.max(rawEnd, start + 25), HOUR_END * 60)
  return (
    <button
      type="button"
      className={`calv-block${e.done ? ' is-done' : ''}`}
      style={{
        top: (start - HOUR_START * 60) * PX_PER_MIN,
        height: (end - start) * PX_PER_MIN,
        background: `color-mix(in srgb, ${hex} 24%, var(--admin-surface))`,
        borderLeft: `3px solid ${hex}`,
      }}
      onClick={() => onClick(e.id)}
      title={`${e.title}${e.description ? `\n${e.description}` : ''}`}
    >
      <span className="calv-block__t">{displayRange(e)}</span>
      <span className="calv-block__n">{e.title}</span>
    </button>
  )
}

export function TimeGridView({
  days,
  byDate,
  today,
  selected,
  onSelect,
  mode,
  onEventClick,
}: CommonProps & {
  days: string[] // ISO dates, 1 (day view) or 7 (week view)
  byDate: Map<string, DisplayEvent[]>
  today: string
  selected: string
  onSelect: (d: string) => void
}) {
  const hours = Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i)
  return (
    <div className={`calv-grid${days.length === 1 ? ' is-day' : ''}`}>
      <div className="calv-grid__head">
        <span className="calv-grid__gutter" />
        {days.map((d) => {
          const [, m, day] = d.split('-').map(Number)
          const dow = WEEKDAYS[(new Date(`${d}T12:00:00`).getDay() + 6) % 7]
          return (
            <button
              type="button"
              key={d}
              className={`calv-grid__day${d === today ? ' is-today' : ''}${d === selected ? ' is-sel' : ''}`}
              onClick={() => onSelect(d)}
            >
              {dow} {day}/{m}
            </button>
          )
        })}
      </div>
      <div className="calv-grid__allday">
        <span className="calv-grid__gutter calv-grid__gutter--label">all-day</span>
        {days.map((d) => (
          <div key={d} className="calv-grid__alldaycell">
            {(byDate.get(d) ?? [])
              .filter((e) => !e.dispStart)
              .map((e) => (
                <Chip key={e.id} e={e} mode={mode} onClick={onEventClick} />
              ))}
          </div>
        ))}
      </div>
      <div className="calv-grid__body" style={{ height: (HOUR_END - HOUR_START) * 60 * PX_PER_MIN }}>
        <div className="calv-grid__gutter">
          {hours.map((h) => (
            <span key={h} className="calv-grid__hour" style={{ top: (h - HOUR_START) * 60 * PX_PER_MIN }}>
              {h}:00
            </span>
          ))}
        </div>
        {days.map((d) => (
          <div key={d} className={`calv-grid__col${d === today ? ' is-today' : ''}`}>
            {hours.map((h) => (
              <span key={h} className="calv-grid__line" style={{ top: (h - HOUR_START) * 60 * PX_PER_MIN }} />
            ))}
            {(byDate.get(d) ?? [])
              .filter((e) => e.dispStart)
              .map((e) => (
                <Block key={e.id} e={e} mode={mode} onClick={onEventClick} />
              ))}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Agenda: everything upcoming, grouped by day ── */
export function AgendaView({
  events,
  today,
  mode,
  onEventClick,
}: CommonProps & { events: DisplayEvent[]; today: string }) {
  const upcoming = events.filter((e) => e.dispDate >= today).sort((a, b) => a.dispDate.localeCompare(b.dispDate) || (a.dispStart ?? '').localeCompare(b.dispStart ?? ''))
  const groups = new Map<string, DisplayEvent[]>()
  for (const e of upcoming) {
    const list = groups.get(e.dispDate) ?? []
    list.push(e)
    groups.set(e.dispDate, list)
  }
  if (upcoming.length === 0) return <p className="cal__empty">Nothing scheduled ahead.</p>
  return (
    <div className="calv-agenda">
      {Array.from(groups.entries()).map(([date, list]) => {
        const [y, m, d] = date.split('-').map(Number)
        const label = `${d} ${(MONTHS[(m ?? 1) - 1] ?? '').slice(0, 3)} ${y}`
        return (
          <section key={date} className="calv-agenda__day">
            <h3 className="calv-agenda__date">
              {date === today ? 'Today · ' : ''}
              {label}
            </h3>
            {list.map((e) => (
              <button type="button" key={e.id} className={`calv-agenda__row${e.done ? ' is-done' : ''}`} onClick={() => onEventClick(e.id)}>
                <span className="calv-agenda__time">{e.dispStart ? displayRange(e) : 'all-day'}</span>
                <i className="calv-agenda__dot" style={{ background: eventColor(e, mode) }} aria-hidden />
                <span className="calv-agenda__main">
                  <span className="calv-agenda__title">{e.title}</span>
                  <span className="calv-agenda__meta">
                    {e.meetingType ? <span className="ds-chip">{meetingTypeLabel(e.meetingType)}</span> : null}
                    {e.assignee ? <span className="ds-chip">{assigneeLabel(e.assignee)}</span> : null}
                    {e.meetingLink ? (
                      <a className="plan-join" href={e.meetingLink} target="_blank" rel="noopener noreferrer" onClick={(ev) => ev.stopPropagation()}>
                        Join ↗
                      </a>
                    ) : null}
                  </span>
                  {e.description ? (
                    <span className="calv-agenda__note">
                      <Linkified text={e.description} />
                    </span>
                  ) : null}
                </span>
              </button>
            ))}
          </section>
        )
      })}
    </div>
  )
}
