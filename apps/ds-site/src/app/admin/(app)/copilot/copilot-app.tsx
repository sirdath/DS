'use client'

import Link from 'next/link'
import { type FormEvent, useEffect, useRef, useState } from 'react'

type ConfirmState = 'pending' | 'running' | 'done' | 'cancelled' | 'error'

type ChatItem =
  | { kind: 'user'; text: string }
  | { kind: 'assistant'; text: string }
  | { kind: 'tool'; name: string; label: string; ok: boolean | null }
  | { kind: 'model'; label: string }
  | {
      kind: 'confirm'
      id: string
      name: string
      label: string
      summary: string
      input: Record<string, unknown>
      state: ConfirmState
      note?: string
    }
  | { kind: 'error'; text: string }

/** The copilot's living-waveform mark: 7 breathing spectrum bars (5 when mini). */
function Wave({ mini = false }: { mini?: boolean }) {
  return (
    <span className={`cop-wave${mini ? ' cop-wave--mini' : ''}`} aria-hidden>
      {Array.from({ length: mini ? 5 : 7 }, (_, i) => (
        <i key={i} />
      ))}
    </span>
  )
}

/** Time-of-day greeting for the empty state (client-local). */
function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning.'
  if (h < 18) return 'Good afternoon.'
  return 'Good evening.'
}

/** A small glyph per action family for the live action cards. */
function actionIcon(name: string): string {
  if (name.startsWith('delete_') || name === 'mark_lead_lost') return '⊘'
  if (name.startsWith('create_')) return '＋'
  if (name.startsWith('draft_')) return '✦'
  if (name.startsWith('get_') || name.startsWith('list_')) return '⌕'
  if (name.startsWith('convert_') || name.startsWith('promote_')) return '↗'
  return '✎'
}

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
  { key: 'deep', label: 'Deep', hint: 'Opus, deep reasoning — analysis and strategy' },
]

const SUGGESTIONS = [
  'What does this week look like?',
  'How is the pipeline doing?',
  'Book a cofounders meeting Friday at 15:00',
  'Which deadlines are at risk?',
]

