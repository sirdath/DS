'use client'

import { useTransition } from 'react'
import { markContacted } from '@/app/admin/outreach-actions'
import type { MarketingLead } from '@/app/admin/lib/leads-types'
import type { BriefFull, BriefMeta } from './outreach-types'

interface Props {
  lead: MarketingLead | null
  current: BriefFull | null
  history: BriefMeta[]
  model: 'opus' | 'sonnet'
}

function fmtDate(iso: string): string {
  const t = Date.parse(iso)
  return Number.isFinite(t) ? new Date(t).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'
}
function shortModel(m: string | null): string {
  if (!m) return '—'
  return m.includes('opus') ? 'Opus' : m.includes('sonnet') ? 'Sonnet' : m
}

export function OutreachBriefView({ lead, current, history, model }: Props) {
  const [pending, start] = useTransition()
  const latest = history[0]
  const brief = current?.brief ?? null
  const sources = current?.sources ?? []

  if (!lead) {
    return (
      <section className="admin-outreach__brief is-empty">
        <p className="admin-outreach__empty-title">Pick a lead and click Research</p>
        <p className="admin-outreach__empty-sub">A grounded company brief appears here — overview, pain points, an outreach angle, and talking points.</p>
      </section>
    )
  }

  const conf = current?.confidence ?? null
  const preliminary = conf != null && conf < 0.6

  return (
    <section className="admin-outreach__brief">
      <div className="admin-outreach__brief-head">
        <div>
          <p className="admin-outreach__brief-eyebrow">Brief</p>
          <h2 className="admin-outreach__brief-title" translate="no">{lead.name}</h2>
        </div>
        {current && (
          <div className="admin-outreach__brief-stats">
            {conf != null && <span className={`admin-outreach__conf ${preliminary ? 'is-low' : ''}`}>conf {conf.toFixed(2)}</span>}
            <span className="admin-outreach__cost">${current.costUsd.toFixed(3)}</span>
            <span className="admin-outreach__modeltag">{shortModel(current.model)}</span>
          </div>
        )}
      </div>

      {!brief ? (
        <div className="admin-outreach__state">
          {latest?.status === 'researching' ? (
            <p>Researching with {shortModel(model === 'opus' ? 'opus' : 'sonnet')}… this can take up to a minute. The page refreshes when it’s ready.</p>
          ) : latest?.status === 'failed' ? (
            <p className="admin-outreach__state--err">The last run failed{latest?.error ? `: ${latest.error}` : ''}. Hit Research to retry.</p>
          ) : (
            <p>No brief yet. Choose a model on the left and click <strong>Research</strong>.</p>
          )}
        </div>
      ) : (
        <div className="admin-outreach__brief-body">
          {preliminary && (
            <p className="admin-outreach__prelim">Preliminary — confidence {conf?.toFixed(2)}. Verify before quoting; see gaps below.</p>
          )}

          <h3 className="admin-outreach__h3">Overview</h3>
          <p>{brief.overview}</p>
          <h3 className="admin-outreach__h3">What they do</h3>
          <p>{brief.whatTheyDo}</p>
          <h3 className="admin-outreach__h3">Ideal customers</h3>
          <p>{brief.idealCustomers}</p>

          <h3 className="admin-outreach__h3">Pain points</h3>
          <ul className="admin-outreach__pains">
            {brief.painPoints.map((p, i) => (
              <li key={i}>
                <span className={`admin-outreach__sev is-${p.severity}`}>{p.severity}</span>
                <span><strong>{p.title}</strong> — {p.detail}</span>
              </li>
            ))}
          </ul>

          <h3 className="admin-outreach__h3">Market environment</h3>
          <p>{brief.marketEnvironment}</p>
          {brief.competitors.length > 0 && (
            <p className="admin-outreach__inline"><span className="admin-outreach__lbl">Competitors:</span> {brief.competitors.join(', ')}</p>
          )}
          {brief.recentSignals.length > 0 && (
            <>
              <h3 className="admin-outreach__h3">Recent signals</h3>
              <ul className="admin-outreach__bullets">{brief.recentSignals.map((s, i) => <li key={i}>{s}</li>)}</ul>
            </>
          )}

          <h3 className="admin-outreach__h3">Outreach angle</h3>
          <p className="admin-outreach__angle">{brief.outreachAngle}</p>

          <h3 className="admin-outreach__h3">Talking points</h3>
          <ul className="admin-outreach__bullets">{brief.talkingPoints.map((t, i) => <li key={i}>{t}</li>)}</ul>

          {brief.emailSeeds.length > 0 && (
            <>
              <h3 className="admin-outreach__h3">Email seeds</h3>
              <ul className="admin-outreach__bullets">{brief.emailSeeds.map((e, i) => <li key={i}>{e}</li>)}</ul>
            </>
          )}
          {brief.gaps.length > 0 && (
            <>
              <h3 className="admin-outreach__h3">Gaps</h3>
              <ul className="admin-outreach__bullets admin-outreach__gaps">{brief.gaps.map((g, i) => <li key={i}>{g}</li>)}</ul>
            </>
          )}

          <h3 className="admin-outreach__h3">Sources</h3>
          {sources.length === 0 ? (
            <p className="admin-outreach__inline">No external sources consulted.</p>
          ) : (
            <ul className="admin-outreach__sources">
              {sources.map((s, i) => (
                <li key={i}><a href={s.url} target="_blank" rel="noopener noreferrer">{s.title || s.url}</a></li>
              ))}
            </ul>
          )}
        </div>
      )}

      {history.length > 0 && (
        <details className="admin-outreach__history">
          <summary>History — {history.length} run{history.length === 1 ? '' : 's'}</summary>
          <ul>
            {history.map((h) => (
              <li key={h.id}>
                <span>{fmtDate(h.createdAt)}</span>
                <span>{shortModel(h.model)}{h.profile ? ` · ${h.profile}` : ''}</span>
                <span className={`admin-outreach__pill is-${h.status}`}>{h.status}</span>
                {h.confidence != null && <span>conf {h.confidence.toFixed(2)}</span>}
                {h.isCurrent && <span className="admin-outreach__cur">current</span>}
              </li>
            ))}
          </ul>
        </details>
      )}

      <div className="admin-outreach__actions">
        <button type="button" className="admin-new-btn" disabled title="Phase 4 — coming soon">Draft sales email</button>
        <button
          type="button"
          className="admin-outreach__contact"
          onClick={() => start(() => void markContacted(lead.id))}
          disabled={pending || lead.contacted}
        >
          {lead.contacted ? 'Contacted ✓' : pending ? 'Saving…' : 'Mark contacted'}
        </button>
        {lead.phone && <a className="admin-outreach__phone" href={`tel:${lead.phone}`}>Call {lead.phone}</a>}
      </div>
    </section>
  )
}
