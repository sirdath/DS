'use client'
/**
 * delete-button.tsx
 * Confirmation-guarded delete form for a project.
 */
import { deleteProjectAction } from './actions'

interface Props {
  id: string
  name: string
}

export function DeleteButton({ id, name }: Props) {
  const boundAction = deleteProjectAction.bind(null, id)

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (!confirm(`Delete "${name}" permanently? This cannot be undone.`)) {
      e.preventDefault()
    }
  }

  return (
    <div className="admin-danger-zone">
      <p className="admin-danger-zone__label">Danger zone</p>
      <form action={boundAction} onSubmit={handleSubmit}>
        <button type="submit" className="admin-btn-delete">
          Delete project
        </button>
      </form>
    </div>
  )
}
