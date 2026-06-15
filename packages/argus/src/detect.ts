/**
 * Change detection — the deterministic heart. For each competitor it diffs last
 * week's metrics against this week's and emits a typed, scored Movement for every
 * signal that moved meaningfully. A signal is only considered when present in BOTH
 * weeks, so a newly-added source never reads as a "change". Every number in a
 * headline/detail is computed here; the prose layer may only restate them.
 */

import { bandFromMagnitude, movementOrder } from "./impact";
import { asPct, formatMoney, pctChange } from "./money";
import type { CompetitorMetrics, CompetitorRef, Movement, MovementType, WeeklySnapshot } from "./types";

const clamp01 = (n: number): number => Math.max(0, Math.min(1, n));

function make(
  comp: CompetitorRef,
  weekOf: string,
  type: MovementType,
  magnitude: number,
  headline: string,
  detail: string,
): Movement {
  const m = clamp01(magnitude);
  return { competitorId: comp.id, competitorName: comp.name, type, headline, detail, weekOf, impact: bandFromMagnitude(m, type), magnitude: m };
}

function detectPricing(prev: CompetitorMetrics, curr: CompetitorMetrics, comp: CompetitorRef, weekOf: string): Movement | null {
  if (prev.avgRate == null || curr.avgRate == null) return null;
  const frac = pctChange(prev.avgRate, curr.avgRate);
  if (Math.abs(frac) < 0.03) return null;
  const cur = curr.currency ?? prev.currency ?? "EUR";
  const dir = frac < 0 ? "Cut" : "Raised";
  return make(
    comp,
    weekOf,
    "pricing",
    Math.abs(frac) / 0.15, // double-digit % moves read as high impact
    `${dir} rates ${asPct(frac)}%`,
    `${formatMoney(prev.avgRate, cur)} → ${formatMoney(curr.avgRate, cur)} representative nightly rate.`,
  );
}

function detectReviews(prev: CompetitorMetrics, curr: CompetitorMetrics, comp: CompetitorRef, weekOf: string): Movement | null {
  if (prev.reviewCount == null || curr.reviewCount == null) return null;
  const velocity = curr.reviewCount - prev.reviewCount;
  const ratingDelta = (curr.rating ?? 0) - (prev.rating ?? 0);
  const hasRating = prev.rating != null && curr.rating != null;
  const ratingMoved = hasRating && Math.abs(ratingDelta) >= 0.2;
  if (velocity < 5 && !ratingMoved) return null;

  const velMag = velocity > 0 ? velocity / 20 : 0;
  const ratingMag = hasRating ? Math.abs(ratingDelta) / 0.5 : 0;
  const ratingNote = hasRating && Math.abs(ratingDelta) >= 0.1 ? ` Rating ${ratingDelta >= 0 ? "up" : "down"} to ${curr.rating?.toFixed(1)}★.` : "";

  // Frame off review velocity only when reviews actually grew; otherwise it's a
  // rating story (a velocity of 0 or fewer reviews must never read as "N new").
  if (velocity > 0) {
    return make(comp, weekOf, "reviews", Math.max(velMag, ratingMag), `${velocity} new review${velocity === 1 ? "" : "s"} this week`, `Total ${curr.reviewCount}.${ratingNote}`);
  }
  return make(comp, weekOf, "reviews", ratingMag, `Rating ${ratingDelta >= 0 ? "up" : "down"} to ${curr.rating?.toFixed(1)}★`, `Now ${curr.reviewCount} reviews.`);
}

