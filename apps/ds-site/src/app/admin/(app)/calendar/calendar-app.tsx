'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent, deleteEvent, updateEvent } from '../../calendar-actions'
import { ASSIGNEES, MONTHS, WEEKDAYS, type CalendarEvent, assigneeLabel, isoDate, monthGrid, monthLabel } from './lib/calendar'
import './calendar.css'

const COLORS = [
  { key: 'default', label: 'General', hex: '#8dcbff' },
  { key: 'meeting', label: 'Meeting', hex: '#43a47a' },
  { key: 'deadline', label: 'Deadline', hex: '#c96868' },
  { key: 'personal', label: 'Personal', hex: '#c89245' },
] as const

const colorHex = (c: string) => COLORS.find((x) => x.key === c)?.hex ?? '#8dcbff'

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
  const [title, setTitle] = useState('')
  const [time, setTime] = useState('')
  const [color, setColor] = useState('default')
  const [assignee, setAssignee] = useState('')

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
      await createEvent({ title, eventDate: selected, startTime: time || null, color, assignee })
      setTitle('')
      setTime('')
      setColor('default')
      setAssignee('')
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
        <p className="admin-page-sub">Shared between Dath and Stel — you both see and edit the same events.</p>
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
            {selectedEvents.map((e) => (
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
                  {e.startTime || e.assignee ? (
                    <span className="cal__event-meta">
                      {e.startTime ? <span className="cal__event-time">{e.startTime.slice(0, 5)}</span> : null}
                      {e.assignee ? <span className={`cal__who cal__who--${e.assignee}`}>{assigneeLabel(e.assignee)}</span> : null}
                    </span>
                  ) : null}
                </div>
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
            ))}
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
              <input className="cal__time" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time (optional)" />
              <select className="cal__color" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Category">
                {COLORS.map((c) => (
                  <option key={c.key} value={c.key}>{c.label}</option>
                ))}
              </select>
            </div>
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
