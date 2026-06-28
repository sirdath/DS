import { getSupabaseServerClient } from '@/app/admin/lib/supabase-server'
import { rowToLead, type MarketingLead } from '@/app/admin/lib/leads-types'
import { OutreachTable } from './outreach-table'
import { OutreachBriefView } from './outreach-brief-view'
import { rowToBriefFull, rowToBriefMeta, type BriefFull, type BriefMeta } from './outreach-types'

export const dynamic = 'force-dynamic'

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

function pick(sp: Record<string, string | string[] | undefined>, key: string): string | undefined {
  const v = sp[key]
  return typeof v === 'string' && v ? v : undefined
}

export default async function OutreachPage({ searchParams }: PageProps) {
  const sp = await searchParams
  const selectedLeadId = pick(sp, 'lead') ?? null
  const model: 'opus' | 'sonnet' = pick(sp, 'model') === 'sonnet' ? 'sonnet' : 'opus'
  const search = pick(sp, 'q')
  const priority = pick(sp, 'priority')
  const status = pick(sp, 'status')
  const nosite = pick(sp, 'nosite') === '1'

  const hasSupabase = !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  let leads: MarketingLead[] = []
  const latestByLead: Record<string, BriefMeta> = {}
  let selectedLead: MarketingLead | null = null
  let selectedBrief: BriefFull | null = null
  let selectedHistory: BriefMeta[] = []
  let loadError: string | null = null

  if (hasSupabase) {
    try {
      const supabase = await getSupabaseServerClient()
      let query = supabase
        .from('marketing_leads')
        .select('*')
        .order('lead_score', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(100)
      if (priority) query = query.eq('priority', priority)
      if (status) query = query.eq('status', status)
      if (nosite) query = query.eq('has_website', false)
      if (search) query = query.ilike('name', `%${search}%`)

      const leadsRes = await query
      if (leadsRes.error) throw new Error(leadsRes.error.message)
      leads = (leadsRes.data ?? []).map((r) => rowToLead(r as Record<string, unknown>))

      const ids = leads.map((l) => l.id)
      if (ids.length) {
        const briefsRes = await supabase
          .from('outreach_briefs')
          .select('id, lead_id, status, confidence, model, profile, is_current, error, created_at')
          .in('lead_id', ids)
          .order('created_at', { ascending: false })
          .order('id', { ascending: false })
        for (const r of briefsRes.data ?? []) {
          const m = rowToBriefMeta(r as Record<string, unknown>)
          if (!latestByLead[m.leadId]) latestByLead[m.leadId] = m // first = newest
        }
      }

      if (selectedLeadId) {
        selectedLead = leads.find((l) => l.id === selectedLeadId) ?? null
        if (!selectedLead) {
          const one = await supabase.from('marketing_leads').select('*').eq('id', selectedLeadId).maybeSingle()
          if (one.data) selectedLead = rowToLead(one.data as Record<string, unknown>)
        }
        if (selectedLead) {
          const [curRes, histRes] = await Promise.all([
            supabase.from('outreach_briefs').select('*').eq('lead_id', selectedLeadId).eq('is_current', true).maybeSingle(),
            supabase
              .from('outreach_briefs')
              .select('id, lead_id, status, confidence, model, profile, is_current, error, created_at')
              .eq('lead_id', selectedLeadId)
              .order('created_at', { ascending: false })
              .order('id', { ascending: false }),
          ])
          if (curRes.data) selectedBrief = rowToBriefFull(curRes.data as Record<string, unknown>)
          selectedHistory = (histRes.data ?? []).map((r) => rowToBriefMeta(r as Record<string, unknown>))
        }
      }
    } catch (err) {
      loadError = err instanceof Error ? err.message : 'Failed to load'
    }
  }

  return (
    <div className="admin-container">
      <div className="admin-page-header">
        <p className="admin-page-eyebrow">DS2 · Outreach</p>
        <h1 className="admin-page-title">Outreach</h1>
        <p className="admin-page-sub">Research a prospect, get a grounded brief, then email or call.</p>
      </div>

      {!hasSupabase && (
        <p className="admin-leads-note">Supabase isn’t configured here, outreach is read-only/empty. Restore the project and apply the migration to use it.</p>
      )}
      {loadError && (
        <p className="admin-leads-note admin-leads-note--err">Couldn’t load: {loadError}. Has the outreach_briefs migration been applied?</p>
      )}

      <div className="admin-outreach">
        <OutreachTable
          leads={leads}
          latestByLead={latestByLead}
          selectedLeadId={selectedLeadId}
          model={model}
          filters={{ q: search ?? '', priority: priority ?? '', status: status ?? '', nosite }}
        />
        <OutreachBriefView lead={selectedLead} current={selectedBrief} history={selectedHistory} model={model} />
      </div>
    </div>
  )
}
