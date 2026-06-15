/**
 * The competitor board — current metrics with week-over-week deltas, one row per
 * competitor. Pure: it reads the same two snapshots the detector does, so the board
 * and the movement feed can never disagree about a number.
 */

import { asPct, pctChange } from "./money";
import type { BoardRow, CompetitorRef, WeeklySnapshot } from "./types";

export function buildBoard(prev: WeeklySnapshot[], curr: WeeklySnapshot[], competitors: CompetitorRef[]): BoardRow[] {
  const prevById = new Map(prev.map((s) => [s.competitorId, s.metrics]));
  const currById = new Map(curr.map((s) => [s.competitorId, s.metrics]));

  return competitors.map((c) => {
    const now = currById.get(c.id) ?? {};
    const was = prevById.get(c.id) ?? {};
    const rateDeltaPct = now.avgRate != null && was.avgRate != null ? asPct(pctChange(was.avgRate, now.avgRate)) : 0;
    const ratingDelta = now.rating != null && was.rating != null ? Math.round((now.rating - was.rating) * 10) / 10 : 0;
    const reviewVelocity = now.reviewCount != null && was.reviewCount != null ? now.reviewCount - was.reviewCount : 0;
    const followerDeltaPct =
      now.instagramFollowers != null && was.instagramFollowers != null ? asPct(pctChange(was.instagramFollowers, now.instagramFollowers)) : 0;

    return {
      competitorId: c.id,
      name: c.name,
      url: c.url,
      ...(c.note ? { note: c.note } : {}),
      ...(now.avgRate != null ? { avgRate: now.avgRate } : {}),
      ...(now.currency ? { currency: now.currency } : {}),
      rateDeltaPct,
      ...(now.rating != null ? { rating: now.rating } : {}),
      ratingDelta,
      ...(now.reviewCount != null ? { reviewCount: now.reviewCount } : {}),
      reviewVelocity,
      ...(now.instagramFollowers != null ? { instagramFollowers: now.instagramFollowers } : {}),
      followerDeltaPct,
    }
  });
}
