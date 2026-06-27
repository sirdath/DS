'use client'

import { useState } from 'react'
import { restoreDeckAction, revokeDeckAction } from './actions'

interface Deck {
  id: string
  token: string
  title: string
  clientName: string | null
  items: string[]
  isActive: boolean
  createdAt: string
}

export function PresentationList({ decks }: { decks: Deck[] }) {
  const [pending, setPending] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  async function copy(d: Deck) {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/p/${d.token}`)
      setCopiedId(d.id)
      window.setTimeout(() => setCopiedId(null), 1600)
    } catch {
      /* clipboard blocked */
    }
  }

  async function toggle(d: Deck) {
    setPending(d.id)
    try {
      if (d.isActive) await revokeDeckAction(d.id)
      else await restoreDeckAction(d.id)
    } finally {
      setPending(null)
    }
  }

  if (decks.length === 0) return <p className="pb-empty pb-empty--big">No presentations yet — create your first.</p>

  return (
    <ul className="pb-list">
      {decks.map((d) => (
        <li key={d.id} className={`pb-listrow${d.isActive ? '' : ' is-off'}`}>
          <div className="pb-listrow__main">
            <span className="pb-listrow__title" translate="no">{d.title || 'Untitled deck'}</span>
            <span className="pb-listrow__meta">
              {d.items.length} product{d.items.length === 1 ? '' : 's'}
              {d.clientName ? ` · ${d.clientName}` : ''}
              {d.isActive ? '' : ' · revoked'}
            </span>
          </div>
          <div className="pb-listrow__actions">
            <button type="button" onClick={() => void copy(d)} disabled={!d.isActive}>{copiedId === d.id ? 'Copied' : 'Copy link'}</button>
            <a href={`/p/${d.token}`} target="_blank" rel="noreferrer">Open</a>
            <button type="button" className="pb-listrow__revoke" onClick={() => void toggle(d)} disabled={pending === d.id}>
              {d.isActive ? 'Revoke' : 'Restore'}
            </button>
          </div>
        </li>
      ))}
    </ul>
  )
}
