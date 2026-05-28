'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface AreaRow {
  area_label: string
  status: string
  lead_count: number
  run_at: string
}

export function RunAreaPanel({ pendingCount, areas }: { pendingCount: number; areas: AreaRow[] }) {
  const router = useRouter()
  const [area, setArea] = useState('')
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [remaining, setRemaining] = useState(pendingCount)

  async function findArea() {
    if (area.trim().length < 3 || busy) return
    setBusy(true); setMsg(null)
    try {
      const res = await fetch('/api/admin/leads/find-area', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ area }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) {
        setMsg(data.error ?? `Failed (${res.status})`)
      } else {
        setMsg(`Found ${data.found} (${data.noWebsite} no-website, ${data.inserted} new). Click "Analyze pending" to score sites.`)
        setArea('')
        router.refresh()
      }
    } catch {
      setMsg('Network error')
    } finally {
      setBusy(false)
    }
  }

  async function analyzePending() {
    if (analyzing) return
    setAnalyzing(true); setMsg(null)
    try {
      // Loop the batch endpoint until nothing is pending.
      for (let guard = 0; guard < 200; guard++) {
        const res = await fetch('/api/admin/leads/analyze-batch', { method: 'POST' })
        const data = await res.json()
        if (!res.ok || !data.ok) { setMsg(data.error ?? 'Analyze failed'); break }
        setRemaining(data.remaining)
        if (data.processed === 0 || data.remaining === 0) break
      }
      router.refresh()
    } catch {
      setMsg('Network error during analysis')
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="admin-leads-panel">
      <p className="admin-section__eyebrow">Find leads</p>
      <h3 className="admin-leads-panel__title">Search an area</h3>
      <div className="admin-leads-row">
        <input
          className="admin-form__input"
          placeholder='e.g. "Kifisia, Greece"'
          value={area}
          onChange={(e) => setArea(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && findArea()}
          disabled={busy}
        />
        <button type="button" className="admin-new-btn" onClick={findArea} disabled={busy}>
          {busy ? 'Searching…' : 'Find leads'}
        </button>
      </div>
      <div className="admin-leads-row">
        <button type="button" className="admin-repo-link" onClick={analyzePending} disabled={analyzing || remaining === 0}>
          {analyzing ? `Analyzing… (${remaining} left)` : remaining > 0 ? `Analyze pending (${remaining})` : 'All analyzed'}
        </button>
      </div>
      {msg && <p className="admin-leads-msg">{msg}</p>}

      {areas.length > 0 && (
        <div className="admin-leads-areas">
          <p className="admin-leads-sub">Already searched (won’t re-run):</p>
          <ul>
            {areas.slice(0, 12).map((a) => (
              <li key={a.area_label}>
                <span>{a.area_label}</span>
                <span className="dim">{a.lead_count} · {a.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
