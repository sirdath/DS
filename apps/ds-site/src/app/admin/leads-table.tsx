'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type MarketingLead } from './lib/leads-types'
import { setLeadFlag, setLeadStatus, updateLeadContact, deleteLead, promoteLeadToProject, bulkSetStatus, bulkDeleteLeads } from './leads-actions'

export function LeadsTable({ leads }: { leads: MarketingLead[] }) {
  const router = useRouter()
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [busy, startBulk] = useTransition()

  const ids = leads.map((l) => l.id)
  const allSelected = selected.size > 0 && ids.every((id) => selected.has(id))
  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(ids))
  const clear = () => setSelected(new Set())

  const applyStatus = (status: string) => {
    if (!status || selected.size === 0) return
    startBulk(async () => {
      await bulkSetStatus([...selected], status)
      clear()
      router.refresh()
    })
  }
  const bulkDelete = () => {
    if (selected.size === 0 || !confirm(`Delete ${selected.size} selected leads?`)) return
    startBulk(async () => {
      await bulkDeleteLeads([...selected])
      clear()
      router.refresh()
    })
  }

  return (
    <div className="admin-leads-tablewrap">
      {selected.size > 0 && (
        <div className="admin-leads-bulkbar">
          <span className="admin-leads-bulkbar__count">{selected.size} selected</span>
          <select
            className="admin-leads-select"
            value=""
            disabled={busy}
            onChange={(e) => applyStatus(e.target.value)}
            aria-label="Set status for selected"
          >
            <option value="">Move to…</option>
            {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
          </select>
          <button type="button" className="admin-leads-bulkbar__btn" disabled={busy} onClick={() => applyStatus('in_progress')}>
            → In progress
          </button>
          <button type="button" className="admin-leads-bulkbar__btn danger" disabled={busy} onClick={bulkDelete}>Delete</button>
          <button type="button" className="admin-leads-bulkbar__btn" disabled={busy} onClick={clear}>Clear</button>
          {busy && <span className="dim">working…</span>}
        </div>
      )}
      <table className="admin-leads-table">
        <thead>
          <tr>
            <th className="ce"><input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all on page" /></th>
            <th>Ver.</th><th>Done</th><th>Business</th><th className="hide-sm">Cat.</th><th className="hide-sm">Prio</th><th className="hide-sm">Score</th>
            <th>Phone</th><th className="hide-sm">Email</th><th className="hide-sm">Site</th><th className="hide-sm">Pitch</th><th>Status</th><th className="hide-sm">Notes</th><th></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => <LeadRow key={l.id} lead={l} selected={selected.has(l.id)} onToggle={() => toggle(l.id)} />)}
        </tbody>
      </table>
    </div>
  )
}

function LeadRow({ lead, selected, onToggle }: { lead: MarketingLead; selected: boolean; onToggle: () => void }) {
  const [pending, start] = useTransition()
  const [phone, setPhone] = useState(lead.phone ?? '')
  const [email, setEmail] = useState(lead.email ?? '')
  const [notes, setNotes] = useState(lead.notes ?? '')
  const [gone, setGone] = useState(false)
  if (gone) return null

  const run = (fn: () => Promise<unknown>) => start(() => { void fn() })
  const prioClass = lead.priority ? `is-${lead.priority.toLowerCase()}` : ''

  return (
    <tr className={`${pending ? 'is-busy' : ''}${selected ? ' is-selected' : ''}`}>
      <td className="ce"><input type="checkbox" checked={selected} onChange={onToggle} aria-label={`Select ${lead.name}`} /></td>
      <td className="ce">
        <input type="checkbox" defaultChecked={lead.verified} onChange={(e) => run(() => setLeadFlag(lead.id, 'verified', e.target.checked))} />
      </td>
      <td className="ce">
        <input type="checkbox" defaultChecked={lead.contacted} onChange={(e) => run(() => setLeadFlag(lead.id, 'contacted', e.target.checked))} />
      </td>
      <td>
        <div className="admin-leads-name">{lead.name}</div>
        <div className="admin-leads-sub">{[lead.area, lead.source].filter(Boolean).join(' · ')}</div>
      </td>
      <td className="dim hide-sm">{lead.category ?? ''}</td>
      <td className="hide-sm"><span className={`admin-prio ${prioClass}`}>{lead.priority ?? '–'}</span></td>
      <td className="ce strong hide-sm">{lead.leadScore}</td>
      <td>
        <input className="admin-leads-edit" value={phone} placeholder=", " onChange={(e) => setPhone(e.target.value)}
          onBlur={() => phone !== (lead.phone ?? '') && run(() => updateLeadContact(lead.id, { phone }))} />
      </td>
      <td className="hide-sm">
        <input className="admin-leads-edit" value={email} placeholder=", " onChange={(e) => setEmail(e.target.value)}
          onBlur={() => email !== (lead.email ?? '') && run(() => updateLeadContact(lead.id, { email }))} />
      </td>
      <td className="hide-sm">
        {lead.website
          ? <a href={lead.website} target="_blank" rel="noopener noreferrer" className="admin-leads-link">open</a>
          : <span className="admin-leads-nosite">none</span>}
      </td>
      <td className="dim admin-leads-pitch hide-sm" title={lead.pitchAngle ?? ''}>{lead.pitchAngle ?? ''}</td>
      <td>
        <select className="admin-leads-select" defaultValue={lead.status} onChange={(e) => run(() => setLeadStatus(lead.id, e.target.value))}>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
        </select>
      </td>
      <td className="hide-sm">
        <input className="admin-leads-edit" value={notes} placeholder=", " onChange={(e) => setNotes(e.target.value)}
          onBlur={() => notes !== (lead.notes ?? '') && run(() => updateLeadContact(lead.id, { notes }))} />
      </td>
      <td className="admin-leads-actions">
        <button type="button" title="Promote to a project" onClick={() => run(() => promoteLeadToProject(lead.id))}>↑</button>
        <button type="button" title="Delete lead" className="danger" onClick={() => {
          if (confirm(`Delete "${lead.name}"?`)) { setGone(true); void deleteLead(lead.id) }
        }}>✕</button>
      </td>
    </tr>
  )
}
