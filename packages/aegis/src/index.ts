/**
 * Aegis — DS2's challenge-first site audit. Point it at a URL; it pulls the
 * technical reality via PageSpeed Insights (Lighthouse: Core Web Vitals, WCAG
 * accessibility, SEO, best practices) and runs Claude over it to produce a
 * prioritised, plain-language scorecard with the EU Accessibility Act exposure
 * spelled out. The lead-magnet that opens the door — never sold; run before the
 * first call.
 *
 * Primary entry point: `auditSite(url, opts) → AegisReport`.
 */

export { auditSite } from "./engine";
export type { AuditOptions } from "./engine";

export { fetchPsi, parseScan } from "./scan";
export type { FetchOptions } from "./scan";

export { synthesize } from "./synthesize";
export type { SynthesisResult } from "./synthesize";

export {
  severityFromWeight,
  ratingFromScore,
  categoryLabel,
  bySeverity,
  eaaExposureNote,
} from "./severity";

export { renderReport } from "./report";

export { getClient, costUsd, AUDIT_MODEL } from "./client";
export type { RawUsage } from "./client";

export type {
  Strategy,
  CategoryKey,
  Severity,
  VitalRating,
  CategoryScore,
  WebVital,
  AuditFinding,
  ScanResult,
  Priority,
  HeadlineRisk,
  SeverityCounts,
  AegisUsage,
  AegisReport,
} from "./types";
