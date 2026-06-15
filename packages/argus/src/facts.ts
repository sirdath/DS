/**
 * Builds the frozen fact sheet the prose layer is allowed to use. Pure: it turns
 * the computed movements + board into compact, unambiguous lines so Claude restates
 * numbers rather than deriving them. Every figure here was computed by detect.ts /
 * board.ts — the model sees no raw data and cannot reach past this.
 */

import { asPct, formatMoney } from "./money";
import type { BoardRow, BriefingFacts, BusinessRef, Movement } from "./types";

function boardLine(b: BoardRow): string {
  const parts: string[] = [];
  if (b.avgRate != null) {
    const delta = b.rateDeltaPct === 0 ? "" : ` (${b.rateDeltaPct > 0 ? "+" : ""}${b.rateDeltaPct}% wk/wk)`;
    parts.push(`rate ${formatMoney(b.avgRate, b.currency ?? "EUR")}${delta}`);
  }
  if (b.rating != null) parts.push(`${b.rating.toFixed(1)}★`);
  if (b.reviewCount != null) {
    const vel = b.reviewVelocity > 0 ? ` (+${b.reviewVelocity} this week)` : "";
    parts.push(`${b.reviewCount} reviews${vel}`);
  }
  if (b.instagramFollowers != null) {
    const delta = b.followerDeltaPct > 0 ? ` (+${b.followerDeltaPct}%)` : "";
    parts.push(`${b.instagramFollowers.toLocaleString("en")} IG${delta}`);
  }
  return parts.join(", ") || "no metrics this week";
}

export function buildBriefingFacts(business: BusinessRef, weekOf: string, movements: Movement[], board: BoardRow[]): BriefingFacts {
  return {
    business: business.name,
    location: business.location,
    weekOf,
    lang: business.lang,
    competitorNames: board.map((b) => b.name),
    movements: movements.map((m) => ({ competitor: m.competitorName, type: m.type, impact: m.impact, headline: m.headline, detail: m.detail })),
    board: board.map((b) => ({ name: b.name, line: boardLine(b) })),
  };
}

export { asPct };
