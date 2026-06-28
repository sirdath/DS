/**
 * Run one daily collections cycle for the signed-in client and persist the result.
 * Reads their receivables + prior audit log, lets the engine compute the chase list
 * and the genuinely-new due steps, drafts reminders when a model key is present
 * (otherwise scan-only), then appends the new audit events and syncs the outbox.
 * Exactly-once is preserved end-to-end: the engine dedupes against the audit log and
 * the outbox UNIQUE(idempotency_key) refuses a duplicate send row. Returns a summary
 * only — never draft bodies or cost to the client.
 */

import { runDailyCycle } from '@ds/plutus'
import { NextResponse } from 'next/server'
import { loadRealContext } from '../../../products/(app)/plutus/lib/plutus-context'
import { insertAuditEvents, syncOutbox } from '../../../products/(app)/plutus/lib/persist'
import { clientIp, rateLimited, resolveApiSession, sameOrigin } from '../../../products/(app)/plutus/lib/route-helpers'

export const runtime = 'nodejs'

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return NextResponse.json({ error: 'Bad origin.' }, { status: 403 })
  if (rateLimited(clientIp(request))) return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })

  const auth = await resolveApiSession()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  const { db, userId, email } = auth.session

  let ctx
  try {
    ctx = await loadRealContext(db, userId, email)
  } catch {
    return NextResponse.json({ error: 'Could not read your receivables.' }, { status: 502 })
  }
  if (!ctx) {
    return NextResponse.json({ queued: 0, drafted: 0, message: 'No invoices yet, import a CSV first.' })
  }

  try {
    const result = await runDailyCycle({
      tenantId: ctx.tenantId,
      business: ctx.business,
      source: ctx.source,
      sequences: ctx.sequences,
      today: ctx.today,
      priorEvents: ctx.priorEvents,
      scanOnly: !process.env.ANTHROPIC_API_KEY,
    })

    await insertAuditEvents(db, userId, result.newEvents)
    await syncOutbox(db, userId, result.queue)

    return NextResponse.json({
      queued: result.queue.length,
      drafted: result.queue.filter((q) => q.draft).length,
      events: result.newEvents.length,
    })
  } catch {
    return NextResponse.json({ error: 'The cycle could not complete.' }, { status: 502 })
  }
}
