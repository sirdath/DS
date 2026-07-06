'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { CopilotApp } from './copilot-app'
import './copilot.css'
import './copilot-widget.css'

/** The copilot's living-waveform mark (5 bars), used on the launcher + header. */
function WaveMark() {
  return (
    <span className="cop-wave cop-wave--mini" aria-hidden>
      <i />
      <i />
      <i />
      <i />
      <i />
    </span>
  )
}

/**
 * Floating copilot launcher on every admin page (bottom-left, clear of the rail).
 * Opens a compact panel running the SAME CopilotApp as /admin/copilot — full
 * streaming, tools, tiers and the confirm gate — plus an expand-to-full-page link.
 * Hidden on the copilot page itself (redundant there). Owners only (the layout
 * decides whether to mount it).
 */
export function CopilotWidget({ credentialSet }: { credentialSet: boolean }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname() ?? ''

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  // Don't shadow the full copilot page.
  if (pathname.startsWith('/admin/copilot')) return null

  return (
    <div className="cop-wgt">
      {open ? <button type="button" className="cop-wgt__scrim" aria-label="Close copilot" onClick={() => setOpen(false)} /> : null}
      {open ? (
        <div className="cop-wgt__panel" role="dialog" aria-label="Copilot">
          <div className="cop-wgt__bar">
            <span className="cop-wgt__title">
              <WaveMark />
              Copilot
            </span>
            <div className="cop-wgt__tools">
              <Link
                href="/admin/copilot"
                className="cop-wgt__iconbtn"
                aria-label="Open the full copilot page"
                title="Open full page"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 3h6v6" />
                  <path d="M10 14 21 3" />
                  <path d="M21 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
                </svg>
              </Link>
              <button
                type="button"
                className="cop-wgt__iconbtn"
                onClick={() => setOpen(false)}
                aria-label="Close copilot"
                title="Close"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="cop-wgt__body">
            <CopilotApp credentialSet={credentialSet} variant="widget" />
          </div>
        </div>
      ) : null}

      <button
        type="button"
        className={`cop-wgt__fab${open ? ' is-open' : ''}`}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-label={open ? 'Close copilot' : 'Open copilot'}
      >
        {open ? (
          <svg className="cop-wgt__chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="m6 9 6 6 6-6" />
          </svg>
        ) : (
          <WaveMark />
        )}
      </button>
    </div>
  )
}
