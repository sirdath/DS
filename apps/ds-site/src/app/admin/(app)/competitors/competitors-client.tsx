'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { type FormEvent, useState } from 'react'
import { addCompetitor, analyzeCompetitor, deleteCompetitor } from '@/app/admin/competitors-actions'
import type { Competitor } from './types'

const STATUS: Record<string, { label: string; cls: string }> = {
  analyzed: { label: 'Analyzed', cls: 'ds-badge--success' },
  analyzing: { label: 'Scanning…', cls: 'ds-badge--warning' },
  pending: { label: 'Not scanned', cls: '' },
  error: { label: 'Scan failed', cls: 'ds-badge--danger' },
}

export function CompetitorsClient({ competitors }: { competitors: Competitor[] }) {
  const router = useRouter()
  const [url, setUrl] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [scanning, setScanning] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  async function onAdd(e: FormEvent) {
    e.preventDefault()
    if (!url.trim() || busy) return
    setBusy(true)
    setErr(null)
    try {
      const id = await addCompetitor({ url, name })
      setUrl('')
      setName('')
      router.refresh()
      if (id) {
        setScanning(id)
        try {
          await analyzeCompetitor(id)
        } finally {
          setScanning(null)
        }
        router.refresh()
      }
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Could not add that.')
    } finally {
      setBusy(false)
    }
  }

  async function rescan(id: string) {
    setScanning(id)
    setErr(null)
    try {
      await analyzeCompetitor(id)
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Scan failed.')
    } finally {
      setScanning(null)
    }
  }

  async function remove(id: string) {
    if (!window.confirm('Delete this competitor and its analysis?')) return
    try {
      await deleteCompetitor(id)
      router.refresh()
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Could not delete.')
    }
  }

  return (
    <>
      <form className="cmp-add" onSubmit={onAdd}>
        <input
          className="ds-input"
          type="url"
          placeholder="https://competitor-agency.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          aria-label="Competitor URL"
          required
        />
        <input
          className="ds-input cmp-add__name"
          placeholder="Name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          aria-label="Competitor name"
        />
        <button className="ds-btn ds-btn--primary" type="submit" disabled={busy}>
          {busy ? 'Scanning…' : 'Add & scan'}
        </button>
      </form>
      {err ? (
        <p className="cmp-err" role="alert">
          {err}
        </p>
      ) : null}

      {competitors.length === 0 ? (
        <p className="ds-empty">No competitors yet. Paste a URL above and scan to analyze one.</p>
      ) : (
        <div className="cmp-grid">
          {competitors.map((c) => {
            const st = STATUS[c.status] ?? { label: 'Not scanned', cls: '' }
            const isScanning = scanning === c.id || c.status === 'analyzing'
            return (
              <div className="ds-card cmp-card" key={c.id}>
                <div className="cmp-card__top">
                  <span className="cmp-card__name" translate="no">
                    {c.name}
                  </span>
                  <span className={`ds-badge ${isScanning ? 'ds-badge--warning' : st.cls}`}>
                    {isScanning ? 'Scanning…' : st.label}
                  </span>
                </div>
                <a className="cmp-card__url" href={c.url} target="_blank" rel="noopener noreferrer">
                  {c.url.replace(/^https?:\/\//, '')}
                </a>
                <p className="cmp-card__sum">{c.summary || 'Not analyzed yet.'}</p>
                <div className="cmp-card__foot">
                  {c.analysis ? (
                    <Link className="ds-btn" href={`/admin/competitors/${c.id}`}>
                      View analysis →
                    </Link>
                  ) : null}
                  <button type="button" className="ds-btn ds-btn--ghost" onClick={() => rescan(c.id)} disabled={isScanning}>
                    {isScanning ? 'Scanning…' : 'Re-scan'}
                  </button>
                  <button type="button" className="ds-btn ds-btn--ghost" onClick={() => remove(c.id)}>
                    Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </>
  )
}
