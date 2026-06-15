/**
 * Database writes for the Plutus routes, each one idempotent so a re-run is safe.
 * Receivables upsert on their natural key; audit events are append-only inserts;
 * outbox rows are created once per idempotency key (never clobbering a decided
 * row) and their draft text is refreshed only while still pending. This is where
 * the engine's exactly-once guarantee meets the database's UNIQUE constraint.
 */

import 'server-only'

import type { AuditEvent, Customer, Invoice, QueueItem } from '@ds/plutus'
import type { SupabaseClient } from '@supabase/supabase-js'
import { auditEventToRow, customerToRow, invoiceToRow } from './row-mappers'

export async function upsertReceivables(
  db: SupabaseClient,
  userId: string,
  customers: Customer[],
  invoices: Invoice[],
): Promise<void> {
  if (customers.length) {
    const { error } = await db
      .from('plutus_customers')
      .upsert(customers.map((c) => customerToRow(userId, c)), { onConflict: 'user_id,customer_id' })
    if (error) throw new Error(`customer upsert failed: ${error.message}`)
  }
  if (invoices.length) {
    const { error } = await db
      .from('plutus_invoices')
      .upsert(invoices.map((i) => invoiceToRow(userId, i)), { onConflict: 'user_id,invoice_id' })
    if (error) throw new Error(`invoice upsert failed: ${error.message}`)
  }
}

export async function insertAuditEvents(db: SupabaseClient, userId: string, events: AuditEvent[]): Promise<void> {
  if (!events.length) return
  // Append-only, but idempotent on (user_id, idempotency_key, type): a cycle re-run
  // won't duplicate a keyed marker. Un-keyed events have distinct NULL keys, so they
  // always insert. ignoreDuplicates keeps this a pure INSERT (allowed by RLS).
  const { error } = await db
    .from('plutus_audit')
    .upsert(events.map((e) => auditEventToRow(userId, e)), { onConflict: 'user_id,idempotency_key,type', ignoreDuplicates: true })
  if (error) throw new Error(`audit insert failed: ${error.message}`)
}

function outboxRow(userId: string, item: QueueItem): Record<string, unknown> {
  const { step, draft } = item
  return {
    user_id: userId,
    idempotency_key: step.idempotencyKey,
    customer_id: step.customerId,
    invoice_id: step.invoiceId,
    step_id: step.stepId,
    channel: step.channel,
    tone: step.tone,
    lang: step.facts.lang,
    subject: draft?.subject ?? '',
    body: draft?.body ?? '',
    body_hash: draft?.bodyHash ?? '',
    scheduled_for: step.scheduledFor,
  }
}

/** Create a pending outbox row per new step; refresh draft text on pending rows. */
export async function syncOutbox(db: SupabaseClient, userId: string, queue: QueueItem[]): Promise<void> {
  if (!queue.length) return
  const { error } = await db
    .from('plutus_outbox')
    .upsert(queue.map((q) => outboxRow(userId, q)), { onConflict: 'idempotency_key', ignoreDuplicates: true })
  if (error) throw new Error(`outbox insert failed: ${error.message}`)

  for (const q of queue) {
    if (!q.draft) continue
    const { error: refreshError } = await db
      .from('plutus_outbox')
      .update({ subject: q.draft.subject, body: q.draft.body, body_hash: q.draft.bodyHash })
      .eq('user_id', userId)
      .eq('idempotency_key', q.step.idempotencyKey)
      .eq('status', 'pending')
    if (refreshError) throw new Error(`outbox draft refresh failed: ${refreshError.message}`)
  }
}
