/**
 * The scanner. `fetchPsi` calls Google's PageSpeed Insights API (which runs
 * Lighthouse — including axe-core-powered accessibility — on Google's infra, so
 * we need no headless browser). `parseScan` is pure: it turns the raw PSI JSON
 * into a normalised ScanResult, so the whole parsing path tests against a fixture
 * with no network and no key.
 */

import { ratingFromScore, severityFromWeight, bySeverity } from "./severity";
import type { AuditFinding, CategoryKey, ScanResult, Strategy, WebVital } from "./types";

const CATEGORY_KEYS: CategoryKey[] = ["performance", "accessibility", "seo", "best-practices"];

// Lab metric audits surfaced as Core Web Vitals (excluded from the findings list).
const VITALS: Array<{ id: string; label: string }> = [
  { id: "largest-contentful-paint", label: "Largest Contentful Paint" },
  { id: "cumulative-layout-shift", label: "Cumulative Layout Shift" },
  { id: "total-blocking-time", label: "Total Blocking Time" },
  { id: "first-contentful-paint", label: "First Contentful Paint" },
  { id: "speed-index", label: "Speed Index" },
];
const VITAL_IDS = new Set(VITALS.map((v) => v.id));
const SHOWN_MODES = new Set(["binary", "numeric", "metricSavings"]);

interface PsiAuditRef {
  id: string;
  weight?: number;
}
interface PsiCategory {
  score?: number | null;
  auditRefs?: PsiAuditRef[];
}
interface PsiAudit {
  title?: string;
  description?: string;
  score?: number | null;
  scoreDisplayMode?: string;
  displayValue?: string;
  numericValue?: number;
}
interface PsiResponse {
  id?: string;
  lighthouseResult?: {
    finalUrl?: string;
    requestedUrl?: string;
    categories?: Partial<Record<CategoryKey, PsiCategory>>;
    audits?: Record<string, PsiAudit | undefined>;
  };
}

const PSI_ENDPOINT = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";

export interface FetchOptions {
  apiKey?: string;
  signal?: AbortSignal;
}

/** Call the PageSpeed Insights API for a URL + strategy. Returns the raw JSON. */
export async function fetchPsi(url: string, strategy: Strategy, opts: FetchOptions = {}): Promise<unknown> {
  const params = new URLSearchParams({ url, strategy });
  for (const c of ["PERFORMANCE", "ACCESSIBILITY", "SEO", "BEST_PRACTICES"]) params.append("category", c);
  const key = opts.apiKey ?? process.env["PAGESPEED_API_KEY"];
  if (key) params.set("key", key);

  const res = await fetch(`${PSI_ENDPOINT}?${params.toString()}`, { signal: opts.signal });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`PageSpeed Insights failed (${res.status})${detail ? `: ${detail.slice(0, 200)}` : ""}`);
  }
  return res.json();
}

function scoreToPct(score: number | null | undefined): number {
  return typeof score === "number" ? Math.round(score * 100) : 0;
}

/** Turn raw PSI JSON into a normalised ScanResult. Pure — no network. */
export function parseScan(raw: unknown, url: string, strategy: Strategy): ScanResult {
  const psi = raw as PsiResponse;
  const lr = psi.lighthouseResult;
  if (!lr || typeof lr !== "object") {
    throw new Error("PageSpeed response has no lighthouseResult");
  }
  const audits = lr.audits ?? {};
  const categories = lr.categories ?? {};

  const scores = CATEGORY_KEYS.filter((k) => categories[k] !== undefined).map((k) => ({
    key: k,
    score: scoreToPct(categories[k]?.score),
  }));

  const vitals: WebVital[] = [];
  for (const v of VITALS) {
    const audit = audits[v.id];
    if (!audit) continue;
    vitals.push({
      id: v.id,
      label: v.label,
      numericValue: audit.numericValue ?? 0,
      displayValue: audit.displayValue ?? "",
      rating: ratingFromScore(audit.score),
    });
  }

  const seen = new Set<string>();
  const findings: AuditFinding[] = [];
  for (const cat of CATEGORY_KEYS) {
    const refs = categories[cat]?.auditRefs ?? [];
    for (const ref of refs) {
      if (seen.has(ref.id) || VITAL_IDS.has(ref.id)) continue;
      const audit = audits[ref.id];
      if (!audit) continue;
      const mode = audit.scoreDisplayMode ?? "";
      if (!SHOWN_MODES.has(mode)) continue;
      if (typeof audit.score !== "number" || audit.score >= 1) continue; // passing or N/A
      seen.add(ref.id);
      findings.push({
        id: ref.id,
        category: cat,
        title: audit.title ?? ref.id,
        description: audit.description ?? "",
        severity: severityFromWeight(ref.weight ?? 0),
        ...(audit.displayValue ? { displayValue: audit.displayValue } : {}),
      });
    }
  }
  findings.sort(bySeverity);

  return {
    url,
    finalUrl: lr.finalUrl ?? lr.requestedUrl ?? url,
    strategy,
    scores,
    vitals,
    findings,
  };
}
