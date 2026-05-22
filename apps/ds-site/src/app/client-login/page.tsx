'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function LockIcon() {
  return (
    <svg width="52" height="60" viewBox="0 0 52 60" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="26" width="46" height="34" rx="5" stroke="rgba(255,255,255,0.6)" strokeWidth="2" fill="none" />
      <path d="M13 26V19C13 9.5 39 9.5 39 19V26" stroke="rgba(255,255,255,0.6)" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="26" cy="41" r="4.5" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" fill="none" />
      <line x1="26" y1="45.5" x2="26" y2="51" stroke="rgba(255,255,255,0.6)" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}


function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 2 * 60 * 1000
const LS_ATTEMPTS = 'client_attempts'
const LS_LOCKOUT = 'client_lockout'

function getRemainingLockout(): number {
  const until = parseInt(localStorage.getItem(LS_LOCKOUT) ?? '0', 10)
  return Math.max(0, until - Date.now())
}

function getAttempts(): number {
  return parseInt(localStorage.getItem(LS_ATTEMPTS) ?? '0', 10)
}

function LoginForm() {
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const [lockedOut, setLockedOut] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)
  const router = useRouter()
  const searchParams = useSearchParams()

  // Pick a per-client backdrop from where the visitor was headed.
  const redirectParam = searchParams.get('redirect') ?? ''
  const client = redirectParam.startsWith('/MegaGym-Website')
    ? 'megagym'
    : redirectParam.startsWith('/samioglou')
      ? 'samioglou'
      : null

  useEffect(() => {
    const check = () => {
      const remaining = getRemainingLockout()
      if (remaining > 0) {
        setLockedOut(true)
        setSecondsLeft(Math.ceil(remaining / 1000))
      } else {
        setLockedOut(false)
        setSecondsLeft(0)
      }
    }
    check()
    const interval = setInterval(check, 1000)
    return () => clearInterval(interval)
  }, [])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!password || loading || lockedOut) return
    if (getRemainingLockout() > 0) return

    setError(false)
    setLoading(true)

    try {
      const res = await fetch('/api/client-auth/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })

      if (!res.ok) {
        const attempts = getAttempts() + 1
        localStorage.setItem(LS_ATTEMPTS, String(attempts))
        if (attempts >= MAX_ATTEMPTS) {
          localStorage.setItem(LS_LOCKOUT, String(Date.now() + LOCKOUT_MS))
          localStorage.setItem(LS_ATTEMPTS, '0')
        }
        setError(true)
        setLoading(false)
        return
      }

      // Reset attempt counter on success
      localStorage.setItem(LS_ATTEMPTS, '0')

      const { redirect: passwordRedirect } = await res.json()
      // Deep-link from middleware takes priority; fall back to the password's destination
      const redirect = searchParams.get('redirect') ?? passwordRedirect ?? '/clients'

      // Prime sessionStorage so the MegaGym preloader skips itself when the
      // user navigates into /MegaGym-Website. Same origin, so it's readable
      // there; harmless no-op for any other client.
      try {
        sessionStorage.setItem('megagym-loaded', '1')
      } catch {
        /* private browsing or quota — non-fatal */
      }

      router.push(redirect)
    } catch {
      setError(true)
      setLoading(false)
    }
  }, [password, loading, lockedOut, router, searchParams])

  return (
    <div className="lock-shell">
      <div className={`lock-bg${client ? ` lock-bg--${client}` : ''}`} aria-hidden="true" />

      {/* Password card */}
      <div className="lock-overlay">
        <div className="lock-card">
          <LockIcon />

          <div className="lock-brand">
            <img src="/logos/ds2-white.png" alt="DS2" />
          </div>

          <h1 className="lock-title">This content is protected.</h1>
          <p className="lock-sub">To view, please enter the password.</p>

          <form onSubmit={handleSubmit} className="lock-form">
            <div className={`lock-input-wrap ${lockedOut ? 'is-locked' : ''}`}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={lockedOut ? `Try again in ${secondsLeft}s` : 'Enter password'}
                disabled={loading || lockedOut}
                autoFocus
                className="lock-input"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="lock-eye"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                <EyeIcon open={showPassword} />
              </button>
              <button
                type="submit"
                disabled={loading || !password || lockedOut}
                className="lock-submit"
                aria-label="Submit"
              >
                →
              </button>
            </div>

            {lockedOut && (
              <p className="lock-error">Too many attempts. Try again in {secondsLeft}s.</p>
            )}
            {error && !lockedOut && (
              <p className="lock-error">
                Incorrect password. {MAX_ATTEMPTS - getAttempts()} attempt{MAX_ATTEMPTS - getAttempts() !== 1 ? 's' : ''} remaining.
              </p>
            )}
          </form>
        </div>

        <p className="lock-foot">DS2 · DIGITAL SOLUTIONS CONSULTING</p>
      </div>
    </div>
  )
}

export default function ClientLogin() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
