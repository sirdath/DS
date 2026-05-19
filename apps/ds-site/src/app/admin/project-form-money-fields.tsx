/**
 * project-form-money-fields.tsx
 * Money section: contractValue, amountPaid, retainerMonthly.
 * Server component — no 'use client'.
 */
import type { Project } from './types'

interface Props {
  project?: Project
}

export function MoneyFields({ project: p }: Props) {
  return (
    <div className="admin-form__section">
      <h3 className="admin-form__section-title">Money</h3>

      <div className="admin-form__row--3 admin-form__row">
        <div className="admin-form__group">
          <label htmlFor="pf-contractValue" className="admin-form__label">
            Contract value €
          </label>
          <input
            id="pf-contractValue"
            name="contractValue"
            type="number"
            min={0}
            step={100}
            className="admin-form__input"
            defaultValue={p?.contractValue ?? 0}
          />
        </div>

        <div className="admin-form__group">
          <label htmlFor="pf-amountPaid" className="admin-form__label">
            Amount paid €
          </label>
          <input
            id="pf-amountPaid"
            name="amountPaid"
            type="number"
            min={0}
            step={100}
            className="admin-form__input"
            defaultValue={p?.amountPaid ?? 0}
          />
        </div>

        <div className="admin-form__group">
          <label htmlFor="pf-retainerMonthly" className="admin-form__label">
            Retainer €/mo
          </label>
          <input
            id="pf-retainerMonthly"
            name="retainerMonthly"
            type="number"
            min={0}
            step={50}
            className="admin-form__input"
            defaultValue={p?.retainerMonthly ?? ''}
            placeholder="Leave blank if none"
          />
        </div>
      </div>
    </div>
  )
}
