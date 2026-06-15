/**
 * Approval → send helpers. Reads a pending outbox row, resolves the recipient and
 * the live chaseable balance (so the engine's dispatch() can abort if cash landed
 * since approval), and records the decision: the outbox status transition plus an
 * append-only audit event. The actual send goes through the @ds/plutus Channel seam
 * (email-channel.ts), keeping this file about state, not transport.
 */

import 'server-only'

import type { AuditEvent, AuditEventType } from '@ds/plutus'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface OutboxRow {
  idempotency_key: string
  customer_id: string
  invoice_id: string
  step_id: string
  subject: string
  body: string
  status: string
}

export async function loadPendingOutbox(
  db: SupabaseClient,
  userId: string,
  key: string,
): Promise<OutboxRow | null> {
  const { data } = await db
    .from('plutus_outbox')
    .select('idempotency_key, customer_id, invoice_id, step_id, subject, body, status')
    .eq('user_id', userId)
    .eq('idempotency_key', key)
    .maybeSingle()
  return (data as OutboxRow | null) ?? null
}

export async function recipientEmailFor(
  db: SupabaseClient,
  userId: string,
  customerId: string,
): Promise<string | null> {
  const { data } = await db
    .from('plutus_customers')
    .select('contacts')
    .eq('user_id', userId)
    .eq('customer_id', customerId)
    .maybeSingle()
  const contacts = Array.isArray(data?.contacts) ? (data.contacts as Array<{ email?: unknown }>) : []
  for (const c of contacts) if (typeof c?.email === 'string' && c.email) return c.email
  return null
}

/** Live chaseable balance for one invoice, recomputed from the DB at send time. */
export async function chaseableDueFor(db: SupabaseClient, userId: string, invoiceId: string): Promise<number> {
  const { data: inv } = await db
    .from('plutus_invoices')
    .select('amount, amount_written_off, status, dispute')
    .eq('user_id', userId)
    .eq('invoice_id', invoiceId)
    .maybeSingle()
  if (!inv) return 0
  if (inv.status === 'paid' || inv.status === 'written_off') return 0

  const { data: pays } = await db
    .from('plutus_payments')
    .select('amount')
    .eq('user_id', userId)
    .eq('invoice_id', invoiceId)
  const paid = (pays ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0)
  const writtenOff = Number(inv.amount_written_off ?? 0)
  const dispute = inv.dispute as { amount?: number } | null
  const disputed = dispute && typeof dispute.amount === 'number' ? dispute.amount : 0
  return Math.max(0, Number(inv.amount) - paid - writtenOff - disputed)
}

export async function markOutbox(
  db: SupabaseClient,
  userId: string,
  key: string,
  patch: Record<string, unknown>,
): Promise<void> {
  await db.from('plutus_outbox').update(patch).eq('user_id', userId).eq('idempotency_key', key)
}

/** A ready-to-insert audit event; id/occurredAt are filled by DB defaults. */
export function auditFor(
  userId: string,
  type: AuditEventType,
  row: OutboxRow,
  extra: Partial<AuditEvent> = {},
): AuditEvent {
  return {
    id: '',
    tenantId: userId,
    type,
    customerId: row.customer_id,
    invoiceId: row.invoice_id,
    stepId: row.step_id,
    idempotencyKey: row.idempotency_key,
    actor: { kind: 'user', id: userId },
    data: {},
    occurredAt: '',
    ...extra,
  }
}
