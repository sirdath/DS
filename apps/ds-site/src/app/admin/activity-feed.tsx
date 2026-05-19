/**
 * activity-feed.tsx
 * Collaboration log: list of activity entries + "Add update" form.
 * Server component.
 */
import type { ProjectActivity } from './types'
import { addActivityAction } from './actions'
import { relativeAge } from './format'

interface Props {
  projectId: string
  activity: ProjectActivity[]
}

export function ActivityFeed({ projectId, activity }: Props) {
  const boundAdd = addActivityAction.bind(null, projectId)

  return (
    <div className="admin-activity">
      <h2 className="admin-activity__title">Activity log</h2>

      {activity.length === 0 ? (
        <p className="admin-activity__empty">No updates yet. Add the first one below.</p>
      ) : (
        <div className="admin-activity__list">
          {activity.map((entry) => (
            <div key={entry.id} className="admin-activity__item">
              <div className="admin-activity__meta">
                <span className="admin-activity__author">{entry.author}</span>
                <span className="admin-activity__age">{relativeAge(entry.createdAt)}</span>
              </div>
              <p className="admin-activity__body">{entry.body}</p>
            </div>
          ))}
        </div>
      )}

      <form action={boundAdd} className="admin-activity__form">
        <div className="admin-activity__form-row">
          <div className="admin-form__group">
            <label htmlFor="af-author" className="admin-form__label">Your name</label>
            <input
              id="af-author"
              name="author"
              type="text"
              className="admin-form__input"
              placeholder="Your name"
              defaultValue=""
              autoComplete="off"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button type="submit" className="admin-form__submit" style={{ width: '100%' }}>
              Add update
            </button>
          </div>
        </div>

        <div className="admin-form__group">
          <label htmlFor="af-body" className="admin-form__label">Update</label>
          <textarea
            id="af-body"
            name="body"
            className="admin-form__textarea"
            placeholder="What happened? What&#39;s next?"
            rows={3}
            required
          />
        </div>
      </form>
    </div>
  )
}
