'use client'

import { type FormEvent, useState } from 'react'
import type { FamaReport } from '@ds/fama'

interface AnalyzeResponse {
  report?: FamaReport
  skipped?: number
  truncated?: number
  error?: string
}

export interface LiveRun {
  report: FamaReport
  skipped: number
  truncated: number
}

/** Founder-facing import: paste or upload a reviews CSV (needs a text + rating
 *  column; author/date/platform picked up when present), run the live analysis. */
export function FamaImportPanel({ onRun }: { onRun: (run: LiveRun) => void }) {
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [location, setLocation] = useState('')
  const [csv, setCsv] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  async function onFile(file: File | null) {
    if (!file) return
    setFileName(file.name)
    setCsv(await file.text())
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault()
    if (busy || !name.trim() || !csv.trim()) return
    setBusy(true)
    setErr(null)
    try {
      const res = await fetch('/api/fama/analyze', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ csv, business: { name, type, location } }),
      })
      const json = (await res.json()) as AnalyzeResponse
      if (!res.ok || !json.report) throw new Error(json.error ?? `Analysis failed (${res.status})`)
      onRun({ report: json.report, skipped: json.skipped ?? 0, truncated: json.truncated ?? 0 })
    } catch (e2) {
      setErr(e2 instanceof Error ? e2.message : 'Analysis failed.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <form className="wf-import" onSubmit={onSubmit}>
      <div className="wf-import__head">
        <span className="wf-import__title">Run it on real reviews</span>
        <span className="wf-import__hint">
          CSV with a review-text + rating column (author, date, platform optional). First 60 reviews per run. Using
          decimal-comma ratings in a comma-separated file? Quote them: &ldquo;4,5&rdquo;.
        </span>
      </div>
      <div className="wf-import__row">
        <input className="wf-import__input" placeholder="Business name" value={name} maxLength={120} onChange={(e) => setName(e.target.value)} aria-label="Business name" required />
        <input className="wf-import__input" placeholder="Type (e.g. boutique hotel)" value={type} maxLength={80} onChange={(e) => setType(e.target.value)} aria-label="Business type" />
        <input className="wf-import__input" placeholder="Location (optional)" value={location} maxLength={120} onChange={(e) => setLocation(e.target.value)} aria-label="Location" />
      </div>
      <textarea
        className="wf-import__csv"
        placeholder={'Paste CSV here…\nauthor,rating,date,text\nMaria,5,2026-05-02,"Lovely stay, spotless room"'}
        value={csv}
        onChange={(e) => setCsv(e.target.value)}
        rows={5}
        aria-label="Reviews CSV"
      />
      <div className="wf-import__row wf-import__row--actions">
        <label className="wf-import__file">
          {fileName ?? 'Upload .csv'}
          <input
            type="file"
            accept=".csv,text/csv,text/plain"
            onChange={(e) => void onFile(e.target.files?.[0] ?? null)}
            aria-label="Upload reviews CSV"
          />
        </label>
        <button className="wf-import__run" type="submit" disabled={busy}>
          {busy ? 'Analyzing… (takes a minute)' : 'Analyze reviews'}
        </button>
      </div>
      {err ? (
        <p className="wf-import__err" role="alert">
          {err}
        </p>
      ) : null}
    </form>
  )
}
