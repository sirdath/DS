'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent, deleteEvent, updateEvent } from '../../calendar-actions'
import { ASSIGNEES, MEETING_TYPES, MONTHS, type CalendarEvent, assigneeLabel, isoDate, meetingTypeLabel, monthGrid, monthLabel } from './lib/calendar'
import { CANONICAL_TZ, TIMEZONES, fromCanonical, toCanonical } from './lib/tz'
import { AgendaView, type ColorMode, type DisplayEvent, Linkified, MonthView, TimeGridView, displayRange } from './calendar-views'
import { EventEditForm } from './event-edit-form'
import './calendar.css'
import '../planning/planning.css'

const COLORS = [
  { key: 'default', label: 'General' },
  { key: 'meeting', label: 'Meeting' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'personal', label: 'Personal' },
] as const

type View = 'month' | 'week' | 'day' | 'agenda'
const VIEWS: { key: View; label: string }[] = [
  { key: 'month', label: 'Month' },
  { key: 'week', label: 'Week' },
  { key: 'day', label: 'Day' },
  { key: 'agenda', label: 'Agenda' },
]

/** The 7 ISO dates (Mon-first) of the week containing `anchor`. */
function weekOf(anchor: string): string[] {
  const d = new Date(`${anchor}T12:00:00`)
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(monday)
    day.setDate(monday.getDate() + i)
    return isoDate(day.getFullYear(), day.getMonth(), day.getDate())
  })
}

