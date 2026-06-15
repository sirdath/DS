'use client'

import { useActionState } from 'react'
import { type LoginState, workspaceLoginAction } from './login-action'

const INITIAL: LoginState = { ok: false, error: '' }

export default function WorkspaceLoginPage() {
  const [state, action, pending] = useActionState(
    (_prev: LoginState, formData: FormData) => workspaceLoginAction(formData),
    INITIAL,
  )

  return (
    <div className="ws-login">
      <form className="ws-login__card" action={action}>
        <div className="ws-login__title">Workspace</div>
        <p className="ws-login__sub">Sign in to open your tools.</p>

        <div className="ws-field">
          <label htmlFor="ws-email">Email</label>
          <input
            id="ws-email"
            name="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            required
          />
        </div>

        <div className="ws-field">
          <label htmlFor="ws-password">Password</label>
          <input id="ws-password" name="password" type="password" autoComplete="current-password" required />
        </div>

        <button className="ws-login__submit" type="submit">
          {pending ? 'Signing in…' : 'Sign in'}
        </button>

        {state.error ? (
          <p className="ws-login__error" role="alert" aria-live="polite">
            {state.error}
          </p>
        ) : null}
      </form>
    </div>
  )
}
