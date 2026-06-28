'use client'

import { useState } from 'react'
import { createDeckAction } from './actions'

interface Tool {
  slug: string
  name: string
  tagline: string
}

export function PresentationBuilder({ tools }: { tools: Tool[] }) {
  const [selected, setSelected] = useState<string[]>([])
  const [title, setTitle] = useState('')
  const [client, setClient] = useState('')
  const [link, setLink] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const bySlug = new Map(tools.map((t) => [t.slug, t]))
  const available = tools.filter((t) => !selected.includes(t.slug))

  function add(slug: string) {
    setSelected((s) => [...s, slug])
    setLink(null)
  }
  function remove(slug: string) {
    setSelected((s) => s.filter((x) => x !== slug))
    setLink(null)
  }
  function move(i: number, dir: -1 | 1) {
    setSelected((s) => {
      const next = [...s]
      const j = i + dir
      const a = next[i]
      const b = next[j]
      if (a === undefined || b === undefined) return s
      next[i] = b
      next[j] = a
      return next
    })
    setLink(null)
  }

  async function generate() {
    setBusy(true)
    setErr(null)
    try {
      const { token } = await createDeckAction({ title, clientName: client, items: selected })
      setLink(`${window.location.origin}/p/${token}`)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not create the deck')
    } finally {
      setBusy(false)
    }
  }

  async function copy() {
    if (!link) return
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard blocked — the link is selectable in the field */
    }
  }

  return (
    <div className="pb">
      <div className="pb-grid">
        {/* Pick */}
        <section className="pb-panel">
          <h2 className="pb-panel__title">Products</h2>
          <p className="pb-panel__hint">Tap to add to the deck.</p>
          <div className="pb-avail">
            {available.length === 0 ? <p className="pb-empty">All products added.</p> : null}
            {available.map((t) => (
              <button type="button" key={t.slug} className="pb-card" onClick={() => add(t.slug)}>
                <span className="pb-card__name">{t.name}</span>
                <span className="pb-card__tag">{t.tagline}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Order */}
        <section className="pb-panel">
          <h2 className="pb-panel__title">In this order</h2>
          <p className="pb-panel__hint">Each becomes a full section, top to bottom.</p>
          {selected.length === 0 ? (
            <p className="pb-empty">No products yet, add some on the left.</p>
          ) : (
            <ol className="pb-order">
              {selected.map((slug, i) => {
                const t = bySlug.get(slug)
                if (!t) return null
                return (
                  <li key={slug} className="pb-row">
                    <span className="pb-row__n">{String(i + 1).padStart(2, '0')}</span>
                    <span className="pb-row__name">{t.name}</span>
                    <span className="pb-row__moves">
                      <button type="button" aria-label={`Move ${t.name} up`} disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
                      <button type="button" aria-label={`Move ${t.name} down`} disabled={i === selected.length - 1} onClick={() => move(i, 1)}>↓</button>
                      <button type="button" aria-label={`Remove ${t.name}`} className="pb-row__rm" onClick={() => remove(slug)}>✕</button>
                    </span>
                  </li>
                )
              })}
            </ol>
          )}
        </section>
      </div>

      <section className="pb-meta">
        <label className="pb-field">
          <span>Title</span>
          <input value={title} onChange={(e) => { setTitle(e.target.value); setLink(null) }} placeholder="What we&rsquo;d build for you" maxLength={200} />
        </label>
        <label className="pb-field">
          <span>Client name (optional)</span>
          <input value={client} onChange={(e) => { setClient(e.target.value); setLink(null) }} placeholder="Aetheria Suites" maxLength={200} />
        </label>
        <button type="button" className="pb-generate" disabled={busy || selected.length === 0} onClick={() => void generate()}>
          {busy ? 'Creating…' : 'Generate share link'}
        </button>
      </section>

      {err ? <p className="pb-err" role="alert">{err}</p> : null}

      {link ? (
        <div className="pb-link" role="status" aria-live="polite">
          <input readOnly value={link} aria-label="Share link" onFocus={(e) => e.currentTarget.select()} />
          <button type="button" onClick={() => void copy()}>{copied ? 'Copied' : 'Copy'}</button>
          <a href={link} target="_blank" rel="noreferrer">Open</a>
        </div>
      ) : null}
    </div>
  )
}
