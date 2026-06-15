/**
 * The guard between the model and the client. The briefing prose is allowed to
 * restate the computed movements and board — nothing more. This checks what is
 * verifiable: the output is structurally sound, stays within length bounds (a drift
 * signal), stays grounded (names a real competitor), and — the load-bearing check —
 * every notable FIGURE it cites (rate, %, rating, count) must actually appear in the
 * frozen facts. A model that invents "€200" or "23%" is caught here, not trusted.
 * A failing briefing is flagged (factCheckPassed=false), never silently shipped.
 */

import type { BriefingFacts, Recommendation } from "./types";

export interface FactCheckResult {
  passed: boolean;
  issues: string[];
}

const SUMMARY_MAX = 1400;

/** Numbers as the reader sees them, normalized (commas stripped) for comparison. */
function numberTokens(text: string): string[] {
  const matches = text.match(/\d[\d.,]*\d|\d/g) ?? [];
  return matches.map((m) => m.replace(/,/g, "").replace(/\.$/, "")).filter(Boolean);
}

/** A figure worth grounding: multi-digit or a decimal (skip bare single digits like #1, top 3). */
function isNotable(token: string): boolean {
  return token.includes(".") || token.replace(/\D/g, "").length >= 2;
}

function buildFactNumbers(facts: BriefingFacts): Set<string> {
  const parts: string[] = [facts.weekOf, `${facts.competitorNames.length}`, `${facts.movements.length}`];
  for (const m of facts.movements) parts.push(m.headline, m.detail);
  for (const b of facts.board) parts.push(b.line);
  return new Set(numberTokens(parts.join(" ")));
}

export function factCheck(summary: string, recommendations: Recommendation[], facts: BriefingFacts): FactCheckResult {
  const issues: string[] = [];

  if (!summary.trim()) issues.push("empty summary");
  if (summary.length > SUMMARY_MAX) issues.push(`summary too long (${summary.length} chars)`);

  // Recommendations: required only when there was actually something to react to.
  if (facts.movements.length > 0 && recommendations.length === 0) issues.push("no recommendations despite movements");
  if (recommendations.length > 6) issues.push("too many recommendations");
  for (const r of recommendations) {
    if (!r.action?.trim() || !r.rationale?.trim()) issues.push("a recommendation is missing its action or rationale");
  }

  // Grounding: with real movements, the briefing must name a real competitor…
  if (facts.movements.length > 0) {
    const named = facts.competitorNames.some((n) => summary.includes(n));
    if (!named) issues.push("summary does not reference any tracked competitor");
  }

  // …and every notable figure it cites must trace back to the computed facts.
  const factNumbers = buildFactNumbers(facts);
  const ungrounded = [...new Set(numberTokens(summary).filter(isNotable))].filter((t) => !factNumbers.has(t));
  if (ungrounded.length) issues.push(`summary cites figures not in the facts: ${ungrounded.join(", ")}`);

  return { passed: issues.length === 0, issues };
}
