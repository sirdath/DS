'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent, deleteEvent, updateEvent } from '../../calendar-actions'
import { ASSIGNEES, MEETING_TYPES, MONTHS, WEEKDAYS, type CalendarEvent, assigneeLabel, isoDate, meetingTypeLabel, monthGrid, monthLabel, timeRange } from './lib/calendar'
import './calendar.css'
import '../planning/planning.css'

const COLORS = [
  { key: 'default', label: 'General', hex: '#8dcbff' },
  { key: 'meeting', label: 'Meeting', hex: '#43a47a' },
  { key: 'deadline', label: 'Deadline', hex: '#c96868' },
  { key: 'personal', label: 'Personal', hex: '#c89245' },
] as const

const colorHex = (c: string) => COLORS.find((x) => x.key === c)?.hex ?? '#8dcbff'

/** In-place editor for one event — every field the add form has, seeded from the
 *  event, saved through updateEvent (no more delete-and-recreate to fix a typo). */
function EventEditForm({ event: e, onDone }: { event: CalendarEvent; onDone: () => void }) {
  const [title, setTitle] = useState(e.title)
  const [date, setDate] = useState(e.eventDate)
  const [start, setStart] = useState(e.startTime?.slice(0, 5) ?? '')
  const [end, setEnd] = useState(e.endTime?.slice(0, 5) ?? '')
  const [color, setColor] = useState(e.color)
  const [assignee, setAssignee] = useState(e.assignee)
  const [meetingType, setMeetingType] = useState(e.meetingType)
  const [meetingLink, setMeetingLink] = useState(e.meetingLink)
  const [busy, setBusy] = useState(false)

  async function save() {
    if (!title.trim() || !date || busy) return
    setBusy(true)
    try {
      await updateEvent(e.id, {
        title,
        eventDate: date,
        startTime: start || null,
        endTime: start ? end || null : null,
        color,
        assignee,
        meetingType: color === 'meeting' ? meetingType : '',
        meetingLink: color === 'meeting' ? meetingLink : '',
      })
      onDone()
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="cal__edit">
      <input className="cal__input" value={title} maxLength={300} onChange={(ev) => setTitle(ev.target.value)} aria-label="Title" />
      <div className="cal__add-row">
        <input className="cal__time" type="date" value={date} onChange={(ev) => setDate(ev.target.value)} aria-label="Date" />
        <input className="cal__time" type="time" value={start} onChange={(ev) => setStart(ev.target.value)} aria-label="Start time" />
        <input className="cal__time" type="time" value={end} onChange={(ev) => setEnd(ev.target.value)} aria-label="End time" disabled={!start} />
      </div>
      <div className="cal__add-row">
        <select className="cal__color" value={color} onChange={(ev) => setColor(ev.target.value)} aria-label="Category">
          {COLORS.map((c) => (
            <option key={c.key} value={c.key}>{c.label}</option>
          ))}
        </select>
        <select className="cal__who-sel" value={assignee} onChange={(ev) => setAssignee(ev.target.value)} aria-label="Who's responsible">
          {ASSIGNEES.map((a) => (
            <option key={a.key} value={a.key}>{a.key === '' ? 'Unassigned' : `For ${a.label}`}</option>
          ))}
        </select>
      </div>
      {color === 'meeting' ? (
        <div className="cal__add-row">
          <select className="cal__color" value={meetingType} onChange={(ev) => setMeetingType(ev.target.value)} aria-label="Meeting type">
            <option value="">Meeting type…</option>
            {MEETING_TYPES.map((t) => (
              <option key={t.key} value={t.key}>{t.label}</option>
            ))}
          </select>
          <input className="cal__input" type="url" placeholder="Join link…" value={meetingLink} onChange={(ev) => setMeetingLink(ev.target.value)} aria-label="Meeting link" />
        </div>
      ) : null}
      <div className="cal__add-row">
        <button type="button" className="cal__addbtn" disabled={!title.trim() || busy} onClick={() => void save()}>
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" className="cal__cancelbtn" onClick={onDone} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  )
}

export function CalendarApp({ events }: { events: CalendarEvent[] }) {
  const router = useRouter()
  const today = useMemo(() => {
    const d = new Date()
    return isoDate(d.getFullYear(), d.getMonth(), d.getDate())
  }, [])
  const [view, setView] = useState(() => {
    const d = new Date()
    return { y: d.getFullYear(), m: d.getMonth() }
  })
  const [selected, setSelected] = useState<string>(today)
  const [busy, setBusy] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [color, setColor] = useState('default')
  const [assignee, setAssignee] = useState('')
  const [meetingType, setMeetingType] = useState('')
  const [meetingLink, setMeetingLink] = useState('')

  const byDate = useMemo(() => {
    const map = new Map<string, CalendarEvent[]>()
    for (const e of events) {
      const list = map.get(e.eventDate) ?? []
      list.push(e)
      map.set(e.eventDate, list)
    }
    return map
  }, [events])

  const grid = useMemo(() => monthGrid(view.y, view.m), [view])
  const selectedEvents = byDate.get(selected) ?? []

  function shiftMonth(delta: number) {
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })
  }
  function goToday() {
    const d = new Date()
    setView({ y: d.getFullYear(), m: d.getMonth() })
    setSelected(today)
  }

  async function add() {
    if (!title.trim() || busy) return
    setBusy(true)
    try {
      await createEvent({
        title,
        eventDate: selected,
        startTime: time || null,
        endTime: time ? endTime || null : null,
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
      router.refresh()
    } finally {
      setBusy(false)
    }
  }

  const selectedLabel = useMemo(() => {
    const [y, m, d] = selected.split('-').map(Number)
    return `${d} ${MONTHS[(m ?? 1) - 1] ?? ''} ${y}`
  }, [selected])

  return (
    <div className="admin-container cal">
      <div className="admin-page-header">
        <p className="admin-page-eyebrow">DS2 · Calendar</p>
        <h1 className="admin-page-title">What we have to do</h1>
        <p className="admin-page-sub">Shared between Dath and Stel, you both see and edit the same events.</p>
      </div>

      <div className="cal__layout">
        <section className="cal__cal">
          <div className="cal__bar">
            <div className="cal__nav">
              <button type="button" onClick={() => shiftMonth(-1)} aria-label="Previous month">‹</button>
              <span className="cal__month">{monthLabel(view.y, view.m)}</span>
              <button type="button" onClick={() => shiftMonth(1)} aria-label="Next month">›</button>
            </div>
            <button type="button" className="cal__today" onClick={goToday}>Today</button>
          </div>
          <div className="cal__weekdays">
            {WEEKDAYS.map((w) => (
              <span key={w}>{w}</span>
            ))}
          </div>
          <div className="cal__grid">
            {grid.flat().map((cell) => {
              const evs = byDate.get(cell.date) ?? []
              const isToday = cell.date === today
              const isSel = cell.date === selected
              return (
                <button
                  type="button"
                  key={cell.date}
                  className={`cal__day${cell.inMonth ? '' : ' is-out'}${isToday ? ' is-today' : ''}${isSel ? ' is-sel' : ''}`}
                  onClick={() => setSelected(cell.date)}
                >
                  <span className="cal__daynum">{cell.day}</span>
                  <span className="cal__dots">
                    {evs.slice(0, 4).map((e) => (
                      <i key={e.id} className={e.done ? 'is-done' : ''} style={{ background: colorHex(e.color) }} />
                    ))}
                  </span>
                </button>
              )
            })}
          </div>
        </section>

        <aside className="cal__panel">
          <h2 className="cal__panel-title">{selectedLabel}</h2>
          <div className="cal__events">
            {selectedEvents.length === 0 ? <p className="cal__empty">Nothing scheduled.</p> : null}
            {selectedEvents.map((e) =>
              editing === e.id ? (
                <EventEditForm
                  key={e.id}
                  event={e}
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
                    <i style={{ background: e.done ? colorHex(e.color) : 'transparent', borderColor: colorHex(e.color) }} />
                  </button>
                  <div className="cal__event-main">
                    <span className="cal__event-title">{e.title}</span>
                    {e.startTime || e.assignee || e.meetingType || e.meetingLink ? (
                      <span className="cal__event-meta">
                        {e.startTime ? <span className="cal__event-time">{timeRange(e)}</span> : null}
                        {e.meetingType ? <span className="ds-chip ds-chip--accent">{meetingTypeLabel(e.meetingType)}</span> : null}
                        {e.assignee ? <span className={`cal__who cal__who--${e.assignee}`}>{assigneeLabel(e.assignee)}</span> : null}
                        {e.meetingLink ? (
                          <a className="plan-join" href={e.meetingLink} target="_blank" rel="noopener noreferrer">Join ↗</a>
                        ) : null}
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
            <div className="cal__add-row">
              <select className="cal__who-sel" value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Who's responsible">
                {ASSIGNEES.map((a) => (
                  <option key={a.key} value={a.key}>{a.key === '' ? 'Unassigned' : `For ${a.label}`}</option>
                ))}
              </select>
              <button type="button" className="cal__addbtn" disabled={!title.trim() || busy} onClick={() => void add()}>Add</button>
            </div>
          </div>
        </aside>
      </div>
    </div>
  )
}
