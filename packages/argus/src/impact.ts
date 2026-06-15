/**
 * Impact scoring. Every detector produces a normalized magnitude (0..1); this is
 * the single rubric that turns magnitude into a high/medium/low band, so impact is
 * deterministic and explainable rather than a model guess. Some signals are
 * intrinsically weaker (social follower noise) and are capped below "high".
 */

import type { Impact, MovementType } from "./types";

const HIGH = 0.66;
const MEDIUM = 0.33;

/** Signals that, however large, never escalate past these ceilings on their own. */
const CEILING: Partial<Record<MovementType, Impact>> = {
  social: "medium",
  content: "medium",
  hiring: "low",
};

function rank(i: Impact): number {
  return i === "high" ? 2 : i === "medium" ? 1 : 0;
}

export function bandFromMagnitude(magnitude: number, type: MovementType): Impact {
  const raw: Impact = magnitude >= HIGH ? "high" : magnitude >= MEDIUM ? "medium" : "low";
  const ceiling = CEILING[type];
  if (ceiling && rank(raw) > rank(ceiling)) return ceiling;
  return raw;
}

/** Sort key: impact band first, then magnitude — strongest movement leads the feed. */
export function movementOrder(a: { impact: Impact; magnitude: number }, b: { impact: Impact; magnitude: number }): number {
  const byBand = rank(b.impact) - rank(a.impact);
  return byBand !== 0 ? byBand : b.magnitude - a.magnitude;
}