export function CopilotApp({
  credentialSet,
  variant = 'page',
}: {
  credentialSet: boolean
  variant?: 'page' | 'widget'
}) {
  const [items, setItems] = useState<ChatItem[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [tier, setTier] = useState<TierChoice>('auto')
  const [usage, setUsage] = useState<Usage>({ inputTokens: 0, outputTokens: 0, usd: 0 })
  const historyRef = useRef<unknown[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const [hello, setHello] = useState('Hello.')
  useEffect(() => setHello(greeting()), [])

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
          } else if (ev.t === 'confirm') {
            setItems((cur) => [
              ...cur,
              {
                kind: 'confirm',
                id: String(ev.id),
                name: String(ev.name),
                label: String(ev.label),
                summary: String(ev.summary ?? ev.label ?? 'Confirm this action?'),
                input: (ev.input as Record<string, unknown>) ?? {},
                state: 'pending',
              },
            ])
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

  function setConfirmState(id: string, patch: Partial<Extract<ChatItem, { kind: 'confirm' }>>) {
    setItems((cur) =>
      cur.map((it) => (it.kind === 'confirm' && it.id === id ? { ...it, ...patch } : it)),
    )
  }

  // Overwrite the "paused — awaiting confirmation" tool_result in the client-held
  // history with the real outcome, so the model stays coherent on the next turn.
  function resolveHistory(toolUseId: string, resultText: string) {
    historyRef.current = historyRef.current.map((m) => {
      const msg = m as { role?: string; content?: unknown }
      if (msg.role === 'user' && Array.isArray(msg.content)) {
        return {
          ...msg,
          content: msg.content.map((b) => {
            const block = b as { type?: string; tool_use_id?: string }
            return block.type === 'tool_result' && block.tool_use_id === toolUseId
              ? { ...block, content: resultText, is_error: false }
              : b
          }),
        }
      }
      return m
    })
  }

  async function onConfirm(item: Extract<ChatItem, { kind: 'confirm' }>) {
    setConfirmState(item.id, { state: 'running' })
    try {
      const res = await fetch('/api/admin/copilot/act', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name: item.name, input: item.input }),
      })
      const data = (await res.json().catch(() => null)) as { ok?: boolean; error?: string; result?: string } | null
      if (!res.ok || !data?.ok) throw new Error(data?.error ?? `Failed (${res.status})`)
      resolveHistory(item.id, `Confirmed and applied by the founder. ${data.result ?? ''}`.trim())
      setConfirmState(item.id, { state: 'done' })
    } catch (err) {
      setConfirmState(item.id, { state: 'error', note: err instanceof Error ? err.message : 'Action failed' })
    }
  }

  function onCancel(item: Extract<ChatItem, { kind: 'confirm' }>) {
    resolveHistory(item.id, 'The founder declined this action. Do not attempt it again unless they ask.')
    setConfirmState(item.id, { state: 'cancelled' })
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault()
    void send(input)
  }

  return (
    <div className={`cop-shell${variant === 'widget' ? ' cop-shell--widget' : ''}`}>
      <div className="cop-ambient" aria-hidden>
        <span className="cop-blob cop-blob--1" />
        <span className="cop-blob cop-blob--2" />
        <span className="cop-blob cop-blob--3" />
        <span className="cop-grain" />
      </div>

      {!credentialSet ? (
        <p className="cop-warn" role="alert">
          No Anthropic key on your account — the copilot will use the shared fallback if one is set. Add your own in{' '}
          <Link href="/admin/competitors">Competitors → Your Anthropic key</Link>.
        </p>
      ) : null}

      <div className="cop-scroll" ref={scrollRef}>
        {items.length === 0 ? (
          <div className="cop-empty">
            <Wave />
            <p className="cop-empty__lead">
              {hello} <b>What should we look at?</b>
            </p>
            <p className="cop-empty__status">Workspace synced · ready</p>
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
                <div className="cop-msg--ai" key={i}>
                  <Wave mini />
                  <div className="cop-msg__body">{item.text}</div>
                </div>
              )
            }
            if (item.kind === 'tool') {
              const running = item.ok === null
              return (
                <div className={`cop-action${running ? ' is-run' : ''}`} key={i}>
                  <span className="cop-action__ic" aria-hidden>
                    {actionIcon(item.name)}
                  </span>
                  <span className="cop-action__t">
                    {item.label}
                    <small>{item.name}</small>
                  </span>
                  <span className="cop-action__s" aria-hidden>
                    {running ? (
                      <span className="cop-spinner" />
                    ) : item.ok ? (
                      <span className="ok">✓</span>
                    ) : (
                      <span className="fail">✕</span>
                    )}
                  </span>
                </div>
              )
            }
            if (item.kind === 'confirm') {
              const resolved = item.state !== 'pending' && item.state !== 'running'
              return (
                <div className={`cop-confirm${resolved ? ' is-resolved' : ''}`} key={i}>
                  <div className="cop-confirm__in">
                    <div className="cop-confirm__eyebrow">Needs your ok</div>
                    <div className="cop-confirm__text">{item.summary}</div>
                    {item.state === 'pending' ? (
                      <div className="cop-confirm__btns">
                        <button type="button" className="cop-confirm__go" onClick={() => void onConfirm(item)}>
                          Confirm
                        </button>
                        <button type="button" className="cop-confirm__keep" onClick={() => onCancel(item)}>
                          Keep it
                        </button>
                      </div>
                    ) : item.state === 'running' ? (
                      <div className="cop-confirm__done">Applying…</div>
                    ) : item.state === 'done' ? (
                      <div className="cop-confirm__done">✓ Done</div>
                    ) : item.state === 'cancelled' ? (
                      <div className="cop-confirm__cancelled">Cancelled — nothing changed</div>
                    ) : (
                      <div className="cop-confirm__err">{item.note ?? 'Action failed'}</div>
                    )}
                  </div>
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
        {busy && items.length > 0 && items[items.length - 1]?.kind !== 'assistant' ? (
          <div className="cop-thinking">
            <Wave mini />
            <span>Thinking…</span>
          </div>
        ) : null}
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
        <div className={`cop-composer${busy ? ' is-busy' : ''}`}>
          <div className="cop-composer__inner">
            <textarea
              className="cop-composer__field"
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
            <button className="ds-btn ds-btn--primary cop-send" type="submit" disabled={busy}>
              {busy ? 'Working…' : 'Send'}
            </button>
          </div>
        </div>
      </form>
      {usage.outputTokens > 0 ? (
        <p className="cop-usage">
          This chat: ~${usage.usd.toFixed(3)} · {Math.round((usage.inputTokens + usage.outputTokens) / 1000)}k tokens · billed to your key
        </p>
      ) : null}
    </div>
  )
}
