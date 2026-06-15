/**
 * Deterministic statistics — computed in code, never by the model.
 *
 * Numbers a client could check with a spreadsheet (rating average, distribution,
 * sentiment/language splits, theme counts, trend) are arithmetic, so we do the
 * arithmetic. The model is reserved for the qualitative reading on top (see
 * synthesize.ts). This keeps the dashboard's hard numbers exact and cheap.
 */

import type {
  FamaAggregate,
  Lang,
  Review,
  ReviewAnalysis,
  Sentiment,
  ThemeRollup,
} from "./types.js";

/** The deterministic slice of a FamaAggregate — everything except the model's synthesis. */
export type DeterministicStats = Pick<
  FamaAggregate,
  | "rating_average"
  | "rating_distribution"
  | "rating_trend"
  | "sentiment_breakdown"
  | "language_breakdown"
  | "themes"
>;

function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

function average(ns: number[]): number {
  if (ns.length === 0) return 0;
  return ns.reduce((a, b) => a + b, 0) / ns.length;
}

function ratingDistribution(reviews: Review[]): Record<string, number> {
  const dist: Record<string, number> = { "1": 0, "2": 0, "3": 0, "4": 0, "5": 0 };
  for (const r of reviews) {
    const star = String(Math.max(1, Math.min(5, Math.round(r.rating))));
    dist[star] = (dist[star] ?? 0) + 1;
  }
  return dist;
}

/**
 * Recent-vs-older rating trend. Reviews are sorted by date, split in half, and we
 * return (recent average − older average): positive means the business is improving,
 * negative means it's slipping. Returns 0 when there are too few to compare.
 */
function ratingTrend(reviews: Review[]): number {
  if (reviews.length < 4) return 0;
  const sorted = [...reviews].sort((a, b) => a.date.localeCompare(b.date));
  const mid = Math.floor(sorted.length / 2);
  const older = sorted.slice(0, mid).map((r) => r.rating);
  const recent = sorted.slice(mid).map((r) => r.rating);
  return round(average(recent) - average(older));
}

function countSentiment(analyses: ReviewAnalysis[]): Record<Sentiment, number> {
  const out: Record<Sentiment, number> = { positive: 0, neutral: 0, negative: 0 };
  for (const a of analyses) out[a.sentiment] += 1;
  return out;
}

function countLanguage(analyses: ReviewAnalysis[]): Record<Lang, number> {
  const out: Record<Lang, number> = { el: 0, en: 0, other: 0 };
  for (const a of analyses) out[a.language] += 1;
  return out;
}

/**
 * Roll every theme mention up by topic, tracking how often each topic is praised
 * vs criticised. Sorted by total mentions so the loudest topics lead.
 */
function rollUpThemes(analyses: ReviewAnalysis[]): ThemeRollup[] {
  const map = new Map<string, ThemeRollup>();
  for (const a of analyses) {
    for (const t of a.themes) {
      const roll = map.get(t.topic) ?? { topic: t.topic, mentions: 0, positive: 0, negative: 0 };
      roll.mentions += 1;
      if (t.polarity === "positive") roll.positive += 1;
      else if (t.polarity === "negative") roll.negative += 1;
      map.set(t.topic, roll);
    }
  }
  return [...map.values()].sort((a, b) => b.mentions - a.mentions);
}

/** Earliest and latest review dates (ISO). Empty input yields empty strings. */
export function dateRange(reviews: Review[]): { from: string; to: string } {
  if (reviews.length === 0) return { from: "", to: "" };
  const dates = reviews.map((r) => r.date).sort((a, b) => a.localeCompare(b));
  return { from: dates[0] ?? "", to: dates[dates.length - 1] ?? "" };
}

/** Compute every number the aggregate needs, with no model involvement. */
export function computeStats(reviews: Review[], analyses: ReviewAnalysis[]): DeterministicStats {
  return {
    rating_average: round(average(reviews.map((r) => r.rating))),
    rating_distribution: ratingDistribution(reviews),
    rating_trend: ratingTrend(reviews),
    sentiment_breakdown: countSentiment(analyses),
    language_breakdown: countLanguage(analyses),
    themes: rollUpThemes(analyses),
  };
}
