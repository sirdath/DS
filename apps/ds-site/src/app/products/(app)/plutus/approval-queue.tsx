'use client'

import { useState } from 'react'
import './plutus.css'

export interface QueueVM {
  invoiceId: string
  customerName: string
  invoiceNumber: string
  amount: string
  daysOverdue: number
  tone: string
  subject: string
  body: string
}

type Decision = 'pending' | 'approved' | 'rejected'

export function ApprovalQueue({ items }: { items: QueueVM[] }) {
  const [decisions, setDecisions] = useState<Record<string, Decision>>({})
  const [editing, setEditing] = useState<string | null>(null)
  const [bodies, setBodies] = useState<Record<string, string>>({})

  function decide(id: string, d: Decision) {
    setDecisions((prev) => ({ ...prev, [id]: d }))
    if (editing === id) setEditing(null)
  }

  return (
    <div className="wp-queue">
      {items.map((item) => {
        const d = decisions[item.invoiceId] ?? 'pending'
        const body = bodies[item.invoiceId] ?? item.body
        const isEditing = editing === item.invoiceId
        return (
          <div key={item.invoiceId} className={`wp-draft is-${d}`}>
            <div className="wp-draft__head">
              <div>
                <span className="wp-draft__cust" translate="no">
                  {item.customerName}
                </span>
                <span className="wp-draft__meta">
                  {item.invoiceNumber} · {item.amount} · {item.daysOverdue}d overdue
                </span>
              </div>
              <span className="wp-tone">{item.tone}</span>
            </div>

            <p className="wp-draft__subject">{item.subject}</p>
            {isEditing ? (
              <textarea
                className="wp-draft__edit"
                value={body}
                onChange={(e) => setBodies((p) => ({ ...p, [item.invoiceId]: e.target.value }))}
                rows={9}
                aria-label={`Edit reminder for ${item.invoiceNumber}`}
              />
            ) : (
              <p className="wp-draft__body">{body}</p>
            )}

            {d === 'pending' ? (
              <div className="wp-draft__actions">
                <button className="wp-btn is-approve" onClick={() => decide(item.invoiceId, 'approved')}>
                  Approve &amp; send
                </button>
                <button className="wp-btn" onClick={() => setEditing(isEditing ? null : item.invoiceId)}>
                  {isEditing ? 'Done' : 'Edit'}
                </button>
                <button className="wp-btn is-reject" onClick={() => decide(item.invoiceId, 'rejected')}>
                  Reject
                </button>
              </div>
            ) : (
              <p className={`wp-draft__decision is-${d}`}>
                {d === 'approved' ? '✓ Approved — queued to send' : '✕ Rejected'}
              </p>
            )}
          </div>
        )
      })}
      <p className="wp-note">Preview — approvals here don&rsquo;t send anything.</p>
    </div>
  )
}
