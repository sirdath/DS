'use client'

import Link from 'next/link'
import { type FormEvent, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createEvent } from '@/app/admin/calendar-actions'
import { ASSIGNEES, type CalendarEvent, MEETING_TYPES, assigneeLabel, isoDate, meetingTypeLabel, relativeWhen } from '../calendar/lib/calendar'

const CATEGORIES = [
  { key: 'default', label: 'General' },
  { key: 'meeting', label: 'Meeting' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'personal', label: 'Personal' },
] as const

export function PlanningApp({ events }: { events: CalendarEvent[] }) {
  const router = useRouter()
  const today = useMemo(() => {
    const d = new Date()
    return isoDate(d.getFullYear(), d.getMonth(), d.getDate())
  }, [])

  const [title, setTitle] = useState('')
  const [date, setDate] = useState(today)
  const [time, setTime] = useState('')
  const [color, setColor] = useState('default')
  const [assignee, setAssignee] = useState('')
  const [meetingType, setMeetingType] = useState('')
  const [meetingLink, setMeetingLink] = useState('')
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const upcoming = useMemo(() => events.filter((e) => !e.done && e.eventDate >= today).slice(0, 8), [events, today])

  async function onAdd(e: FormEvent) {
    e.preventDefault()
    if (!title.trim() || !date || busy) return
    setBusy(true)
    setErr(null)
    try {
      await createEvent({
        title,
        eventDate: date,
        startTime: time || null,
        color,
        assignee,
        meetingType: color === 'meeting' ? meetingType : '',
        meetingLink: color === 'meeting' ? meetingLink : '',
      })
      setTitle('')
      setDate(today)
      setTime('')
      setColor('default')
      setAssignee('')
      setMeetingType('')
      setMeetingLink('')
      router.refresh()
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Could not add that.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <>
      <section className="ds2-card">
        <div className="ds2-list__head">
          <span className="ds2-list__title">Add to calendar</span>
        </div>
        <form className="plan-add" onSubmit={onAdd}>
          <input
            className="plan-input"
            placeholder="What's happening…"
            value={title}
            maxLength={300}
            onChange={(e) => setTitle(e.target.value)}
            aria-label="Title"
          />
          <div className="plan-add__row">
            <input className="plan-input" type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="Date" />
            <input className="plan-input" type="time" value={time} onChange={(e) => setTime(e.target.value)} aria-label="Time (optional)" />
          </div>
          <div className="plan-add__row">
            <select className="plan-select" value={color} onChange={(e) => setColor(e.target.value)} aria-label="Category">
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
            <select className="plan-select" value={assignee} onChange={(e) => setAssignee(e.target.value)} aria-label="Who's responsible">
              {ASSIGNEES.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.key === '' ? 'Unassigned' : `For ${a.label}`}
                </option>
              ))}
            </select>
          </div>
          {color === 'meeting' ? (
            <div className="plan-add__row">
              <select className="plan-select" value={meetingType} onChange={(e) => setMeetingType(e.target.value)} aria-label="Meeting type">
                <option value="">Meeting type…</option>
                {MEETING_TYPES.map((t) => (
                  <option key={t.key} value={t.key}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                className="plan-input"
                type="url"
                placeholder="Join link (optional)…"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                aria-label="Meeting link"
              />
            </div>
          ) : null}
          <div className="plan-form__actions">
            <button className="plan-btn" type="submit" disabled={busy}>
              {busy ? 'Adding…' : 'Add to calendar'}
            </button>
          </div>
          {err ? (
            <p className="plan-err" role="alert">
              {err}
            </p>
          ) : null}
        </form>
      </section>

      <section className="ds2-card">
        <div className="ds2-list__head">
          <span className="ds2-list__title">Coming up</span>
          <Link href="/admin/calendar" className="ds2-list__all">
            Open calendar →
          </Link>
        </div>
        {upcoming.length === 0 ? (
          <p className="ds2-empty">Nothing scheduled ahead.</p>
        ) : (
          upcoming.map((e) => (
            <div className="plan-row" key={e.id}>
              <div className="plan-row__main">
                <span className="plan-row__title" translate="no">
                  {e.title}
                </span>
                <span className="plan-meta">
                  <span className="ds-chip ds-chip--accent">{relativeWhen(e)}</span>
                  {e.meetingType ? <span className="ds-chip">{meetingTypeLabel(e.meetingType)}</span> : null}
                  {e.assignee ? <span className="ds-chip">{assigneeLabel(e.assignee)}</span> : null}
                </span>
              </div>
              {e.meetingLink ? (
                <a className="plan-join" href={e.meetingLink} target="_blank" rel="noopener noreferrer">
                  Join ↗
                </a>
              ) : null}
            </div>
          ))
        )}
      </section>
    </>
  )
}
