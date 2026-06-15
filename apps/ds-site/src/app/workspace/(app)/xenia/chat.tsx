'use client'

// Type-only import — erased at compile, so the engine (and its key) never enters
// the client bundle. All engine execution happens in /api/xenia/respond.
import type { ConversationState } from '@ds/xenia'
import { useEffect, useRef, useState } from 'react'
import './chat.css'

interface SampleOption {
  key: string
  name: string
  type: string
}

interface Bubble {
  role: 'user' | 'assistant'
  text: string
}

const STATUS_LABEL: Record<string, string> = {
  collecting: 'Collecting details',
  proposing: 'Proposing a time',
  confirmed: 'Booked',
  handoff: 'Handed to a human',
}

// PLACEHOLDER: an illustrative booking exchange shown on first load (taverna),
// cleared the moment a real conversation starts. Safe to delete.
const EXAMPLE_TRANSCRIPT: Bubble[] = [
  { role: 'user', text: 'Καλησπέρα! Έχετε τραπέζι για 4 την Παρασκευή το βράδυ;' },
  { role: 'assistant', text: 'Καλησπέρα! Για την Παρασκευή έχουμε στις 20:00, 20:30 και 21:00. Τι ώρα σας βολεύει;' },
  { role: 'user', text: 'Στις 21:00 τέλεια.' },
  { role: 'assistant', text: 'Υπέροχα! Πείτε μου ένα όνομα κι ένα τηλέφωνο για την κράτηση;' },
  { role: 'user', text: 'Γιώργος, 6944 123456' },
  { role: 'assistant', text: 'Έκλεισε, Γιώργο — τραπέζι για 4 την Παρασκευή στις 21:00. Σας περιμένουμε!' },
]

export function Chat({ samples }: { samples: SampleOption[] }) {
  const [sample, setSample] = useState<string>(samples[0]?.key ?? 'taverna')
  const [state, setState] = useState<ConversationState | null>(null)
  const [pendingUser, setPendingUser] = useState<string | null>(null)
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  const history: Bubble[] = (state?.history ?? []).map((m) => ({ role: m.role, text: m.text }))
  const bubbles: Bubble[] = pendingUser ? [...history, { role: 'user', text: pendingUser }] : history

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [bubbles.length, busy])

  function reset(nextSample: string) {
    setSample(nextSample)
    setState(null)
    setPendingUser(null)
    setError(null)
  }

  async function send() {
    const text = input.trim()
    if (!text || busy) return
    setInput('')
    setPendingUser(text)
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/xenia/respond/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sample, state, text }),
      })
      const data = (await res.json()) as { reply?: string; state?: ConversationState; error?: string }
      if (!res.ok || !data.state) {
        setError(data.error ?? 'Something went wrong.')
      } else {
        setState(data.state)
      }
    } catch {
      setError('Network error — try again.')
    } finally {
      setPendingUser(null)
      setBusy(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void send()
    }
  }

  const status = state?.status
  const current = samples.find((s) => s.key === sample)

  return (
    <div className="wx">
      <div className="wx__bar">
        <label className="wx__pick">
          <span className="wx__pick-label">Business</span>
          <select value={sample} onChange={(e) => reset(e.target.value)} className="wx__select">
            {samples.map((s) => (
              <option key={s.key} value={s.key}>
                {s.name} — {s.type}
              </option>
            ))}
          </select>
        </label>
        {status ? <span className={`wx__status is-${status}`}>{STATUS_LABEL[status] ?? status}</span> : null}
      </div>

      <div className="wx__transcript" ref={scrollRef} aria-live="polite" aria-label="Conversation">
        {bubbles.length === 0 && !busy ? (
          sample === 'taverna' ? (
            <div className="wx__example">
              <span className="wx__example-tag">Example conversation</span>
              {EXAMPLE_TRANSCRIPT.map((b, i) => (
                <div key={i} className={`wx__bubble is-${b.role} is-example`}>
                  {b.text}
                </div>
              ))}
              <p className="wx__hint wx__hint--sm">Type below to start your own — Greek or English.</p>
            </div>
          ) : (
            <p className="wx__hint">
              Say hello to {current?.name ?? 'the business'} — try “Can I book a table for two on Friday at 8?” or
              “Θέλω ραντεβού την Πέμπτη το πρωί”.
            </p>
          )
        ) : null}
        {bubbles.map((b, i) => (
          <div key={i} className={`wx__bubble is-${b.role}`}>
            {b.text}
          </div>
        ))}
        {busy ? (
          <div className="wx__bubble is-assistant wx__typing" aria-label="Xenia is typing">
            <span />
            <span />
            <span />
          </div>
        ) : null}
      </div>

      {error ? (
        <p className="wx__error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="wx__composer">
        <textarea
          className="wx__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          rows={1}
          placeholder="Message Xenia…"
          aria-label="Message Xenia"
        />
        <button className="wx__send" onClick={() => void send()} disabled={busy || input.trim() === ''}>
          Send
        </button>
      </div>
    </div>
  )
}
