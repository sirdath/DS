/**
 * Outreach research — runs the @ds/peitho engine for ONE lead and stores an
 * append-only brief row. Admin-only. Inserts a `researching` row, runs Stage A
 * (web research) → Stage B (structured synthesis) → fact-check, then flips the row
 * to `ready` + `is_current` (demoting any prior current brief first, so the partial
 * unique index never sees two currents). A failure leaves any prior brief intact.
 * Long-running: maxDuration=60 (lean profile). Never logs brief bodies (security.md).
 */

import { NextResponse } from 'next/server'
import {
  ACTIVE_PROFILE,
  WEB_SEARCH_USD_PER_1K,
  buildFacts,
  factCheckBrief,
  renderBriefMarkdown,
  research,
  resolveModel,
  synthesizeBrief,
} from '@ds/peitho'
import { assertAdmin } from '../../../../admin/lib/assert-admin'
import { rowToLead } from '../../../../admin/lib/leads-types'
import { getSessionUser, getSupabaseServerClient } from '../../../../admin/lib/supabase-server'

export const runtime = 'nodejs'
// 🔒 Next requires this to be a STATIC literal (no env ternary). Lean profile = 60s.
// When enabling the deep profile (OUTREACH_RESEARCH_DEEP=true) on Vercel Pro, change
// this to 300 in the same commit — a deep run will exceed 60s and would otherwise be
// killed mid-paid-call, leaving the row stuck `researching`.
export const maxDuration = 60

interface ResearchBody {
  leadId?: string
  model?: 'opus' | 'sonnet'
}

export async function POST(request: Request): Promise<Response> {
  try {
    await assertAdmin()
  } catch {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ ok: false, error: 'Research is not configured.' }, { status: 503 })
  }

  let body: ResearchBody
  try {
    body = (await request.json()) as ResearchBody
  } catch {
    return NextResponse.json({ ok: false, error: 'Bad request.' }, { status: 400 })
  }
  if (!body.leadId || typeof body.leadId !== 'string') {
    return NextResponse.json({ ok: false, error: 'Missing leadId' }, { status: 400 })
  }
  const model = resolveModel(body.model === 'sonnet' ? 'sonnet' : 'opus')
  const user = await getSessionUser()

  const supabase = await getSupabaseServerClient()
  const { data: row, error } = await supabase.from('marketing_leads').select('*').eq('id', body.leadId).single()
  if (error || !row) {
    return NextResponse.json({ ok: false, error: 'Lead not found' }, { status: 404 })
  }

  // Insert a new history row (NOT current yet). created_by attributes the paid run.
  const { data: created, error: insErr } = await supabase
    .from('outreach_briefs')
    .insert({ lead_id: body.leadId, status: 'researching', model, profile: ACTIVE_PROFILE.name, is_current: false, created_by: user?.id ?? null })
    .select('id')
    .single()
  if (insErr || !created) {
    return NextResponse.json({ ok: false, error: insErr?.message ?? 'insert failed' }, { status: 500 })
  }
  const briefId = created.id as string

  try {
    const facts = buildFacts(rowToLead(row))
    const r = await research(facts, { model, profile: ACTIVE_PROFILE })
    const { brief, usd } = await synthesizeBrief(facts, r, { model })
    const checked = factCheckBrief(brief, facts, r.sources)
    const finalBrief = { ...brief, confidence: checked.confidence, gaps: checked.gaps }
    const md = renderBriefMarkdown(finalBrief, r.sources)
    const cost = usd + r.usage.usd + (r.usage.search_count * WEB_SEARCH_USD_PER_1K) / 1000

    // Promote this brief to current ATOMICALLY (one transaction in the rpc): demote any
    // prior current, then mark this row ready + current. On error the rpc rolls back, so
    // the lead never ends up with zero currents — the catch below marks this row failed.
    const { error: markErr } = await supabase.rpc('outreach_mark_brief_current', {
      p_brief_id: briefId,
      p_lead_id: body.leadId,
      p_lang: facts.lang,
      p_brief_json: finalBrief,
      p_brief_md: md,
      p_sources: r.sources,
      p_confidence: checked.confidence,
      p_gaps: checked.gaps,
      p_input_tokens: r.usage.input_tokens,
      p_output_tokens: r.usage.output_tokens,
      p_search_count: r.usage.search_count,
      p_cost_usd: cost,
    })
    if (markErr) throw new Error(markErr.message)

    return NextResponse.json({ ok: true, briefId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'research failed'
    // Failure leaves any prior current brief intact.
    await supabase.from('outreach_briefs').update({ status: 'failed', error: msg }).eq('id', briefId)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
