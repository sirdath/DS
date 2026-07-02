'use client'

import { useState } from 'react'
import { updateEvent } from '../../calendar-actions'
import { ASSIGNEES, MEETING_TYPES } from './lib/calendar'
import { CANONICAL_TZ, toCanonical } from './lib/tz'
import type { DisplayEvent } from './calendar-views'

const COLORS = [
  { key: 'default', label: 'General' },
  { key: 'meeting', label: 'Meeting' },
  { key: 'deadline', label: 'Deadline' },
  { key: 'personal', label: 'Personal' },
] as const

/** In-place editor for one event. Times are edited in the viewing timezone and
 *  converted back to the canonical zone (Europe/Athens) on save. */
export function EventEditForm({ event: e, tz, onDone }: { event: DisplayEvent; tz: string; onDone: () => void }) {
  const [title, setTitle] = useState(e.title)
  const [date, setDate] = useState(e.dispDate)
  const [start, setStart] = useState(e.dispStart ?? '')
  const [end, setEnd] = useState(e.dispEnd ?? '')
  const [color, setColor] = useState(e.color)
  const [assignee, setAssignee] = useState(e.assignee)
  const [meetingType, setMeetingType] = useState(e.meetingType)
  const [meetingLink, setMeetingLink] = useState(e.meetingLink)
  const [note, setNote] = useState(e.description)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function save() {
    if (!title.trim() || !date || busy) return
    // end_time is time-only in the DB — an end at/before the start would store an
    // incoherent row. Overnight events: leave the end empty.
    if (start && end && end <= start) {
      setErr('End must be after the start. For overnight events, leave the end time empty.')
      return
    }
    setErr(null)
    setBusy(true)
    try {
      const canonical = toCanonical(date, start || null, tz)
      // End time shares the (possibly date-shifted) start conversion's zone math.
      const canonicalEnd = start && end ? toCanonical(date, end, tz).time : ''
      await updateEvent(e.id, {
        title,
        description: note,
        eventDate: canonical.date,
        startTime: canonical.time || null,
        endTime: canonicalEnd || null,
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
      <textarea
        className="cal__input cal__note"
        placeholder="Notes — call link, agenda, anything…"
        value={note}
        maxLength={2000}
        rows={2}
        onChange={(ev) => setNote(ev.target.value)}
        aria-label="Event notes"
      />
      {tz !== CANONICAL_TZ ? <p className="cal__tzhint">Times entered in {tz.split('/')[1] ?? tz}; stored as Athens time.</p> : null}
      {err ? (
        <p className="cal__formerr" role="alert">
          {err}
        </p>
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
