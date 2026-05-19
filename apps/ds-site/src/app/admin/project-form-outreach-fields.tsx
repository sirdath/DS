/**
 * project-form-outreach-fields.tsx
 * Outreach section: stage, estimatedValue, source, whyThem.
 * Server component — no 'use client'.
 */
import type { Project } from './types'
import { OUTREACH_STAGES, OUTREACH_LABELS } from './types'

interface Props {
  project?: Project
}

export function OutreachFields({ project: p }: Props) {
  return (
    <div className="admin-form__section">
      <h3 className="admin-form__section-title">Outreach (leads)</h3>

      <div className="admin-form__row">
        <div className="admin-form__group">
          <label htmlFor="pf-outreachStage" className="admin-form__label">Outreach stage</label>
          <select
            id="pf-outreachStage"
            name="outreachStage"
            className="admin-form__select"
            defaultValue={p?.outreachStage ?? ''}
          >
            <option value="">— none —</option>
            {OUTREACH_STAGES.map((s) => (
              <option key={s} value={s}>{OUTREACH_LABELS[s]}</option>
            ))}
          </select>
        </div>

        <div className="admin-form__group">
          <label htmlFor="pf-estimatedValue" className="admin-form__label">
            Estimated value €
          </label>
          <input
            id="pf-estimatedValue"
            name="estimatedValue"
            type="number"
            min={0}
            step={500}
            className="admin-form__input"
            defaultValue={p?.estimatedValue ?? ''}
            placeholder="Leave blank if unknown"
          />
        </div>
      </div>

      <div className="admin-form__group">
        <label htmlFor="pf-source" className="admin-form__label">Source</label>
        <input
          id="pf-source"
          name="source"
          type="text"
          className="admin-form__input"
          defaultValue={p?.source ?? ''}
          placeholder="e.g. Referral, Cold target, Inbound"
        />
      </div>

      <div className="admin-form__group">
        <label htmlFor="pf-whyThem" className="admin-form__label">Why them</label>
        <textarea
          id="pf-whyThem"
          name="whyThem"
          className="admin-form__textarea"
          defaultValue={p?.whyThem ?? ''}
          placeholder="Why is this a strong opportunity?"
          rows={3}
        />
      </div>
    </div>
  )
}
