/**
 * The engine — a URL in, an AegisReport out. Scan with PageSpeed Insights, compute
 * the deterministic scorecard (scores, vitals, severity counts, EAA exposure) in
 * code, then run the synthesis for the narrative. Scan-only mode skips the model,
 * so the technical scorecard is available even without a key.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { AUDIT_MODEL } from "./client";
import { fetchPsi, parseScan } from "./scan";
import { eaaExposureNote } from "./severity";
import { synthesize } from "./synthesize";
import type {
  AegisReport,
  AegisUsage,
  CategoryKey,
  ScanResult,
  SeverityCounts,
  Strategy,
} from "./types";

export interface AuditOptions {
  client?: Anthropic;
  apiKey?: string; // Anthropic key (synthesis)
  pagespeedApiKey?: string; // optional PSI key
  strategy?: Strategy; // default "mobile"
  scanOnly?: boolean; // skip the model — technical scorecard only
  psi?: unknown; // pre-fetched PSI JSON (testing / preview); bypasses the network
  signal?: AbortSignal;
}

function countSeverity(scan: ScanResult): SeverityCounts {
  const counts: SeverityCounts = { critical: 0, serious: 0, moderate: 0, minor: 0 };
  for (const f of scan.findings) counts[f.severity] += 1;
  return counts;
}

function scoreFor(scan: ScanResult, key: CategoryKey): number {
  return scan.scores.find((s) => s.key === key)?.score ?? 0;
}

function emptyUsage(): AegisUsage {
  return { input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_write_tokens: 0, usd: 0 };
}

/** Audit one URL and return the full scorecard report. */
export async function auditSite(url: string, opts: AuditOptions = {}): Promise<AegisReport> {
  const strategy = opts.strategy ?? "mobile";
  const raw =
    opts.psi ?? (await fetchPsi(url, strategy, { apiKey: opts.pagespeedApiKey, signal: opts.signal }));
  const scan = parseScan(raw, url, strategy);

  const severity_counts = countSeverity(scan);
  const accessibilityFindings = scan.findings.filter((f) => f.category === "accessibility");
  const a11ySerious = accessibilityFindings.filter(
    (f) => f.severity === "critical" || f.severity === "serious",
  ).length;
  const eaa_exposure_note = eaaExposureNote(scoreFor(scan, "accessibility"), a11ySerious);

  const synth = opts.scanOnly ? null : await synthesize(scan, { client: opts.client, apiKey: opts.apiKey });

  const usage: AegisUsage = synth
    ? {
        input_tokens: synth.usage.input_tokens ?? 0,
        output_tokens: synth.usage.output_tokens ?? 0,
        cache_read_tokens: synth.usage.cache_read_input_tokens ?? 0,
        cache_write_tokens: synth.usage.cache_creation_input_tokens ?? 0,
        usd: synth.usd,
      }
    : emptyUsage();

  return {
    generated_by: synth ? `Aegis (${AUDIT_MODEL})` : "Aegis (scan only)",
    url,
    final_url: scan.finalUrl,
    strategy,
    scores: scan.scores,
    vitals: scan.vitals,
    severity_counts,
    accessibility_issue_count: accessibilityFindings.length,
    overall_verdict: synth?.overall_verdict ?? deterministicVerdict(scan),
    headline_risks: synth?.headline_risks ?? [],
    priorities: synth?.priorities ?? [],
    accessibility_statement: synth?.accessibility_statement ?? "",
    eaa_exposure_note,
    findings: scan.findings,
    usage,
  };
}

/** A plain factual line for scan-only mode (no model). */
function deterministicVerdict(scan: ScanResult): string {
  const parts = scan.scores.map((s) => `${s.key} ${s.score}`).join(", ");
  return `Scan complete (${scan.strategy}): ${parts}. Set ANTHROPIC_API_KEY for the full narrated read.`;
}
