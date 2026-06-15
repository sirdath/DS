/**
 * Aegis data contract — URL in, scorecard out. The deterministic technical facts
 * (scores, Core Web Vitals, failing audits) come from the PageSpeed Insights scan;
 * the qualitative layer (verdict, prioritised fixes, accessibility statement) is
 * the model's. Source-agnostic on the synthesis side: any scanner that produces a
 * ScanResult can feed it.
 */

export type Strategy = "mobile" | "desktop";

export type CategoryKey = "performance" | "accessibility" | "seo" | "best-practices";

export type Severity = "critical" | "serious" | "moderate" | "minor";

export type VitalRating = "good" | "needs-improvement" | "poor";

/** One Lighthouse category score, 0–100. */
export interface CategoryScore {
  key: CategoryKey;
  score: number; // 0–100
}

/** One Core Web Vital (lab metric). */
export interface WebVital {
  id: string; // e.g. "largest-contentful-paint"
  label: string; // "Largest Contentful Paint"
  numericValue: number; // ms or unitless (CLS)
  displayValue: string; // "3.4 s"
  rating: VitalRating;
}

/** One failing audit, mapped to a plain-language issue. */
export interface AuditFinding {
  id: string;
  category: CategoryKey;
  title: string;
  description: string;
  severity: Severity;
  displayValue?: string; // e.g. "12 elements"
}

/** The deterministic technical read of a page. */
export interface ScanResult {
  url: string;
  finalUrl: string;
  strategy: Strategy;
  scores: CategoryScore[];
  vitals: WebVital[];
  findings: AuditFinding[];
}

/** A prioritised action from the synthesis. */
export interface Priority {
  rank: number;
  area: CategoryKey | "conversion";
  action: string;
  rationale: string;
  effort: "quick" | "moderate" | "project";
}

/** A headline risk the owner should feel. */
export interface HeadlineRisk {
  area: CategoryKey | "conversion";
  risk: string;
  why_it_matters: string;
}

/** Counts of findings by severity, computed in code. */
export interface SeverityCounts {
  critical: number;
  serious: number;
  moderate: number;
  minor: number;
}

export interface AegisUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  usd: number;
}

/** The deliverable: the scorecard DS2 walks into the first call with. */
export interface AegisReport {
  generated_by: string;
  url: string;
  final_url: string;
  strategy: Strategy;
  scores: CategoryScore[];
  vitals: WebVital[];
  severity_counts: SeverityCounts;
  accessibility_issue_count: number;
  overall_verdict: string; // the challenge-first headline read
  headline_risks: HeadlineRisk[];
  priorities: Priority[]; // the few fixes that move the needle, ranked
  accessibility_statement: string; // EAA-style draft statement
  eaa_exposure_note: string; // plain-language regulatory exposure
  findings: AuditFinding[]; // the technical detail, behind the narrative
  usage: AegisUsage;
}
