'use client'
/* eslint-disable @next/next/no-img-element */

import { useState, useTransition } from 'react'
import { LEAD_STATUSES, LEAD_STATUS_LABELS, TIER_LABEL, type RedesignTarget, type VisionTier } from './lib/leads-types'
import { setTargetFlag, setTargetStatus, deleteTarget, promoteTargetToProject } from './hunt-actions'

export function HuntGrid({ targets, shotBase }: { targets: RedesignTarget[]; shotBase: string }) {
  return (
    <div className="admin-hunt-grid">
      {targets.map((t) => <HuntCard key={t.id} target={t} shotBase={shotBase} />)}
    </div>
  )
}

function HuntCard({ target: t, shotBase }: { target: RedesignTarget; shotBase: string }) {
  const [pending, start] = useTransition()
  const [gone, setGone] = useState(false)
  if (gone) return null
  const run = (fn: () => Promise<unknown>) => start(() => { void fn() })

  const tier = (t.visionTier as VisionTier) || null
  const tierClass = tier ? `is-${tier}` : 'is-unscored'
  const shot = t.screenshotPath ? `${shotBase}/${t.screenshotPath}` : null

  return (
    <article className={`admin-hunt-card${pending ? ' is-busy' : ''}`}>
      <a className="admin-hunt-card__shot" href={t.website} target="_blank" rel="noopener noreferrer" title={`Visit ${t.website}`}>
        {shot
          ? <img src={shot} alt={`${t.name} website`} loading="lazy" />
          : <div className="admin-hunt-card__noshot">no screenshot</div>}
        <span className={`admin-hunt-badge ${tierClass}`}>
          {tier ? TIER_LABEL[tier] : '· unscored'}{t.visionScore != null && ` ${t.visionScore}/10`}
        </span>
      </a>

      <div className="admin-hunt-card__body">
        <div className="admin-hunt-card__name">{t.name}</div>
        <div className="admin-hunt-card__meta">{[t.industry, t.area].filter(Boolean).join(' · ')}</div>
        {t.visionNotes && <div className="admin-hunt-card__notes">{t.visionNotes}</div>}
        <div className="admin-hunt-card__contact">
          {t.phone && <a href={`tel:${t.phone}`}>{t.phone}</a>}
          {t.email && <a href={`mailto:${t.email}`}>{t.email}</a>}
          <a href={t.website} target="_blank" rel="noopener noreferrer">visit ↗</a>
        </div>
        <div className="admin-hunt-card__actions">
          <label className="admin-hunt-card__chk">
            <input type="checkbox" defaultChecked={t.contacted} onChange={(e) => run(() => setTargetFlag(t.id, 'contacted', e.target.checked))} />
            contacted
          </label>
          <select className="admin-leads-select" defaultValue={t.status} onChange={(e) => run(() => setTargetStatus(t.id, e.target.value))}>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
          </select>
          <button type="button" title="Promote to a project" onClick={() => run(() => promoteTargetToProject(t.id))}>↑</button>
          <button type="button" className="danger" title="Bin" onClick={() => {
            if (confirm(`Remove "${t.name}"?`)) { setGone(true); void deleteTarget(t.id) }
          }}>✕</button>
        </div>
      </div>
    </article>
  )
}
