/**
 * Peitho data contract. Code owns the deterministic facts (the lead) and the schema;
 * the model produces the research dossier (Stage A) and the structured brief (Stage B).
 * Mirrors the Plutus split — pure types, no SDK/React/Supabase here.
 */

export type Lang = "en" | "el";

export interface ResearchProfile {
  name: "lean" | "deep";
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  useWebFetch: boolean;
  maxSearches: number;
  maxContinuations: number;
  researchMaxTokens: number;
}

/** Deterministic, code-computed inputs the model must not contradict. */
export interface OutreachFacts {
  leadId: string;
  businessName: string;
  category: string | null;
  area: string | null; // e.g. "Kifisia, Greece"
  website: string | null;
  hasWebsite: boolean;
  phone: string | null;
  email: string | null;
  lang: Lang; // el for .gr / Greek area, else en (facts.ts)
  // Signals already mined by the lead-finder — give the model a head start:
  pitchAngle: string | null; // marketing_leads.pitch_angle
  tags: string[]; // marketing_leads.tags  (e.g. "not-mobile-friendly")
  tech: string[]; // marketing_leads.tech  (e.g. "jQuery 1.11")
  ugliness: number | null; // marketing_leads.ugliness
}

export interface BriefSource {
  title: string;
  url: string;
}

export type PainSeverity = "high" | "medium" | "low";

export interface PainPoint {
  title: string;
  detail: string;
  severity: PainSeverity;
}

/** The structured, readable brief — what the UI renders and what the email (Phase 4) uses. */
export interface CompanyBrief {
  overview: string; // 2–4 sentences: who they are
  whatTheyDo: string; // products/services
  idealCustomers: string; // who they sell to (ICP)
  painPoints: PainPoint[];
  marketEnvironment: string; // competition, trends, local market
  competitors: string[]; // named competitors if found
  recentSignals: string[]; // news, hiring, launches, review trends — recency matters
  outreachAngle: string; // the ONE honest hook DS leads with (challenge-first)
  talkingPoints: string[]; // 3–6 bullets for a manual call
  emailSeeds: string[]; // 2–3 candidate subject/opening ideas (input to Phase 4)
  confidence: number; // 0..1 — the model's self-assessed grounding
  gaps: string[]; // what it couldn't verify
}

export interface PeithoUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  search_count: number; // # web_search calls (for cost)
  usd: number; // token cost only; route adds search cost
}

export interface ResearchResult {
  dossier: string; // the model's cited research write-up (Stage A output)
  sources: BriefSource[]; // URLs it actually consulted
  usage: PeithoUsage;
}
