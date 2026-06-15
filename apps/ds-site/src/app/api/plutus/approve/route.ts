/**
 * Decide a pending reminder: approve-and-send, or reject. Approval routes through
 * the engine's dispatch(), which re-checks the live balance and aborts the send if
 * the invoice was settled since approval (the final stop-on-payment guard). Every
 * outcome writes an append-only audit event. The send itself uses the configured
 * Channel (Resend, or a no-op stub when unconfigured) — the key never leaves the
 * server and message bodies are never logged.
 */

import { dispatch } from '@ds/plutus'
import { NextResponse } from 'next/server'
import {
  auditFor,
  chaseableDueFor,
  claimPending,
  loadPendingOutbox,
  markOutbox,
  recipientEmailFor,
} from '../../../workspace/(app)/plutus/lib/approve'
import { getChannel } from '../../../workspace/(app)/plutus/lib/email-channel'
import { insertAuditEvents } from '../../../workspace/(app)/plutus/lib/persist'
import { clientIp, rateLimited, resolveApiSession, sameOrigin } from '../../../workspace/(app)/plutus/lib/route-helpers'

export const runtime = 'nodejs'

const FIELD_MAX = 8000

interface ApproveBody {
  idempotencyKey?: unknown
  decision?: unknown
  finalSubject?: unknown
  finalBody?: unknown
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Bad origin.' }, { status: 403 })
  if (rateLimited(clientIp(request))) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const auth = await resolveApiSession()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { db, userId } = auth.session

  let body: ApproveBody
  try {
    body = (await request.json()) as ApproveBody
  } catch {
    return NextResponse.json({ error: 'Bad request.' }, { status: 400 })
  }

  const key = typeof body.idempotencyKey === 'string' ? body.idempotencyKey : ''
  const decision = body.decision === 'approve' || body.decision === 'reject' ? body.decision : ''
  if (!key || !decision) return NextResponse.json({ error: 'Missing key or decision.' }, { status: 400 })

  const row = await loadPendingOutbox(db, userId, key)
  if (!row) return NextResponse.json({ error: 'Reminder not found.' }, { status: 404 })
  if (row.status !== 'pending') return NextResponse.json({ error: `Already ${row.status}.` }, { status: 409 })

  try {
    if (decision === 'reject') {
      const claimed = await claimPending(db, userId, key, { status: 'rejected', decided_by: userId })
      if (!claimed) return NextResponse.json({ error: 'Already decided.' }, { status: 409 })
      await insertAuditEvents(db, userId, [auditFor(userId, 'rejected', row)])
      return NextResponse.json({ status: 'rejected' })
    }

    const to = await recipientEmailFor(db, userId, row.customer_id)
    if (!to) return NextResponse.json({ error: 'No email on file for this customer.' }, { status: 422 })

    const subject = typeof body.finalSubject === 'string' ? body.finalSubject.slice(0, FIELD_MAX) : row.subject
    const message = {
      to,
      subject,
      body: typeof body.finalBody === 'string' ? body.finalBody.slice(0, FIELD_MAX) : row.body,
    }

    // Atomically claim the row to 'sent' BEFORE dispatching, so two concurrent
    // approvals can't both send. The loser gets 0 rows and bails with 409.
    const claimed = await claimPending(db, userId, key, {
      status: 'sent',
      decided_by: userId,
      sent_at: new Date().toISOString(),
    })
    if (!claimed) return NextResponse.json({ error: 'Already decided.' }, { status: 409 })

    let outcome
    try {
      outcome = await dispatch(getChannel(), message, key, () => chaseableDueFor(db, userId, row.invoice_id))
    } catch (sendErr) {
      // The send threw — revert the claim so it can be retried; Resend's own
      // idempotency key dedupes if the provider actually received it.
      await markOutbox(db, userId, key, { status: 'pending', decided_by: null, sent_at: null })
      throw sendErr
    }

    if (!outcome.sent) {
      // Balance settled between approval and send → compensate the claim.
      await markOutbox(db, userId, key, { status: 'cancelled' })
      await insertAuditEvents(db, userId, [auditFor(userId, 'cancelled', row, { reason: outcome.reason })])
      return NextResponse.json({ status: 'cancelled', reason: outcome.reason })
    }

    await insertAuditEvents(db, userId, [
      auditFor(userId, 'approved', row),
      auditFor(userId, 'sent', row, { data: { providerMessageId: outcome.result?.providerMessageId } }),
    ])
    return NextResponse.json({ status: 'sent' })
  } catch {
    return NextResponse.json({ error: 'Could not complete the decision.' }, { status: 502 })
  }
}
