/**
 * project-form-date-link-fields.tsx
 * Dates + Links sections.
 * Server component — no 'use client'.
 */
import type { Project } from './types'

interface Props {
  project?: Project
}

export function DateFields({ project: p }: Props) {
  return (
    <div className="admin-form__section">
      <h3 className="admin-form__section-title">Dates</h3>

      <div className="admin-form__row--3 admin-form__row">
        <div className="admin-form__group">
          <label htmlFor="pf-startDate" className="admin-form__label">Start date</label>
          <input
            id="pf-startDate"
            name="startDate"
            type="date"
            className="admin-form__input"
            defaultValue={p?.startDate ?? ''}
          />
        </div>

        <div className="admin-form__group">
          <label htmlFor="pf-targetDate" className="admin-form__label">Target date</label>
          <input
            id="pf-targetDate"
            name="targetDate"
            type="date"
            className="admin-form__input"
            defaultValue={p?.targetDate ?? ''}
          />
        </div>

        <div className="admin-form__group">
          <label htmlFor="pf-deliveredDate" className="admin-form__label">Delivered date</label>
          <input
            id="pf-deliveredDate"
            name="deliveredDate"
            type="date"
            className="admin-form__input"
            defaultValue={p?.deliveredDate ?? ''}
          />
        </div>
      </div>
    </div>
  )
}

export function LinkFields({ project: p }: Props) {
  return (
    <div className="admin-form__section">
      <h3 className="admin-form__section-title">Links</h3>

      <div className="admin-form__group">
        <label htmlFor="pf-url" className="admin-form__label">Live site — the site we built</label>
        <input
          id="pf-url"
          name="url"
          type="url"
          className="admin-form__input"
          defaultValue={p?.url ?? ''}
          placeholder="https://"
        />
      </div>

      <div className="admin-form__group">
        <label htmlFor="pf-currentWebsiteUrl" className="admin-form__label">
          Client&#39;s current / old site
        </label>
        <input
          id="pf-currentWebsiteUrl"
          name="currentWebsiteUrl"
          type="url"
          className="admin-form__input"
          defaultValue={p?.currentWebsiteUrl ?? ''}
          placeholder="https://"
        />
      </div>

      <div className="admin-form__group">
        <label htmlFor="pf-proposalUrl" className="admin-form__label">
          Proposal / demo site
        </label>
        <input
          id="pf-proposalUrl"
          name="proposalUrl"
          type="url"
          className="admin-form__input"
          defaultValue={p?.proposalUrl ?? ''}
          placeholder="https://"
        />
      </div>

      <div className="admin-form__group">
        <label htmlFor="pf-repoUrl" className="admin-form__label">GitHub repo</label>
        <input
          id="pf-repoUrl"
          name="repoUrl"
          type="url"
          className="admin-form__input"
          defaultValue={p?.repoUrl ?? ''}
          placeholder="https://github.com/..."
        />
      </div>
    </div>
  )
}