function detectSocial(prev: CompetitorMetrics, curr: CompetitorMetrics, comp: CompetitorRef, weekOf: string): Movement | null {
  if (prev.instagramFollowers == null || curr.instagramFollowers == null) return null;
  const frac = pctChange(prev.instagramFollowers, curr.instagramFollowers);
  if (Math.abs(frac) < 0.05) return null; // surface notable losses too, not just gains
  const delta = curr.instagramFollowers - prev.instagramFollowers;
  const dir = delta >= 0 ? "up" : "down";
  return make(
    comp,
    weekOf,
    "social",
    Math.abs(frac) / 0.2,
    `Instagram ${dir} ~${Math.abs(delta).toLocaleString("en")} followers`,
    `${asPct(frac) >= 0 ? "+" : ""}${asPct(frac)}% week-over-week, to ${curr.instagramFollowers.toLocaleString("en")}.`,
  );
}

function detectSeo(prev: CompetitorMetrics, curr: CompetitorMetrics, comp: CompetitorRef, weekOf: string): Movement | null {
  if (!prev.seoRanks || !curr.seoRanks) return null;
  let best: { kw: string; from: number; to: number; mag: number } | null = null;
  for (const [kw, to] of Object.entries(curr.seoRanks)) {
    const from = prev.seoRanks[kw];
    if (from == null || from === to) continue; // only an actual rank change is a movement
    const moved = Math.abs(from - to);
    const crossesTop = (from > 3 && to <= 3) || (from <= 3 && to > 3) || to === 1 || from === 1;
    if (moved < 2 && !crossesTop) continue;
    const mag = Math.max(moved / 5, crossesTop ? 0.7 : 0);
    if (!best || mag > best.mag) best = { kw, from, to, mag };
  }
  if (!best) return null;
  const improved = best.to < best.from;
  return make(
    comp,
    weekOf,
    "seo",
    best.mag,
    `${improved ? "Climbed to" : "Slipped to"} #${best.to} for “${best.kw}”`,
    `Was #${best.from} last week.`,
  );
}

function detectOffers(prev: CompetitorMetrics, curr: CompetitorMetrics, comp: CompetitorRef, weekOf: string): Movement | null {
  if (!prev.offers || !curr.offers) return null;
  const added = curr.offers.filter((o) => !prev.offers?.includes(o));
  if (added.length === 0) return null;
  return make(comp, weekOf, "offer", 0.62, `Launched a new offer`, added.join("; ") + ".");
}

function detectContent(prev: CompetitorMetrics, curr: CompetitorMetrics, comp: CompetitorRef, weekOf: string): Movement | null {
  if (!prev.contentHash || !curr.contentHash || prev.contentHash === curr.contentHash) return null;
  return make(comp, weekOf, "content", 0.4, `Refreshed their site content`, `Marketing/landing content changed since last week.`);
}

function detectHiring(prev: CompetitorMetrics, curr: CompetitorMetrics, comp: CompetitorRef, weekOf: string): Movement | null {
  if (!prev.hiring || !curr.hiring) return null;
  const added = curr.hiring.filter((h) => !prev.hiring?.includes(h));
  if (added.length === 0) return null;
  return make(comp, weekOf, "hiring", 0.3, `Hiring: ${added[0]}`, `New role${added.length > 1 ? "s" : ""} posted: ${added.join("; ")}.`);
}

const DETECTORS = [detectPricing, detectReviews, detectSocial, detectSeo, detectOffers, detectContent, detectHiring];

/** Diff two weeks of snapshots into a ranked list of movements. Pure. */
export function detectMovements(
  prev: WeeklySnapshot[],
  curr: WeeklySnapshot[],
  competitors: CompetitorRef[],
  weekOf: string,
): Movement[] {
  const prevById = new Map(prev.map((s) => [s.competitorId, s.metrics]));
  const compById = new Map(competitors.map((c) => [c.id, c]));
  const out: Movement[] = [];
  for (const snap of curr) {
    const before = prevById.get(snap.competitorId);
    const comp = compById.get(snap.competitorId);
    if (!before || !comp) continue;
    for (const detect of DETECTORS) {
      const mv = detect(before, snap.metrics, comp, weekOf);
      if (mv) out.push(mv);
    }
  }
  return out.sort(movementOrder);
}
