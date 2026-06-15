/**
 * The demo tenant — Aetheria Suites, a boutique hotel in Plaka, Athens, watching
 * four real-feeling competitors. Two weeks of metrics (last week's snapshots + this
 * week's observed values) chosen so the deterministic detector produces a rich,
 * believable briefing: a 12% midweek price cut, an SEO #4→#1 swing, a launched
 * offer with a review surge, a content refresh, and a social spike. This is the
 * same business used across Fama/Xenia so the portal reads as one client's cockpit.
 */

import type { CompetitorMetrics, CompetitorRef, BusinessRef, WeeklySnapshot } from "./types";

export const SAMPLE_BUSINESS: BusinessRef = {
  name: "Aetheria Suites",
  location: "Plaka, Athens",
  lang: "en",
  currency: "EUR",
  keywords: ["boutique hotel Plaka"],
};

export const SAMPLE_COMPETITORS: CompetitorRef[] = [
  { id: "plaka-central", name: "Plaka Central Suites", url: "plakacentralsuites.gr" },
  { id: "acropolis-view", name: "Acropolis View Boutique", url: "acropolisviewathens.com" },
  { id: "athens-heritage", name: "Athens Heritage Rooms", url: "athensheritagerooms.gr" },
  { id: "monastiraki-loft", name: "Monastiraki Loft Hotel", url: "monastirakiloft.com" },
];

export const SAMPLE_PREV_WEEK = "2026-06-01";
export const SAMPLE_WEEK_OF = "2026-06-08";

/** Last week's baseline. */
export const SAMPLE_PREV_SNAPSHOTS: WeeklySnapshot[] = [
  {
    competitorId: "plaka-central",
    weekOf: SAMPLE_PREV_WEEK,
    metrics: { avgRate: 14200, currency: "EUR", rating: 4.5, reviewCount: 477, instagramFollowers: 6100, seoRanks: { "boutique hotel Plaka": 4 }, offers: [] },
  },
  {
    competitorId: "acropolis-view",
    weekOf: SAMPLE_PREV_WEEK,
    metrics: { avgRate: 16500, currency: "EUR", rating: 4.7, reviewCount: 593, instagramFollowers: 8900, offers: [] },
  },
  {
    competitorId: "athens-heritage",
    weekOf: SAMPLE_PREV_WEEK,
    metrics: { avgRate: 16800, currency: "EUR", rating: 4.4, reviewCount: 346, instagramFollowers: 3950, contentHash: "heritage-v1" },
  },
  {
    competitorId: "monastiraki-loft",
    weekOf: SAMPLE_PREV_WEEK,
    metrics: { avgRate: 14800, currency: "EUR", rating: 4.6, reviewCount: 287, instagramFollowers: 9900, hiring: [] },
  },
];

/** This week's observed metrics, by competitor id — for the ExampleObserver. */
export const SAMPLE_CURR: Record<string, CompetitorMetrics> = {
  "plaka-central": { avgRate: 12500, currency: "EUR", rating: 4.5, reviewCount: 481, instagramFollowers: 6200, seoRanks: { "boutique hotel Plaka": 1 }, offers: [] },
  "acropolis-view": { avgRate: 16500, currency: "EUR", rating: 4.7, reviewCount: 612, instagramFollowers: 9100, offers: ["Free airport transfer on 3+ night direct stays"] },
  "athens-heritage": { avgRate: 17800, currency: "EUR", rating: 4.4, reviewCount: 350, instagramFollowers: 4000, contentHash: "heritage-v2" },
  "monastiraki-loft": { avgRate: 14800, currency: "EUR", rating: 4.6, reviewCount: 291, instagramFollowers: 11300, hiring: ["Guest experience manager"] },
};

export function getSample() {
  return {
    business: SAMPLE_BUSINESS,
    competitors: SAMPLE_COMPETITORS,
    prevSnapshots: SAMPLE_PREV_SNAPSHOTS,
    currMetrics: SAMPLE_CURR,
    weekOf: SAMPLE_WEEK_OF,
  } as const;
}
