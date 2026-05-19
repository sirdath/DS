'use client'

import { Suspense, useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { loginAction } from './login-action'

// ── Attempt / lockout helpers (client-side UX only — no real security) ───────
// TODO(Phase 4): remove these once real Supabase rate-limiting is in place.
const MAX_ATTEMPTS = 5
const LOCKOUT_MS = 2 * 60 * 1000
const LS_ATTEMPTS = 'admin_attempts'
const LS_LOCKOUT = 'admin_lockout'

// SSR-safe: localStorage is browser-only and Next still server-renders this
// 'use client' module once. A `typeof window === 'undefined'` guard gets
// dead-code-eliminated in client modules by the bundler, so we use try/catch
// (opaque to the bundler) — on the server the bare `localStorage` reference
// throws ReferenceError, which we swallow and return 0.
function getRemainingLockout(): number {
  try {
    const until = parseInt(localStorage.getItem(LS_LOCKOUT) ?? '0', 10)
    return Math.max(0, until - Date.now())
  } catch {
    return 0
  }
}

function getAttempts(): number {
  try {
    return parseInt(localStorage.getItem(LS_ATTEMPTS) ?? '0', 10)
  } catch {
    return 0
  }
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function AdminLockIcon() {
  return (
    <svg
      width="48"
      height="56"
      viewBox="0 0 48 56"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      {/* Body */}
      <rect
        x="2"
        y="24"
        width="44"
        height="30"
        rx="5"
        stroke="var(--admin-amber)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.7"
      />
      {/* Shackle */}
      <path
        d="M12 24V18C12 9 36 9 36 18V24"
        stroke="var(--admin-amber)"
        strokeWidth="1.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.7"
      />
      {/* Keyhole circle */}
      <circle
        cx="24"
        cy="37"
        r="4"
        stroke="var(--admin-amber)"
        strokeWidth="1.4"
        fill="none"
        opacity="0.9"
      />
      {/* Keyhole stem */}
      <line
        x1="24"
        y1="41"
        x2="24"
        y2="46"
        stroke="var(--admin-amber)"
        strokeWidth="1.4"
        strokeLinecap="round"
        opacity="0.9"
      />
    </svg>
  )
}

function CheckIcon() {
  return (
    <svg
      width="36"
      height="36"
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="18"
        cy="18"
        r="16"
        stroke="rgba(255,255,255,0.18)"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M11 18.5l5 5 9-10"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  )
}

function EyeIcon({ open }: { open: boolean }) {
  return open ? (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  )
}

// ── Main login form ───────────────────────────────────────────────────────────

function LoginForm() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [lockedOut, setLockedOut] = useState(false)
  const [secondsLeft, setSecondsLeft] = useState(0)

  const searchParams = useSearchParams()
  const isSignedOut = searchParams.get('signedout') === '1'
  const redirectParam = searchParams.get('redirect') ?? ''

  // Refs for GSAP targets
  const cardRef = useRef<HTMLDivElement>(null)
  const lockRef = useRef<HTMLDivElement>(null)
  const brandRef = useRef<HTMLDivElement>(null)
  const titleRef = useRef<HTMLDivElement>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const signedOutBannerRef = useRef<HTMLDivElement>(null)

  // ── Lockout timer ──────────────────────────────────────────────────────────
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

  // ── GSAP entrance animation ────────────────────────────────────────────────
  useEffect(() => {
    // Respect prefers-reduced-motion — show final state immediately
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      if (cardRef.current) cardRef.current.style.opacity = '1'
      if (lockRef.current) lockRef.current.style.opacity = '1'
      if (brandRef.current) brandRef.current.style.opacity = '1'
      if (titleRef.current) titleRef.current.style.opacity = '1'
      if (formRef.current) formRef.current.style.opacity = '1'
      if (signedOutBannerRef.current) {
        signedOutBannerRef.current.style.opacity = '1'
      }
      return
    }

    // Dynamically import GSAP to avoid SSR issues
    let ctx: { revert: () => void } | undefined
    void import('gsap').then(({ gsap }) => {
      ctx = gsap.context(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power3.out' } })

        // Card fades/scales in
        tl.fromTo(
          cardRef.current,
          { opacity: 0, y: 16, scale: 0.97 },
          { opacity: 1, y: 0, scale: 1, duration: 0.6 },
        )

        // Lock glyph fades slightly before form
        tl.fromTo(
          lockRef.current,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.45 },
          '-=0.35',
        )

        // Brand + title stagger in
        tl.fromTo(
          [brandRef.current, titleRef.current],
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.4, stagger: 0.1 },
          '-=0.28',
        )

        // Form slides in last
        tl.fromTo(
          formRef.current,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.4 },
          '-=0.2',
        )

        // Signed-out banner gentle fade (if present)
        if (signedOutBannerRef.current) {
          tl.fromTo(
            signedOutBannerRef.current,
            { opacity: 0 },
            { opacity: 1, duration: 0.35 },
            '-=0.15',
          )
        }
      })
    })

    return () => ctx?.revert()
  }, [])

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      if (!username || !password || loading || lockedOut) return
      if (getRemainingLockout() > 0) return

      setHasError(false)
      setLoading(true)

      const fd = new FormData()
      fd.set('username', username)
      fd.set('password', password)
      fd.set('redirect', redirectParam)

      try {
        const result = await loginAction(fd)
        // If loginAction returned (not redirected), it's an error signal
        if (!result.ok) {
          const attempts = getAttempts() + 1
          localStorage.setItem(LS_ATTEMPTS, String(attempts))
          if (attempts >= MAX_ATTEMPTS) {
            localStorage.setItem(LS_LOCKOUT, String(Date.now() + LOCKOUT_MS))
            localStorage.setItem(LS_ATTEMPTS, '0')
          }
          setHasError(true)
          setLoading(false)
        }
      } catch {
        // loginAction throws on redirect (Next.js behaviour) — that's success.
        // Any real thrown error means something went wrong.
        setLoading(false)
      }
    },
    [username, password, loading, lockedOut, redirectParam],
  )

  const attemptsLeft = MAX_ATTEMPTS - getAttempts()

  return (
    <div className="lock-shell admin-login-shell">
      {/* Matte background */}
      <div className="lock-bg admin-login-bg" aria-hidden="true" />

      <div className="lock-overlay">
        <div
          ref={cardRef}
          className="lock-card admin-login-card"
          style={{ opacity: 0 }}
        >
          {/* Lock glyph */}
          <div ref={lockRef} style={{ opacity: 0 }}>
            <AdminLockIcon />
          </div>

          {/* Brand eyebrow */}
          <div ref={brandRef} className="admin-login-brand" style={{ opacity: 0 }}>
            DS2 · ADMIN
          </div>

          {/* Title / signed-out state */}
          <div ref={titleRef} style={{ opacity: 0 }}>
            {isSignedOut ? (
              <div
                ref={signedOutBannerRef}
                className="admin-login-signedout"
              >
                <CheckIcon />
                <h1 className="lock-title admin-login-title">Signed out</h1>
                <p className="lock-sub">
                  You&apos;ve been signed out securely.
                </p>
              </div>
            ) : (
              <>
                <h1 className="lock-title admin-login-title">
                  Admin access
                </h1>
                <p className="lock-sub">
                  Enter your credentials to continue.
                </p>
              </>
            )}
          </div>

          {/* Form */}
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="lock-form"
            style={{ opacity: 0 }}
          >
            {/* Username field */}
            <div className="lock-input-wrap admin-login-input-wrap">
              <input
                type="text"
                name="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder={lockedOut ? `Try again in ${secondsLeft}s` : 'Username'}
                disabled={loading || lockedOut}
                autoFocus
                autoComplete="username"
                className="lock-input"
                aria-label="Username"
              />
            </div>

            {/* Password field */}
            <div
              className={`lock-input-wrap admin-login-input-wrap admin-login-input-wrap--gap${lockedOut ? ' is-locked' : ''}`}
            >
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder={lockedOut ? `Try again in ${secondsLeft}s` : 'Password'}
                disabled={loading || lockedOut}
                autoComplete="current-password"
                className="lock-input"
                aria-label="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="lock-eye"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                tabIndex={0}
              >
                <EyeIcon open={showPassword} />
              </button>
              <button
                type="submit"
                disabled={loading || !username || !password || lockedOut}
                className="lock-submit admin-login-submit"
                aria-label="Sign in"
              >
                {loading ? (
                  <span className="admin-login-spinner" aria-hidden="true" />
                ) : (
                  '→'
                )}
              </button>
            </div>

            {/* Error states */}
            {lockedOut && (
              <p className="lock-error" role="alert">
                Too many attempts. Try again in {secondsLeft}s.
              </p>
            )}
            {hasError && !lockedOut && (
              <p className="lock-error" role="alert">
                Incorrect username or password.{' '}
                {attemptsLeft > 0 && (
                  <span>
                    {attemptsLeft} attempt{attemptsLeft !== 1 ? 's' : ''} remaining.
                  </span>
                )}
              </p>
            )}
          </form>
        </div>

        <p className="lock-foot">DS2 · DIGITAL SOLUTIONS CONSULTING</p>
      </div>
    </div>
  )
}

// ── Page (Suspense wrapper required for useSearchParams) ─────────────────────

export default function AdminLoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
