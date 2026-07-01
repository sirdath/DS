'use client'

import Link from 'next/link'
import { type FormEvent, useEffect, useRef, useState } from 'react'

type ChatItem =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'tool'; name: string; label: string; ok: boolean | null }
  | { kind: 'model'; label: string }
  | { kind: 'error'; text: string }

interface Usage {
  inputTokens: number
  outputTokens: number
  usd: number
}

type TierChoice = 'auto' | 'quick' | 'smart' | 'deep'

const TIER_OPTIONS: { key: TierChoice; label: string; hint: string }[] = [
  { key: 'auto', label: 'Auto', hint: 'Routes each message to the right model' },
  { key: 'quick', label: 'Quick', hint: 'Haiku — lookups and small actions' },
  { key: 'smart', label: 'Smart', hint: 'Opus — everyday multi-step work' },
  { key: 'deep', label: 'Deep', hint: 'Fable — analysis and strategy' },
]

const SUGGESTIONS = [
  'What does this week look like?',
  'How is the pipeline doing?',
  'Book a cofounders meeting Friday at 15:00',
  'Which deadlines are at risk?',
]

export function CopilotApp({ credentialSet }: { credentialSet: boolean }) {
  const [items, setItems] = useState<ChatItem[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [tier, setTier] = useState<TierChoice>('auto')
  const [usage, setUsage] = useState<Usage>({ inputTokens: 0, outputTokens: 0, usd: 0 })
  const historyRef = useRef<unknown[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight })
  }, [items])

  function pushDelta(text: string) {
    setItems((cur) => {
      const last = cur[cur.length - 1]
      if (last && last.kind === 'assistant') {
        return [...cur.slice(0, -1), { kind: 'assistant', text: last.text + text }]
      }
      return [...cur, { kind: 'assistant', text }]
    })
  }

  async function send(text: string) {
    const message = text.trim()
    if (!message || busy) return
    setBusy(true)
    setInput('')
    setItems((cur) => [...cur, { kind: 'user', text: message }])
    try {
      const res = await fetch('/api/admin/copilot', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ history: historyRef.current, message, model: tier }),
      })
      if (!res.ok || !res.body) {
        const err = (await res.json().catch(() => null)) as { error?: string } | null
        throw new Error(err?.error ?? `Request failed (${res.status})`)
      }
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      for (;;) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() ?? ''
        for (const line of lines) {
          if (!line.trim()) continue
          let ev: Record<string, unknown>
          try {
            ev = JSON.parse(line) as Record<string, unknown>
          } catch {
            continue
          }
          if (ev.t === 'delta' && typeof ev.text === 'string') pushDelta(ev.text)
          else if (ev.t === 'model' && typeof ev.label === 'string') {
            setItems((cur) => [...cur, { kind: 'model', label: ev.label as string }])
          } else if (ev.t === 'tool') {
            setItems((cur) => [...cur, { kind: 'tool', name: String(ev.name), label: String(ev.label), ok: null }])
          } else if (ev.t === 'tool_done') {
            setItems((cur) => {
              for (let idx = cur.length - 1; idx >= 0; idx--) {
                const item = cur[idx]
                if (item && item.kind === 'tool' && item.name === ev.name && item.ok === null) {
                  const next = [...cur]
                  next[idx] = { ...item, ok: Boolean(ev.ok) }
                  return next
                }
              }
              return cur
            })
          } else if (ev.t === 'error' && typeof ev.message === 'string') {
            setItems((cur) => [...cur, { kind: 'error', text: ev.message as string }])
          } else if (ev.t === 'done') {
            historyRef.current = [...historyRef.current, { role: 'user', content: message }, ...((ev.messages as unknown[]) ?? [])]
            const u = ev.usage as Usage | undefined
            if (u) {
              setUsage((cur) => ({
                inputTokens: cur.inputTokens + (u.inputTokens ?? 0),
                outputTokens: cur.outputTokens + (u.outputTokens ?? 0),
                usd: cur.usd + (u.usd ?? 0),
              }))
            }
          }
        }
      }
    } catch (err) {
      setItems((cur) => [...cur, { kind: 'error', text: err instanceof Error ? err.message : 'Something went wrong.' }])
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  return (
    <div className="cop-shell ds-card">
      {!credentialSet ? (
        <p className="cop-warn" role="alert">
          No Anthropic key on your account — the copilot will use the shared fallback if one is set. Add your own in{' '}
          <Link href="/admin/competitors">Competitors → Your Anthropic key</Link>.
        </p>
      ) : null}

      <div className="cop-scroll" ref={scrollRef}>
        {items.length === 0 ? (
          <div className="cop-empty">
            <p className="cop-empty__lead">What should we look at?</p>
            <div className="cop-suggest">
              {SUGGESTIONS.map((s) => (
                <button key={s} type="button" className="cop-chip" onClick={() => void send(s)}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          items.map((item, i) => {
            if (item.kind === 'user') {
              return (
                <div className="cop-msg cop-msg--user" key={i}>
                  {item.text}
                </div>
              )
            }
            if (item.kind === 'assistant') {
              return (
                <div className="cop-msg cop-msg--ai" key={i}>
                  {item.text}
                </div>
              )
            }
            if (item.kind === 'tool') {
              return (
                <div className={`cop-tool${item.ok === false ? ' is-fail' : ''}`} key={i}>
                  <i aria-hidden>{item.ok === null ? '·' : item.ok ? '✓' : '✕'}</i> {item.label}
                  {item.ok === null ? '…' : ''}
                </div>
              )
            }
            if (item.kind === 'model') {
              return (
                <div className="cop-model" key={i}>
                  {item.label}
                </div>
              )
            }
            return (
              <p className="cop-err" role="alert" key={i}>
                {item.text}
              </p>
            )
          })
        )}
        {busy && items[items.length - 1]?.kind === 'user' ? <div className="cop-thinking">Thinking…</div> : null}
      </div>

      <div className="cop-tiers" aria-label="Model tier">
        {TIER_OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            aria-pressed={tier === o.key}
            className={`cop-tier${tier === o.key ? ' is-on' : ''}`}
            title={o.hint}
            onClick={() => setTier(o.key)}
          >
            {o.label}
          </button>
        ))}
      </div>

      <form className="cop-input" onSubmit={onSubmit}>
        <textarea
          className="cop-input__field"
          placeholder="Ask, or tell it what to change…"
          value={input}
          rows={1}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              void send(input)
            }
          }}
          aria-label="Message the copilot"
        />
        <button className="ds-btn ds-btn--primary" type="submit" disabled={busy}>
          {busy ? 'Working…' : 'Send'}
        </button>
      </form>
      {usage.outputTokens > 0 ? (
        <p className="cop-usage">
          This chat: ~${usage.usd.toFixed(3)} · {Math.round((usage.inputTokens + usage.outputTokens) / 1000)}k tokens · billed to your key
        </p>
      ) : null}
    </div>
  )
}