export function CalendarApp({ events, deadlinesPanel }: { events: CalendarEvent[]; deadlinesPanel?: React.ReactNode }) {
  const router = useRouter()
  const today = useMemo(() => {
    const d = new Date()
    return isoDate(d.getFullYear(), d.getMonth(), d.getDate())
  }, [])
  const [view, setView] = useState<View>('month')
  const [tz, setTz] = useState<string>(CANONICAL_TZ)
  const [colorMode, setColorMode] = useState<ColorMode>('category')
  const [monthView, setMonthView] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const [selected, setSelected] = useState<string>(today)
  const [editing, setEditing] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [color, setColor] = useState('default')
  const [assignee, setAssignee] = useState('')
  const [meetingType, setMeetingType] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [note, setNote] = useState('')
  const [addErr, setAddErr] = useState<string | null>(null)

  // Restore the founder's view preferences.
  useEffect(() => {
    const v = window.localStorage.getItem('ds-cal-view') as View | null
    if (v && VIEWS.some((x) => x.key === v)) setView(v)
    const z = window.localStorage.getItem('ds-cal-tz')
    if (z && TIMEZONES.some((x) => x.key === z)) setTz(z)
    const c = window.localStorage.getItem('ds-cal-colors')
    if (c === 'person' || c === 'category') setColorMode(c)
  }, [])
  function pickView(v: View) {
    setView(v)
    window.localStorage.setItem('ds-cal-view', v)
  }
  function pickTz(z: string) {
    setTz(z)
    window.localStorage.setItem('ds-cal-tz', z)
  }
  function toggleColors() {
    setColorMode((m) => {
      const next = m === 'category' ? 'person' : 'category'
      window.localStorage.setItem('ds-cal-colors', next)
      return next
    })
  }

  // Convert every event's wall time into the viewing timezone once.
  const displayEvents: DisplayEvent[] = useMemo(
    () =>
      events.map((e) => {
        const w = fromCanonical(e.eventDate, e.startTime, tz)
        const end = e.startTime && e.endTime ? fromCanonical(e.eventDate, e.endTime, tz).time : null
        return { ...e, dispDate: e.startTime ? w.date : e.eventDate, dispStart: e.startTime ? w.time : null, dispEnd: end }
      }),
    [events, tz],
  )
  const byDate = useMemo(() => {
    const map = new Map<string, DisplayEvent[]>()
    for (const e of displayEvents) {
      const list = map.get(e.dispDate) ?? []
      list.push(e)
      map.set(e.dispDate, list)
    }
    for (const list of map.values()) list.sort((a, b) => (a.dispStart ?? '').localeCompare(b.dispStart ?? ''))
    return map
  }, [displayEvents])

  const weeks = useMemo(() => monthGrid(monthView.y, monthView.m), [monthView])
  const weekDays = useMemo(() => weekOf(selected), [selected])
  const selectedEvents = byDate.get(selected) ?? []

  function shiftPeriod(delta: number) {
    if (view === 'month') {
      setMonthView((v) => {
        const d = new Date(v.y, v.m + delta, 1)
        return { y: d.getFullYear(), m: d.getMonth() }
      })
      return
    }
    const step = view === 'week' ? 7 * delta : delta
    const d = new Date(`${selected}T12:00:00`)
    d.setDate(d.getDate() + step)
    const next = isoDate(d.getFullYear(), d.getMonth(), d.getDate())
    setSelected(next)
    setMonthView({ y: d.getFullYear(), m: d.getMonth() })
  }
  function goToday() {
    const d = new Date()
    setMonthView({ y: d.getFullYear(), m: d.getMonth() })
    setSelected(today)
  }
  function selectDate(d: string) {
    setSelected(d)
    const dt = new Date(`${d}T12:00:00`)
    setMonthView({ y: dt.getFullYear(), m: dt.getMonth() })
  }

  async function add() {
    if (!title.trim() || busy) return
    if (time && endTime && endTime <= time) {
      setAddErr('End must be after the start. For overnight events, leave the end time empty.')
      return
    }
    setAddErr(null)
    setBusy(true)
    try {
      const canonical = toCanonical(selected, time || null, tz)
      const canonicalEnd = time && endTime ? toCanonical(selected, endTime, tz).time : ''
      await createEvent({
        title,
        eventDate: time ? canonical.date : selected,
        startTime: canonical.time || null,
        endTime: canonicalEnd || null,
        description: note,
        color,
        assignee,
        meetingType: color === 'meeting' ? meetingType : '',
        meetingLink: color === 'meeting' ? meetingLink : '',
      })
      setTitle('')
      setTime('')
      setEndTime('')
      setColor('default')
      setAssignee('')
      setMeetingType('')
      setMeetingLink('')
      setNote('')
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const periodLabel = useMemo(() => {
    if (view === 'month') return monthLabel(monthView.y, monthView.m)
    if (view === 'agenda') return 'Coming up'
    const [y, m, d] = selected.split('-').map(Number)
    if (view === 'day') return `${d} ${MONTHS[(m ?? 1) - 1] ?? ''} ${y}`
    const first = weekDays[0] ?? selected
    const last = weekDays[6] ?? selected
    return `${Number(first.slice(8))} ${(MONTHS[Number(first.slice(5, 7)) - 1] ?? '').slice(0, 3)} – ${Number(last.slice(8))} ${(MONTHS[Number(last.slice(5, 7)) - 1] ?? '').slice(0, 3)}`
  }, [view, monthView, selected, weekDays])

  const onEventClick = (id: string) => setEditing(id)
  const editingEvent = editing ? displayEvents.find((e) => e.id === editing) : null

  return (
    <div className="admin-container cal">
      <div className="admin-page-header">
        <p className="admin-page-eyebrow">DS2 · Calendar</p>
        <h1 className="admin-page-title">What we have to do</h1>
        <p className="admin-page-sub">Shared between Dath and Stel, you both see and edit the same events and deadlines.</p>
      </div>

      <div className="cal__toolbar">
        <div className="cal__views" role="group" aria-label="Calendar view">
          {VIEWS.map((v) => (
            <button key={v.key} type="button" className={`cal__viewbtn${view === v.key ? ' is-on' : ''}`} aria-pressed={view === v.key} onClick={() => pickView(v.key)}>
              {v.label}
            </button>
          ))}
        </div>
        <div className="cal__nav">
          <button type="button" onClick={() => shiftPeriod(-1)} aria-label="Previous" disabled={view === 'agenda'}>‹</button>
          <span className="cal__month">{periodLabel}</span>
          <button type="button" onClick={() => shiftPeriod(1)} aria-label="Next" disabled={view === 'agenda'}>›</button>
        </div>
        <button type="button" className="cal__today" onClick={goToday}>Today</button>
        <button type="button" className="cal__colorbtn" onClick={toggleColors} title="Toggle event colours">
          {colorMode === 'category' ? 'Colours: category' : 'Colours: person'}
        </button>
        <select className="cal__tz" value={tz} onChange={(e) => pickTz(e.target.value)} aria-label="Timezone">
          {TIMEZONES.map((z) => (
            <option key={z.key} value={z.key}>{z.label}</option>
          ))}
        </select>
      </div>

      <div className="cal__layout">
        <section className="cal__cal">
          {view === 'month' ? (
            <MonthView weeks={weeks} byDate={byDate} today={today} selected={selected} onSelect={selectDate} mode={colorMode} onEventClick={onEventClick} />
          ) : view === 'agenda' ? (
            <AgendaView events={displayEvents} today={today} mode={colorMode} onEventClick={onEventClick} />
          ) : (
            <TimeGridView
              days={view === 'week' ? weekDays : [selected]}
              byDate={byDate}
              today={today}
              selected={selected}
              onSelect={selectDate}
              mode={colorMode}
              tz={tz}
              onEventClick={onEventClick}
            />
          )}
        </section>

        <aside className="cal__panel">
          <h2 className="cal__panel-title">
            {(() => {
              const [y, m, d] = selected.split('-').map(Number)
              return `${d} ${MONTHS[(m ?? 1) - 1] ?? ''} ${y}`
            })()}
          </h2>
          <div className="cal__events">
            {selectedEvents.length === 0 ? <p className="cal__empty">Nothing scheduled.</p> : null}
            {selectedEvents.map((e) =>
              editing === e.id ? (
                <EventEditForm
                  key={e.id}
                  event={e}
                  tz={tz}
                  onDone={() => {
                    setEditing(null)
                    router.refresh()
                  }}
                />
              ) : (
                <div key={e.id} className={`cal__event${e.done ? ' is-done' : ''}`}>
                  <button
                    type="button"
                    className="cal__check"
                    aria-label={e.done ? 'Mark not done' : 'Mark done'}
                    onClick={() => void updateEvent(e.id, { done: !e.done }).then(() => router.refresh())}
                  >
                    <i style={{ borderColor: 'var(--admin-text-dim)', background: e.done ? 'var(--admin-text-dim)' : 'transparent' }} />
                  </button>
                  <div className="cal__event-main">
                    <span className="cal__event-title">{e.title}</span>
                    {e.dispStart || e.assignee || e.meetingType || e.meetingLink ? (
                      <span className="cal__event-meta">
                        {e.dispStart ? <span className="cal__event-time">{displayRange(e)}</span> : null}
                        {e.meetingType ? <span className="ds-chip ds-chip--accent">{meetingTypeLabel(e.meetingType)}</span> : null}
                        {e.assignee ? <span className={`cal__who cal__who--${e.assignee}`}>{assigneeLabel(e.assignee)}</span> : null}
                        {e.meetingLink ? (
                          <a className="plan-join" href={e.meetingLink} target="_blank" rel="noopener noreferrer">Join ↗</a>
                        ) : null}
                      </span>
                    ) : null}
                    {e.description ? (
                      <span className="cal__event-note">
                        <Linkified text={e.description} />
                      </span>
                    ) : null}
                  </div>
                  <button type="button" className="cal__editbtn" aria-label="Edit event" onClick={() => setEditing(e.id)}>
                    ✎
                  </button>
                  <button
                    type="button"
                    className="cal__del"
                    aria-label="Delete event"
                    onClick={() => {
                      if (window.confirm('Delete this event?')) void deleteEvent(e.id).then(() => router.refresh())
                    }}
                  >
                    ✕
                  </button>
                </div>
              ),
            )}
            {editingEvent && !selectedEvents.some((e) => e.id === editing) ? (
              <EventEditForm
                event={editingEvent}
                tz={tz}
                onDone={() => {
                  setEditing(null)
                  router.refresh()
                }}
              />
            ) : null}
          </div>

          <div className="cal__add">
            <input
              className="cal__input"
              placeholder="Add an event…"
              value={title}
              maxLength={300}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') void add()
              }}
            />
            <div className="cal__add-row">
              <input className="cal__time" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Start time (optional)" />
              <input className="cal__time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} aria-label="End time (optional)" disabled={!time} />
              <select className="cal__color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Category">
                {COLORS.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
            {color === 'meeting' ? (
              <>
                <div className="cal__add-row">
                  <select className="cal__color" value={meetingType} onChange={(e) => setMeetingType(e.target.value)} aria-label="Meeting type">
                    <option value="">Meeting type…</option>
                    {MEETING_TYPES.map((t) => (
                      <option key={t.key} value={t.key}>{t.label}</option>
                    ))}
                  </select>
                </div>
                <input
                  className="cal__input"
                  type="url"
                  placeholder="Join link (optional)…"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  aria-label="Meeting link"
                />
              </>
            ) : null}
            <textarea
              className="cal__input cal__note"
              placeholder="Notes (optional) — call link, agenda…"
              value={note}
              maxLength={2000}
              rows={2}
              onChange={(e) => setNote(e.target.value)}
              aria-label="Event notes"
            />
            <div className="cal__add-row">
              <select className="cal__who-sel" value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Who's responsible">
                {ASSIGNEES.map((a) => (
                  <option key={a.key} value={a.key}>{a.key === '' ? 'Unassigned' : `For ${a.label}`}</option>
                ))}
              </select>
              <button type="button" className="cal__addbtn" disabled={!title.trim() || busy} onClick={() => void add()}>Add</button>
            </div>
            {addErr ? (
              <p className="cal__formerr" role="alert">
                {addErr}
              </p>
            ) : null}
            {tz !== CANONICAL_TZ ? <p className="cal__tzhint">Times entered in {tz.split('/')[1] ?? tz}; stored as Athens time.</p> : null}
          </div>

          {deadlinesPanel ? <div className="cal__deadlines">{deadlinesPanel}</div> : null}
        </aside>
      </div>
    </div>
  )
}
