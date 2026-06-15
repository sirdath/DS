/**
 * Argus data contract. The organizing principle mirrors Plutus: code owns every
 * number and the change detection; Claude only writes the briefing prose. So the
 * model splits into observations we capture and diff (per-competitor weekly
 * metrics → typed, scored movements) and the one thing the model produces (a weekly
 * summary + recommendations), fact-checked against the computed movements.
 *
 * Money (nightly rates) is integer minor units + a currency — never a float.
 * "Week of" is an ISO date (the Monday of the reporting week).
 */

export type Lang = "el" | "en";
export type Currency = "EUR" | "GBP" | "USD";
/** Money in integer minor units (cents). Never a float. */
export type Minor = number;
/** Date-only, ISO 8601, e.g. "2026-06-08" (the Monday of the reporting week). */
export type IsoDate = string;

export type MovementType = "pricing" | "offer" | "content" | "seo" | "social" | "reviews" | "hiring";
export type Impact = "high" | "medium" | "low";

/** The DS2 client whose competitors we watch. */
export interface BusinessRef {
  name: string;
  location: string;
  lang: Lang;
  currency: Currency;
  /** The search terms this business cares about ranking for. */
  keywords?: string[];
}

/** A single competitor to watch. */
export interface CompetitorRef {
  id: string;
  name: string;
  url: string;
  note?: string;
}

/**
 * One competitor's observed metrics for a week. Every field is optional because
 * sources differ (a clinic has no nightly rate; a café may have no SEO data) — the
 * diff core only emits a movement for a signal present in BOTH weeks.
 */
export interface CompetitorMetrics {
  /** Representative nightly/headline rate in minor units. */
  avgRate?: Minor;
  currency?: Currency;
  /** Aggregate star rating, 0–5. */
  rating?: number;
  /** Total published reviews. */
  reviewCount?: number;
  /** Public follower count on the primary social channel. */
  instagramFollowers?: number;
  /** Search rank per keyword (1 = top); lower is better. */
  seoRanks?: Record<string, number>;
  /** Live promotional offers, normalized to short phrases. */
  offers?: string[];
  /** A stable hash of the marketing/content surface, to flag refreshes. */
  contentHash?: string;
  /** Open roles, normalized to titles. */
  hiring?: string[];
}

/** A competitor's metrics for one reporting week (the unit we snapshot + diff). */
export interface WeeklySnapshot {
  competitorId: string;
  weekOf: IsoDate;
  metrics: CompetitorMetrics;
}

/** A detected, scored change between two weeks — all fields code-computed. */
export interface Movement {
  competitorId: string;
  competitorName: string;
  type: MovementType;
  headline: string;
  detail: string;
  weekOf: IsoDate;
  impact: Impact;
  /** Normalized 0..1 strength of the change, drives ranking + impact. */
  magnitude: number;
}

/** A row of the competitor board — current metrics with week-over-week deltas. */
export interface BoardRow {
  competitorId: string;
  name: string;
  url: string;
  note?: string;
  avgRate?: Minor;
  currency?: Currency;
  rateDeltaPct: number;
  rating?: number;
  ratingDelta: number;
  reviewCount?: number;
  reviewVelocity: number;
  instagramFollowers?: number;
  followerDeltaPct: number;
}

export interface Recommendation {
  action: string;
  rationale: string;
}

/** Usage / cost (identical shape to fama/xenia/aegis/plutus). */
export interface ArgusUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  usd: number;
}

/** The frozen facts handed to the prose layer — nothing else may be referenced. */
export interface BriefingFacts {
  business: string;
  location: string;
  weekOf: IsoDate;
  competitorNames: string[];
  movements: Array<{
    competitor: string;
    type: MovementType;
    impact: Impact;
    headline: string;
    detail: string;
  }>;
  board: Array<{ name: string; line: string }>;
  lang: Lang;
}

/** The full weekly briefing — the engine's public output. */
export interface Briefing {
  business: string;
  location: string;
  weekOf: IsoDate;
  competitorCount: number;
  summary: string;
  recommendations: Recommendation[];
  movements: Movement[];
  board: BoardRow[];
  factCheckPassed: boolean;
  factCheckIssues: string[];
  usage: ArgusUsage;
}
