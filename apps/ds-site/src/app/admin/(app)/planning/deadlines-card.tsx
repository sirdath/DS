'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createDeadline, type DeadlineInput, deleteDeadline, updateDeadline } from '@/app/admin/planning-actions'
import { type Deadline, countdown, metricPct } from './lib/planning'
import { METRIC_SOURCE_OPTIONS, type MetricSources, metricSourceLabel, resolveDeadlineCurrent } from './lib/metric-source'
import './planning.css'

function DeadlineForm({
  initial,
  sources,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  initial?: Deadline
  sources?: MetricSources | null
  submitLabel: string
  onSubmit: (input: DeadlineInput) => Promise<void>
  onCancel: () => void
}) {
  const [kind, setKind] = useState<'date' | 'metric'>(initial?.kind ?? 'date')
  const [title, setTitle] = useState(initial?.title ?? '')
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? '')
  const [current, setCurrent] = useState(initial?.metricCurrent != null ? String(initial.metricCurrent) : '')
  const [target, setTarget] = useState(initial?.metricTarget != null ? String(initial.metricTarget) : '')
  const [unit, setUnit] = useState(initial?.metricUnit || 'EUR')
  const [source, setSource] = useState(initial?.metricSource ?? '')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (!title.trim() || busy) return
    setBusy(true)
    try {
      await onSubmit({ kind, title, dueDate, metricCurrent: current, metricTarget: target, metricUnit: unit, metricSource: source })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="plan-form">
      <div className="plan-kind" role="group" aria-label="Deadline type">
        <button type="button" className={kind === 'date' ? 'is-on' : ''} onClick={() => setKind('date')}>
          Date
        </button>
        <button type="button" className={kind === 'metric' ? 'is-on' : ''} onClick={() => setKind('metric')}>
          Metric
        </button>
      </div>
      <input
        className="plan-input"
        placeholder="What has to happen…"
        value={title}
        maxLength={200}
        onChange={(e) => setTitle(e.target.value)}
        aria-label="Deadline title"
      />
      {kind === 'date' ? (
        <div className="plan-form__row">
          <input className="plan-input" type="date" value={dueDate ?? ''} onChange={(e) => setDueDate(e.target.value)} aria-label="Due date" />
        </div>
      ) : (
        <>
          <div className="plan-form__row">
            <select
              className="plan-select"
              value={source}
              onChange={(e) => {
                const next = e.target.value
                // Switching back to manual: seed the field with the live figure it was showing,
                // so you edit a real number instead of stale/blank hidden state.
                if (next === '' && source !== '' && sources) {
                  const live = sources[source as keyof MetricSources]
                  if (typeof live === 'number') setCurrent(String(live))
                }
                setSource(next)
              }}
              aria-label="Track from"
            >
              {METRIC_SOURCE_OPTIONS.map((o) => (
                <option key={o.key} value={o.key}>
                  {o.key === '' ? 'Manual number' : `Auto: ${o.label}`}
                </option>
              ))}
            </select>
          </div>
          <div className="plan-form__row">
            {source === '' ? (
              <input className="plan-input" type="number" inputMode="decimal" placeholder="Now" value={current} onChange={(e) => setCurrent(e.target.value)} aria-label="Current amount" />
            ) : null}
            <input className="plan-input" type="number" inputMode="decimal" placeholder="Target" value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Target amount" />
            <input className="plan-input" placeholder="Unit" value={unit} maxLength={12} onChange={(e) => setUnit(e.target.value)} aria-label="Unit" />
          </div>
        </>
      )}
      <div className="plan-form__actions">
        <button type="button" className="plan-btn" onClick={() => void submit()} disabled={busy}>
          {busy ? 'Saving…' : submitLabel}
        </button>
        <button type="button" className="plan-btn plan-btn--ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  )
}

function fmtAmount(n: number | null, unit: string): string {
  if (n == null) return '–'
  const v = n.toLocaleString('en-GB')
  return unit ? `${v} ${unit}` : v
}

export function DeadlinesCard({ deadlines, sources }: { deadlines: Deadline[]; sources?: MetricSources | null }) {
  const router = useRouter()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)

  async function onAdd(input: DeadlineInput) {
    await createDeadline(input)
    setAdding(false)
    router.refresh()
  }

  async function onEdit(id: string, input: DeadlineInput) {
    await updateDeadline(id, {
      kind: input.kind,
      title: input.title,
      dueDate: input.dueDate,
      metricCurrent: input.metricCurrent,
      metricTarget: input.metricTarget,
      metricUnit: input.metricUnit,
      metricSource: input.metricSource,
    })
    setEditing(null)
    router.refresh()
  }

  async function onDelete(id: string) {
    if (!window.confirm('Delete this deadline?')) return
    await deleteDeadline(id)
    router.refresh()
  }

  return (
    <section className="ds2-card">
      <div className="ds2-list__head">
        <span className="ds2-list__title">Deadlines</span>
        {!adding ? (
          <button type="button" className="plan-addbtn" onClick={() => setAdding(true)}>
            + Add
          </button>
        ) : null}
      </div>

      {adding ? <DeadlineForm sources={sources} submitLabel="Add deadline" onSubmit={onAdd} onCancel={() => setAdding(false)} /> : null}

      {deadlines.length === 0 && !adding ? <p className="ds2-empty">No deadlines yet. Add one to track it here.</p> : null}

      {deadlines.map((d) => {
        if (editing === d.id) {
          return <DeadlineForm key={d.id} initial={d} sources={sources} submitLabel="Save" onSubmit={(input) => onEdit(d.id, input)} onCancel={() => setEditing(null)} />
        }
        const cd = countdown(d.dueDate)
        const current = resolveDeadlineCurrent(d, sources)
        return (
          <div className="plan-row" key={d.id}>
            <div className="plan-row__main">
              <span className={`plan-row__title${d.done ? ' is-done' : ''}`} translate="no">
                {d.title}
              </span>
              {d.kind === 'date' ? (
                <span className="plan-meta">
                  <span className={`ds-chip${cd.tone === 'soon' ? ' ds-chip--soon' : cd.tone === 'over' ? ' ds-chip--over' : ''}`}>{cd.label || 'No date'}</span>
                </span>
              ) : (
                <>
                  <span className="ds-progress">
                    <span className="ds-progress__track">
                      <span className="ds-progress__fill" style={{ width: `${metricPct(current, d.metricTarget)}%` }} />
                    </span>
                    <span className="ds-progress__label">
                      {fmtAmount(current, d.metricUnit)} / {fmtAmount(d.metricTarget, d.metricUnit)}
                    </span>
                  </span>
                  {d.metricSource ? (
                    <span className="plan-meta">
                      <span className="ds-chip ds-chip--accent">Auto · {metricSourceLabel(d.metricSource)}</span>
                    </span>
                  ) : null}
                </>
              )}
            </div>
            <div className="plan-row__actions">
              <button type="button" className="plan-iconbtn" aria-label="Edit deadline" onClick={() => setEditing(d.id)}>
                ✎
              </button>
              <button type="button" className="plan-iconbtn" aria-label="Delete deadline" onClick={() => void onDelete(d.id)}>
                ✕
              </button>
            </div>
          </div>
        )
      })}
    </section>
  )
}
