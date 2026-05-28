/** UI shape for a marketing lead + the row→UI mapper. Client-safe (no server imports). */

export const LEAD_STATUSES = [
  "new", "in_progress", "contacted", "replied", "meeting", "won", "lost", "not_a_fit",
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New", in_progress: "In progress", contacted: "Contacted", replied: "Replied",
  meeting: "Meeting", won: "Won", lost: "Lost", not_a_fit: "Not a fit",
};

export interface MarketingLead {
  id: string;
  source: string;
  name: string;
  category: string | null;
  area: string | null;
  website: string | null;
  hasWebsite: boolean;
  phone: string | null;
  email: string | null;
  address: string | null;
  leadScore: number;
  ugliness: number | null;
  priority: string | null;
  tags: string[];
  tech: string[];
  pitchAngle: string | null;
  mapsUrl: string | null;
  analysisStatus: string;
  verified: boolean;
  contacted: boolean;
  status: LeadStatus;
  notes: string;
  createdAt: string;
}

/* ── Redesign-target "hunt" ─────────────────────────────────────────── */
export const VISION_TIERS = ["disaster", "rough", "dated", "ok"] as const;
export type VisionTier = (typeof VISION_TIERS)[number];
export const TIER_LABEL: Record<VisionTier, string> = {
  disaster: "💀 Disaster", rough: "🔥 Rough", dated: "🛠 Dated", ok: "✅ OK",
};

export interface RedesignTarget {
  id: string;
  industry: string;
  area: string | null;
  name: string;
  website: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  source: string;
  screenshotPath: string | null;
  heuristicScore: number | null;
  tags: string[];
  tech: string[];
  visionScore: number | null;
  visionTier: string | null;
  visionNotes: string | null;
  visionStatus: string;
  status: LeadStatus;
  verified: boolean;
  contacted: boolean;
  notes: string;
  createdAt: string;
}

export function rowToTarget(r: Record<string, unknown>): RedesignTarget {
  const s = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
  return {
    id: String(r.id),
    industry: String(r.industry ?? "business"),
    area: s(r.area),
    name: String(r.name ?? ""),
    website: String(r.website ?? ""),
    phone: s(r.phone),
    email: s(r.email),
    address: s(r.address),
    source: String(r.source ?? "osm"),
    screenshotPath: s(r.screenshot_path),
    heuristicScore: r.heuristic_score == null ? null : Number(r.heuristic_score),
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    tech: Array.isArray(r.tech) ? (r.tech as string[]) : [],
    visionScore: r.vision_score == null ? null : Number(r.vision_score),
    visionTier: s(r.vision_tier),
    visionNotes: s(r.vision_notes),
    visionStatus: String(r.vision_status ?? "pending"),
    status: (LEAD_STATUSES as readonly string[]).includes(String(r.status)) ? (r.status as LeadStatus) : "new",
    verified: Boolean(r.verified),
    contacted: Boolean(r.contacted),
    notes: String(r.notes ?? ""),
    createdAt: String(r.created_at ?? ""),
  };
}

export interface ParsedLead {
  name: string;
  category: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  area: string | null;
  notes: string | null;
}

/** Raw DB row (snake_case) → camelCase UI lead. */
export function rowToLead(r: Record<string, unknown>): MarketingLead {
  const s = (v: unknown): string | null => (typeof v === "string" && v ? v : null);
  return {
    id: String(r.id),
    source: String(r.source ?? "manual"),
    name: String(r.name ?? ""),
    category: s(r.category),
    area: s(r.area),
    website: s(r.website),
    hasWebsite: Boolean(r.has_website),
    phone: s(r.phone),
    email: s(r.email),
    address: s(r.address),
    leadScore: Number(r.lead_score ?? 0),
    ugliness: r.ugliness == null ? null : Number(r.ugliness),
    priority: s(r.priority),
    tags: Array.isArray(r.tags) ? (r.tags as string[]) : [],
    tech: Array.isArray(r.tech) ? (r.tech as string[]) : [],
    pitchAngle: s(r.pitch_angle),
    mapsUrl: s(r.maps_url),
    analysisStatus: String(r.analysis_status ?? "pending"),
    verified: Boolean(r.verified),
    contacted: Boolean(r.contacted),
    status: (LEAD_STATUSES as readonly string[]).includes(String(r.status)) ? (r.status as LeadStatus) : "new",
    notes: String(r.notes ?? ""),
    createdAt: String(r.created_at ?? ""),
  };
}
