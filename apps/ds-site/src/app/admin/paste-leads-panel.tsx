'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { insertManualLeads } from './leads-actions'
import type { ParsedLead } from './lib/leads-types'

export function PasteLeadsPanel() {
  const router = useRouter()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<ParsedLead[] | null>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [saving, startSave] = useTransition()

  async function parse() {
    if (text.trim().length < 3 || busy) return
    setBusy(true); setMsg(null); setPreview(null)
    try {
      const res = await fetch('/api/admin/leads/parse', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok || !data.ok) setMsg(data.error ?? `Failed (${res.status})`)
      else if (!data.leads?.length) setMsg('No leads found in that text.')
      else setPreview(data.leads as ParsedLead[])
    } catch {
      setMsg('Network error')
    } finally {
      setBusy(false)
    }
  }

  function confirm() {
    if (!preview?.length) return
    startSave(async () => {
      try {
        const { inserted } = await insertManualLeads(preview)
        setMsg(`Added ${inserted} leads.`)
        setPreview(null); setText('')
        router.refresh()
      } catch (e) {
        setMsg(e instanceof Error ? e.message : 'Save failed')
      }
    })
  }

  return (
    <div className="admin-leads-panel">
      <p className="admin-section__eyebrow">Paste leads</p>
      <h3 className="admin-leads-panel__title">Drop raw leads, we’ll structure them</h3>
      <textarea
        className="admin-form__textarea"
        rows={5}
        placeholder="Paste anything — names, phones, emails, sites, one per line or a messy blob. Claude will compile them."
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={busy || saving}
      />
      <div className="admin-leads-row">
        <button type="button" className="admin-new-btn" onClick={parse} disabled={busy || saving}>
          {busy ? 'Compiling…' : 'Compile'}
        </button>
        {preview && (
          <button type="button" className="admin-repo-link" onClick={confirm} disabled={saving}>
            {saving ? 'Adding…' : `Add ${preview.length} leads`}
          </button>
        )}
      </div>
      {msg && <p className="admin-leads-msg">{msg}</p>}
      {preview && (
        <div className="admin-leads-preview">
          {preview.slice(0, 20).map((l, i) => (
            <div key={i} className="admin-leads-preview__row">
              <strong>{l.name}</strong>
              <span className="dim">{[l.category, l.phone, l.email, l.website].filter(Boolean).join(' · ')}</span>
            </div>
          ))}
          {preview.length > 20 && <p className="dim">+{preview.length - 20} more…</p>}
        </div>
      )}
    </div>
  )
}
