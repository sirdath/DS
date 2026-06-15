/**
 * Resolves the data context the Plutus surface runs on: the signed-in client's
 * real receivables when they have any, otherwise the built-in demo tenant. This is
 * the single place that decides "real vs example", so the page and the cycle route
 * share one definition of truth. Read-only — persistence happens in the routes.
 */

import 'server-only'

import {
  getSample,
  InMemorySource,
  SAMPLE_TODAY,
  type AccountingSource,
  type AuditEvent,
  type BusinessProfile,
  type ChaseSequence,
  type Customer,
} from '@ds/plutus'
import type { SupabaseClient } from '@supabase/supabase-js'
import { getSupabaseServerClient } from '../../../../admin/lib/supabase-server'
import { resolveWorkspaceSession } from '../../../lib/workspace-auth'
import { rowToAuditEvent, rowToSequence } from './row-mappers'
import { SupabaseAccountingSource } from './supabase-source'

export interface PlutusContext {
  isReal: boolean
  tenantId: string
  today: string
  business: BusinessProfile
  source: AccountingSource
  sequences: ChaseSequence[]
  priorEvents: AuditEvent[]
  customers: Customer[]
}

function demoContext(): PlutusContext {
  const t = getSample()
  return {
    isReal: false,
    tenantId: t.tenantId,
    today: SAMPLE_TODAY,
    business: t.business,
    source: new InMemorySource({ customers: t.customers, invoices: t.invoices, payments: t.payments }),
    sequences: t.sequences,
    priorEvents: [],
    customers: t.customers,
  }
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10)
}

/**
 * Build the real context for a known user/client, or null when they have no
 * invoices yet. Used by both the page (which falls back to the demo) and the cycle
 * route (which reports "import a CSV first" on null). The fallback email name is
 * passed in because routes don't carry the workspace session object.
 */
export async function loadRealContext(
  db: SupabaseClient,
  userId: string,
  fallbackName: string,
): Promise<PlutusContext | null> {
  const source = new SupabaseAccountingSource(db, userId)
  const [customers, invoices] = await Promise.all([source.listCustomers(), source.listInvoices()])
  if (invoices.length === 0) return null

  const [bizRes, seqRes, auditRes] = await Promise.all([
    db.from('plutus_business').select('*').eq('user_id', userId).maybeSingle(),
    db.from('plutus_sequences').select('*').eq('user_id', userId),
    db.from('plutus_audit').select('*').eq('user_id', userId),
  ])
  // The audit log + sequences are correctness-critical: running the cycle on a
  // silently-empty audit would defeat exactly-once dedupe + cooldown. Fail loudly.
  if (seqRes.error) throw new Error(`plutus_sequences read failed: ${seqRes.error.message}`)
  if (auditRes.error) throw new Error(`plutus_audit read failed: ${auditRes.error.message}`)
  const bizRow = bizRes.data
  const seqRows = seqRes.data
  const auditRows = auditRes.data

  const sample = getSample()
  const business: BusinessProfile = bizRow
    ? {
        name: typeof bizRow.name === 'string' && bizRow.name ? bizRow.name : fallbackName,
        lang: bizRow.lang === 'en' ? 'en' : 'el',
        calendar: typeof bizRow.calendar === 'string' ? bizRow.calendar : 'GR',
        ...(typeof bizRow.pay_to_instructions === 'string' ? { payToInstructions: bizRow.pay_to_instructions } : {}),
      }
    : { name: fallbackName, lang: 'el', calendar: 'GR' }

  return {
    isReal: true,
    tenantId: userId,
    today: todayIso(),
    business,
    source,
    sequences: seqRows && seqRows.length ? seqRows.map(rowToSequence) : sample.sequences,
    priorEvents: (auditRows ?? []).map(rowToAuditEvent),
    customers,
  }
}

export async function loadPlutusContext(): Promise<PlutusContext> {
  const hasEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  if (!hasEnv) return demoContext()

  const session = await resolveWorkspaceSession()
  if (!session?.userId) return demoContext()

  try {
    const db = await getSupabaseServerClient()
    const real = await loadRealContext(db, session.userId, session.email)
    return real ?? demoContext()
  } catch {
    // Any read failure (mis-config, network) degrades to the demo — never a 500.
    return demoContext()
  }
}
