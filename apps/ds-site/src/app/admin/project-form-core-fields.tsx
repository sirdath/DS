/**
 * project-form-core-fields.tsx
 * Core section: name, type, status, lead, completionPct.
 * Server component — no 'use client'.
 */
import type { Project } from './types'
import {
  PROJECT_TYPES,
  PROJECT_TYPE_LABELS,
  PROJECT_STATUSES,
  STATUS_LABELS,
} from './types'

interface Props {
  project?: Project
}

export function CoreFields({ project: p }: Props) {
  return (
    <div className="admin-form__section">
      <h3 className="admin-form__section-title">Core</h3>

      <div className="admin-form__group">
        <label htmlFor="pf-name" className="admin-form__label">
          Name <span className="admin-form__required" aria-hidden="true">*</span>
        </label>
        <input
          id="pf-name"
          name="name"
          type="text"
          required
          className="admin-form__input"
          defaultValue={p?.name ?? ''}
          placeholder="Project name"
          autoComplete="off"
        />
      </div>

      <div className="admin-form__row">
        <div className="admin-form__group">
          <label htmlFor="pf-projectType" className="admin-form__label">Project type</label>
          <select
            id="pf-projectType"
            name="projectType"
            className="admin-form__select"
            defaultValue={p?.projectType ?? 'website'}
          >
            {PROJECT_TYPES.map((t) => (
              <option key={t} value={t}>{PROJECT_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        <div className="admin-form__group">
          <label htmlFor="pf-status" className="admin-form__label">Status</label>
          <select
            id="pf-status"
            name="status"
            className="admin-form__select"
            defaultValue={p?.status ?? 'lead'}
          >
            {PROJECT_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="admin-form__row">
        <div className="admin-form__group">
          <label htmlFor="pf-lead" className="admin-form__label">Lead owner</label>
          <input
            id="pf-lead"
            name="lead"
            type="text"
            className="admin-form__input"
            defaultValue={p?.lead ?? 'Dimitris'}
            placeholder="Dimitris"
            autoComplete="off"
          />
        </div>

        <div className="admin-form__group">
          <label htmlFor="pf-completionPct" className="admin-form__label">
            Completion %
          </label>
          <input
            id="pf-completionPct"
            name="completionPct"
            type="number"
            min={0}
            max={100}
            className="admin-form__input"
            defaultValue={p?.completionPct ?? 0}
          />
        </div>
      </div>
    </div>
  )
}
