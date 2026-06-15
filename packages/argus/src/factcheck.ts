/**
 * The guard between the model and the client. The briefing prose is allowed to
 * restate the computed movements and board — nothing more. This checks what is
 * cheaply verifiable: the output is structurally sound, stays within length bounds
 * (a drift signal), and stays grounded — when there are movements, the summary must
 * actually reference at least one of the real competitors rather than invent filler.
 * A failing briefing is flagged (factCheckPassed=false), never silently trusted.
 */

import type { BriefingFacts, Recommendation } from "./types";

export interface FactCheckResult {
  passed: boolean;
  issues: string[];
}

const SUMMARY_MAX = 1400;

export function factCheck(summary: string, recommendations: Recommendation[], facts: BriefingFacts): FactCheckResult {
  const issues: string[] = [];

  if (!summary.trim()) issues.push("empty summary");
  if (summary.length > SUMMARY_MAX) issues.push(`summary too long (${summary.length} chars)`);

  if (recommendations.length === 0) issues.push("no recommendations");
  if (recommendations.length > 6) issues.push("too many recommendations");
  for (const r of recommendations) {
    if (!r.action?.trim() || !r.rationale?.trim()) issues.push("a recommendation is missing its action or rationale");
  }

  // Grounding: with real movements, the briefing must name a real competitor.
  if (facts.movements.length > 0) {
    const named = facts.competitorNames.some((n) => summary.includes(n));
    if (!named) issues.push("summary does not reference any tracked competitor");
  }

  return { passed: issues.length === 0, issues };
}
