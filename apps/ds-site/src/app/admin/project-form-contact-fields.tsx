/**
 * project-form-contact-fields.tsx
 * Client contact + Notes sections.
 * Server component — no 'use client'.
 */
import type { Project } from './types'

interface Props {
  project?: Project
}

export function ContactFields({ project: p }: Props) {
  return (
    <div className="admin-form__section">
      <h3 className="admin-form__section-title">Client contact</h3>

      <div className="admin-form__row">
        <div className="admin-form__group">
          <label htmlFor="pf-clientCompany" className="admin-form__label">Company</label>
          <input
            id="pf-clientCompany"
            name="clientCompany"
            type="text"
            className="admin-form__input"
            defaultValue={p?.clientCompany ?? ''}
            placeholder="Company name"
          />
        </div>

        <div className="admin-form__group">
          <label htmlFor="pf-clientContact" className="admin-form__label">Contact name</label>
          <input
            id="pf-clientContact"
            name="clientContact"
            type="text"
            className="admin-form__input"
            defaultValue={p?.clientContact ?? ''}
            placeholder="Full name"
          />
        </div>
      </div>

      <div className="admin-form__row">
        <div className="admin-form__group">
          <label htmlFor="pf-clientEmail" className="admin-form__label">Email</label>
          <input
            id="pf-clientEmail"
            name="clientEmail"
            type="email"
            className="admin-form__input"
            defaultValue={p?.clientEmail ?? ''}
            placeholder="email@example.com"
            autoComplete="off"
          />
        </div>

        <div className="admin-form__group">
          <label htmlFor="pf-clientPhone" className="admin-form__label">Phone</label>
          <input
            id="pf-clientPhone"
            name="clientPhone"
            type="tel"
            className="admin-form__input"
            defaultValue={p?.clientPhone ?? ''}
            placeholder="+30 ..."
          />
        </div>
      </div>
    </div>
  )
}

export function NotesFields({ project: p }: Props) {
  return (
    <div className="admin-form__section">
      <h3 className="admin-form__section-title">Notes</h3>

      <div className="admin-form__group">
        <label htmlFor="pf-notes" className="admin-form__label">Notes</label>
        <textarea
          id="pf-notes"
          name="notes"
          className="admin-form__textarea"
          defaultValue={p?.notes ?? ''}
          placeholder="Project notes…"
          rows={4}
        />
      </div>
    </div>
  )
}
