'use client'
/**
 * confirm-button.tsx
 * Generic confirm-guarded form button.
 * Used for archive (neutral), restore (no confirm), and delete-permanently (danger).
 */

interface Props {
  action: (fd: FormData) => void | Promise<void>
  label: string
  confirmText: string
  variant?: 'danger' | 'neutral'
}

export function ConfirmButton({ action, label, confirmText, variant = 'neutral' }: Props) {
  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (confirmText !== '' && !confirm(confirmText)) {
      e.preventDefault()
    }
  }

  const btnClass = variant === 'danger' ? 'admin-btn-delete' : 'admin-btn-archive'

  return (
    <form action={action} onSubmit={handleSubmit}>
      <button type="submit" className={btnClass}>
        {label}
      </button>
    </form>
  )
}
