/**
 * Pure mappers between the plutus_* database rows and the @ds/plutus domain types.
 * Kept dependency-free and total: every field is coerced defensively so a stray
 * null from the DB can never crash the engine. Money is integer minor units on
 * both sides (bigint in Postgres, number in the domain).
 */

import type {
  AuditEvent,
  ChaseSequence,
  Contact,
  Customer,
  Invoice,
  Lang,
  Payment,
  PaymentTerms,
} from '@ds/plutus'

type Row = Record<string, unknown>

const str = (v: unknown, fallback = ''): string => (typeof v === 'string' ? v : fallback)
const num = (v: unknown, fallback = 0): number => {
  const n = typeof v === 'string' ? Number(v) : typeof v === 'number' ? v : NaN
  return Number.isFinite(n) ? n : fallback
}
const lang = (v: unknown): Lang => (v === 'en' ? 'en' : 'el')

export function rowToCustomer(r: Row): Customer {
  const contacts = Array.isArray(r.contacts) ? (r.contacts as Contact[]) : []
  return {
    id: str(r.customer_id),
    name: str(r.name),
    contacts: contacts.length ? contacts : [{ name: str(r.name) }],
    lang: lang(r.lang),
    calendar: str(r.calendar, 'GR'),
    sequenceId: str(r.sequence_id, 'standard'),
    ...(r.do_not_contact ? { doNotContact: true } : {}),
  }
}

export function rowToInvoice(r: Row): Invoice {
  const terms = (r.terms ?? { kind: 'net', days: 30 }) as PaymentTerms
  const status = str(r.status, 'open') as Invoice['status']
  return {
    id: str(r.invoice_id),
    number: str(r.number),
    customerId: str(r.customer_id),
    currency: str(r.currency, 'EUR') as Invoice['currency'],
    issueDate: str(r.issue_date),
    dueDate: str(r.due_date),
    terms,
    amount: num(r.amount),
    status,
    paidDate: typeof r.paid_date === 'string' ? r.paid_date : null,
    ...(r.dispute ? { dispute: r.dispute as Invoice['dispute'] } : {}),
    ...(r.amount_written_off != null ? { amountWrittenOff: num(r.amount_written_off) } : {}),
  }
}

export function rowToPayment(r: Row): Payment {
  return {
    id: str(r.payment_id),
    invoiceId: str(r.invoice_id),
    customerId: str(r.customer_id),
    amount: num(r.amount),
    date: str(r.date),
    ...(typeof r.method === 'string' ? { method: r.method as Payment['method'] } : {}),
    ...(typeof r.reference === 'string' ? { reference: r.reference } : {}),
  }
}

export function rowToSequence(r: Row): ChaseSequence {
  return {
    id: str(r.sequence_id),
    name: str(r.name),
    steps: Array.isArray(r.steps) ? (r.steps as ChaseSequence['steps']) : [],
    cooldownDays: num(r.cooldown_days, 5),
  }
}

export function rowToAuditEvent(r: Row): AuditEvent {
  return {
    id: str(r.id),
    tenantId: str(r.user_id),
    type: str(r.type) as AuditEvent['type'],
    ...(typeof r.customer_id === 'string' ? { customerId: r.customer_id } : {}),
    ...(typeof r.invoice_id === 'string' ? { invoiceId: r.invoice_id } : {}),
    ...(typeof r.step_id === 'string' ? { stepId: r.step_id } : {}),
    ...(typeof r.idempotency_key === 'string' ? { idempotencyKey: r.idempotency_key } : {}),
    actor: (r.actor ?? { kind: 'system', id: 'plutus' }) as AuditEvent['actor'],
    ...(typeof r.reason === 'string' ? { reason: r.reason } : {}),
    data: (r.data ?? {}) as Record<string, unknown>,
    occurredAt: str(r.occurred_at),
  }
}

/** Domain → DB row for an audit insert (user_id added by the caller). */
export function auditEventToRow(userId: string, e: AuditEvent): Row {
  return {
    user_id: userId,
    type: e.type,
    customer_id: e.customerId ?? null,
    invoice_id: e.invoiceId ?? null,
    step_id: e.stepId ?? null,
    idempotency_key: e.idempotencyKey ?? null,
    actor: e.actor,
    reason: e.reason ?? null,
    data: e.data,
  }
}

export function customerToRow(userId: string, c: Customer): Row {
  return {
    user_id: userId,
    customer_id: c.id,
    name: c.name,
    contacts: c.contacts,
    lang: c.lang,
    calendar: c.calendar,
    sequence_id: c.sequenceId,
    do_not_contact: c.doNotContact ?? false,
  }
}

export function invoiceToRow(userId: string, i: Invoice): Row {
  return {
    user_id: userId,
    invoice_id: i.id,
    number: i.number,
    customer_id: i.customerId,
    currency: i.currency,
    issue_date: i.issueDate,
    due_date: i.dueDate,
    terms: i.terms,
    amount: i.amount,
    status: i.status,
    paid_date: i.paidDate ?? null,
  }
}
