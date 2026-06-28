import 'server-only'

import { createClient } from '@supabase/supabase-js'
import { TRACKED_SITES, type TrackedSite } from '@/app/admin/lib/sites'

// Athens time: the tracked sites (and the founders) are Athens-based, so "today"
// boundaries are most meaningful there.
const TZ = 'Europe/Athens'
const DAY_MS = 86_400_000

export interface SiteActivity {
  site: TrackedSite
  today: number
  yesterday: number
  last7: number
  uniqueVisitors7: number
  lastVisit: string | null
}

interface VisitRow {
  path: string | null
  created_at: string
  visitor_id: string | null
}

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key)
}

const dayKey = (iso: string | Date) => new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ })

function empty(site: TrackedSite): SiteActivity {
  return { site, today: 0, yesterday: 0, last7: 0, uniqueVisitors7: 0, lastVisit: null }
}

/**
 * Per-tracked-site traffic for the last 7 days — today vs yesterday (with the
 * delta the dashboard card and the Telegram digest both read), the 7-day total +
 * unique visitors, and the most recent visit. Shared so the card and the digest
 * never drift. Returns zeroed stats (never throws) when Supabase is unreachable.
 */
export async function loadSiteActivity(): Promise<SiteActivity[]> {
  const sb = getSupabase()
  if (!sb) return TRACKED_SITES.map(empty)

  const weekAgo = new Date(Date.now() - 7 * DAY_MS).toISOString()
  let rows: VisitRow[] = []
  try {
    const { data, error } = await sb
      .from('visits')
      .select('path, created_at, visitor_id')
      .gt('created_at', weekAgo)
      .order('created_at', { ascending: false })
    if (error) return TRACKED_SITES.map(empty)
    if (data) rows = data as VisitRow[]
  } catch {
    return TRACKED_SITES.map(empty)
  }

  const now = new Date()
  const todayKey = dayKey(now)
  const yesterdayKey = dayKey(new Date(now.getTime() - DAY_MS))

  return TRACKED_SITES.map((site) => {
    const visits = rows.filter((r) => r.path?.startsWith(site.pathPrefix))
    let today = 0
    let yesterday = 0
    const uniq = new Set<string>()
    for (const r of visits) {
      const k = dayKey(r.created_at)
      if (k === todayKey) today += 1
      else if (k === yesterdayKey) yesterday += 1
      if (r.visitor_id) uniq.add(r.visitor_id)
    }
    return {
      site,
      today,
      yesterday,
      last7: visits.length,
      uniqueVisitors7: uniq.size,
      lastVisit: visits[0]?.created_at ?? null,
    }
  })
}
