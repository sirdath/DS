/** Shared shapes for the outreach surface. The CompanyBrief itself comes from @ds/peitho. */

import type { BriefSource, CompanyBrief } from '@ds/peitho'

export type BriefStatus = 'researching' | 'ready' | 'failed'

/** Lightweight per-lead brief metadata (for the table pill + history list). */
export interface BriefMeta {
  id: string
  leadId: string
  status: BriefStatus
  confidence: number | null
  model: string | null
  profile: string | null
  isCurrent: boolean
  error: string | null
  createdAt: string
}

/** The full current brief shown in the right pane. */
export interface BriefFull extends BriefMeta {
  brief: CompanyBrief | null
  sources: BriefSource[]
  gaps: string[]
  costUsd: number
}

function status(v: unknown): BriefStatus {
  return v === 'ready' || v === 'failed' ? v : 'researching'
}

export function rowToBriefMeta(r: Record<string, unknown>): BriefMeta {
  return {
    id: String(r.id),
    leadId: String(r.lead_id),
    status: status(r.status),
    confidence: r.confidence == null ? null : Number(r.confidence),
    model: typeof r.model === 'string' ? r.model : null,
    profile: typeof r.profile === 'string' ? r.profile : null,
    isCurrent: Boolean(r.is_current),
    error: typeof r.error === 'string' ? r.error : null,
    createdAt: String(r.created_at ?? ''),
  }
}

export function rowToBriefFull(r: Record<string, unknown>): BriefFull {
  return {
    ...rowToBriefMeta(r),
    brief: (r.brief_json as CompanyBrief | null) ?? null,
    sources: Array.isArray(r.sources) ? (r.sources as BriefSource[]) : [],
    gaps: Array.isArray(r.gaps) ? (r.gaps as string[]) : [],
    costUsd: r.cost_usd == null ? 0 : Number(r.cost_usd),
  }
}
