'use client'

import { useState, useTransition } from 'react'
import { LEAD_STATUSES, LEAD_STATUS_LABELS, type MarketingLead } from './lib/leads-types'
import { setLeadFlag, setLeadStatus, updateLeadContact, deleteLead, promoteLeadToProject } from './leads-actions'

export function LeadsTable({ leads }: { leads: MarketingLead[] }) {
  return (
    <div className="admin-leads-tablewrap">
      <table className="admin-leads-table">
        <thead>
          <tr>
            <th>Ver.</th><th>Done</th><th>Business</th><th>Cat.</th><th>Prio</th><th>Score</th>
            <th>Phone</th><th>Email</th><th>Site</th><th>Pitch</th><th>Status</th><th>Notes</th><th></th>
          </tr>
        </thead>
        <tbody>
          {leads.map((l) => <LeadRow key={l.id} lead={l} />)}
        </tbody>
      </table>
    </div>
  )
}

function LeadRow({ lead }: { lead: MarketingLead }) {
  const [pending, start] = useTransition()
  const [phone, setPhone] = useState(lead.phone ?? '')
  const [email, setEmail] = useState(lead.email ?? '')
  const [notes, setNotes] = useState(lead.notes ?? '')
  const [gone, setGone] = useState(false)
  if (gone) return null

  const run = (fn: () => Promise<unknown>) => start(() => { void fn() })
  const prioClass = lead.priority ? `is-${lead.priority.toLowerCase()}` : ''

  return (
    <tr className={pending ? 'is-busy' : ''}>
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
      <td className="dim">{lead.category ?? ''}</td>
      <td><span className={`admin-prio ${prioClass}`}>{lead.priority ?? '—'}</span></td>
      <td className="ce strong">{lead.leadScore}</td>
      <td>
        <input className="admin-leads-edit" value={phone} placeholder="—" onChange={(e) => setPhone(e.target.value)}
          onBlur={() => phone !== (lead.phone ?? '') && run(() => updateLeadContact(lead.id, { phone }))} />
      </td>
      <td>
        <input className="admin-leads-edit" value={email} placeholder="—" onChange={(e) => setEmail(e.target.value)}
          onBlur={() => email !== (lead.email ?? '') && run(() => updateLeadContact(lead.id, { email }))} />
      </td>
      <td>
        {lead.website
          ? <a href={lead.website} target="_blank" rel="noopener noreferrer" className="admin-leads-link">open</a>
          : <span className="admin-leads-nosite">none</span>}
      </td>
      <td className="dim admin-leads-pitch" title={lead.pitchAngle ?? ''}>{lead.pitchAngle ?? ''}</td>
      <td>
        <select className="admin-leads-select" defaultValue={lead.status} onChange={(e) => run(() => setLeadStatus(lead.id, e.target.value))}>
          {LEAD_STATUSES.map((s) => <option key={s} value={s}>{LEAD_STATUS_LABELS[s]}</option>)}
        </select>
      </td>
      <td>
        <input className="admin-leads-edit" value={notes} placeholder="—" onChange={(e) => setNotes(e.target.value)}
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
