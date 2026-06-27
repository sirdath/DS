/**
 * Cheap, pure guard between the model and storage (mirrors @ds/plutus factcheck) —
 * no Claude call. Confirms the overview names the business; clamps confidence to
 * [0,1]; and when the research consulted ZERO sources, caps confidence at 0.4 and
 * records the gap (a brief with no external evidence must read as preliminary).
 * The route stores the returned confidence/gaps; the UI shows the "Preliminary"
 * banner when confidence < 0.6.
 */

import type { BriefSource, CompanyBrief, OutreachFacts } from "./types";

export interface FactCheckResult {
  confidence: number;
  gaps: string[];
  issues: string[];
}

export function factCheckBrief(brief: CompanyBrief, facts: OutreachFacts, sources: BriefSource[]): FactCheckResult {
  const gaps = [...(brief.gaps ?? [])];
  const issues: string[] = [];

  let confidence = typeof brief.confidence === "number" && Number.isFinite(brief.confidence) ? brief.confidence : 0.5;
  confidence = Math.max(0, Math.min(1, confidence));

  const name = facts.businessName.trim();
  if (name && !brief.overview.toLowerCase().includes(name.toLowerCase())) {
    issues.push("overview does not name the business");
    const gap = "overview did not reference the business by name";
    if (!gaps.includes(gap)) gaps.push(gap);
  }

  if (sources.length === 0) {
    confidence = Math.min(confidence, 0.4);
    issues.push("no external sources consulted");
    const gap = "no external sources consulted";
    if (!gaps.includes(gap)) gaps.push(gap);
  }

  return { confidence, gaps, issues };
}
