'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import type { MarketingLead } from '@/app/admin/lib/leads-types'
import type { BriefMeta } from './outreach-types'

interface Filters {
  q: string
  priority: string
  status: string
  nosite: boolean
}

interface Props {
  leads: MarketingLead[]
  latestByLead: Record<string, BriefMeta>
  selectedLeadId: string | null
  model: 'opus' | 'sonnet'
  filters: Filters
}

const STATUS_LABEL: Record<string, string> = { researching: 'Researching…', ready: 'Ready', failed: 'Failed' }

export function OutreachTable({ leads, latestByLead, selectedLeadId, model, filters }: Props) {
  const router = useRouter()
  const [researching, setResearching] = useState<Set<string>>(new Set())
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [batchRunning, setBatchRunning] = useState(false)

  function hrefFor(params: Record<string, string | undefined>): string {
    const merged: Record<string, string | undefined> = {
      model,
      lead: selectedLeadId ?? undefined,
      q: filters.q || undefined,
      priority: filters.priority || undefined,
      status: filters.status || undefined,
      nosite: filters.nosite ? '1' : undefined,
      ...params,
    }
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v as string)}`)
      .join('&')
    return `/admin/funnel/outreach${qs ? `?${qs}` : ''}`
  }

  async function researchOne(id: string, refresh = true): Promise<void> {
    setResearching((s) => new Set(s).add(id))
    try {
      const res = await fetch('/api/admin/outreach/research', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ leadId: id, model }),
      })
      await res.json().catch(() => ({}))
    } catch {
      // swallow — the row's brief status reflects the outcome after refresh
    } finally {
      setResearching((s) => {
        const n = new Set(s)
        n.delete(id)
        return n
      })
      if (refresh) router.refresh()
    }
  }

  async function researchSelected(): Promise<void> {
    if (selected.size === 0 || batchRunning) return
    setBatchRunning(true)
    for (const id of selected) {
      await researchOne(id, false) // 🔒 sequential — gentle on rate limits + cost
    }
    setBatchRunning(false)
    setSelected(new Set())
    router.refresh() // one refresh after the batch
  }

  function toggleSelect(id: string) {
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })
  }

  return (
    <section className="admin-outreach__list">
      <div className="admin-outreach__bar">
        <div className="admin-outreach__seg" role="group" aria-label="Research model">
          <a className={`admin-outreach__seg-btn ${model === 'opus' ? 'is-on' : ''}`} href={hrefFor({ model: 'opus' })}>
            Opus
          </a>
          <a className={`admin-outreach__seg-btn ${model === 'sonnet' ? 'is-on' : ''}`} href={hrefFor({ model: 'sonnet' })}>
            Sonnet
          </a>
        </div>
        {selected.size > 0 && (
          <button type="button" className="admin-new-btn" onClick={() => void researchSelected()} disabled={batchRunning}>
            {batchRunning ? 'Researching…' : `Research ${selected.size} selected`}
          </button>
        )}
      </div>

      <form className="admin-leads-filters" action="/admin/funnel/outreach" method="get">
        <input type="hidden" name="model" value={model} />
        <input type="search" name="q" defaultValue={filters.q} placeholder="Search name…" className="admin-form__input admin-leads-filter--search" />
        <select name="priority" defaultValue={filters.priority} className="admin-leads-select">
          <option value="">Any priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
        <select name="nosite" defaultValue={filters.nosite ? '1' : ''} className="admin-leads-select">
          <option value="">Site: any</option>
          <option value="1">No website</option>
        </select>
        <button type="submit" className="admin-new-btn">Apply</button>
      </form>

      {leads.length === 0 ? (
        <p className="admin-outreach__empty">No leads. Find some in the Leads tab first.</p>
      ) : (
        <ul className="admin-outreach__rows">
          {leads.map((l) => {
            const meta = latestByLead[l.id]
            const isOpen = l.id === selectedLeadId
            const busy = researching.has(l.id)
            const pill = busy ? 'researching' : meta?.status
            return (
              <li key={l.id} className={`admin-outreach__row ${isOpen ? 'is-open' : ''}`}>
                <input
                  type="checkbox"
                  className="admin-outreach__check"
                  checked={selected.has(l.id)}
                  onChange={() => toggleSelect(l.id)}
                  aria-label={`Select ${l.name}`}
                />
                <Link className="admin-outreach__rowmain" href={hrefFor({ lead: l.id })} aria-current={isOpen ? 'true' : undefined}>
                  <span className="admin-outreach__name" translate="no">{l.name || 'Untitled'}</span>
                  <span className="admin-outreach__meta">
                    {l.category ?? '–'} {l.priority ? `· ${l.priority}` : ''}
                  </span>
                </Link>
                {pill && (
                  <span className={`admin-outreach__pill is-${pill}`} role="status" aria-live="polite">
                    {STATUS_LABEL[pill] ?? pill}
                  </span>
                )}
                <button
                  type="button"
                  className="admin-outreach__research"
                  onClick={() => void researchOne(l.id)}
                  disabled={busy}
                  aria-busy={busy}
                  aria-label={meta ? `Re-research ${l.name}` : `Research ${l.name}`}
                >
                  {busy ? 'Researching…' : meta?.status === 'ready' ? 'Re-research' : 'Research'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
