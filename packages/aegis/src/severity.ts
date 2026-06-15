/**
 * Mapping helpers — turn Lighthouse's numbers into the severities, ratings and
 * labels the report speaks in. Pure and deterministic, so the scorecard's hard
 * facts are testable without a model or a network call.
 */

import type { CategoryKey, Severity, VitalRating } from "./types";

/** Lighthouse audit weights run 1 / 3 / 7 / 10; higher weight = more it matters. */
export function severityFromWeight(weight: number): Severity {
  if (weight >= 10) return "critical";
  if (weight >= 7) return "serious";
  if (weight >= 3) return "moderate";
  return "minor";
}

/** A metric audit's 0–1 score becomes a good / needs-improvement / poor rating. */
export function ratingFromScore(score: number | null | undefined): VitalRating {
  if (typeof score !== "number") return "needs-improvement";
  if (score >= 0.9) return "good";
  if (score >= 0.5) return "needs-improvement";
  return "poor";
}

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  performance: "Performance",
  accessibility: "Accessibility",
  seo: "SEO",
  "best-practices": "Best practices",
};

export function categoryLabel(key: CategoryKey): string {
  return CATEGORY_LABELS[key] ?? key;
}

const SEVERITY_RANK: Record<Severity, number> = { critical: 0, serious: 1, moderate: 2, minor: 3 };

/** Sort comparator: most severe first. */
export function bySeverity(a: { severity: Severity }, b: { severity: Severity }): number {
  return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
}

/**
 * Plain-language regulatory exposure for the accessibility score. The EU
 * Accessibility Act is in force (28 Jun 2025); Greek fines reach €100,000 and new
 * builds must comply at launch. Deterministic — the model elaborates on top.
 */
export function eaaExposureNote(accessibilityScore: number, seriousCount: number): string {
  if (accessibilityScore >= 90 && seriousCount === 0) {
    return "Low exposure — the page passes most automated accessibility checks. Note that automated scans catch roughly a third of WCAG issues; a manual pass is still worth doing before claiming conformance.";
  }
  if (accessibilityScore >= 70) {
    return "Moderate exposure — there are real accessibility gaps. Under the EU Accessibility Act (in force since June 2025) these are a legal liability, not just a UX nicety; Greek penalties reach €100,000 and new builds must comply at launch.";
  }
  return "High exposure — the page fails a significant share of automated accessibility checks. Under the EU Accessibility Act these failures are a legal liability (Greek fines up to €100,000), and the issues flagged here are the most-litigated category. This is the first thing to fix.";
}
