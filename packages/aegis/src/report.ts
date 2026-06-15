/**
 * Render an AegisReport as a Markdown scorecard — the deliverable DS2 walks into
 * the first call with. Pure formatting: no network, no model.
 */

import { categoryLabel } from "./severity";
import type { AegisReport, AuditFinding, CategoryScore } from "./types";

function scoreBar(score: number): string {
  const filled = Math.round((score / 100) * 10);
  return "█".repeat(filled) + "░".repeat(10 - filled);
}

function scoreLine(s: CategoryScore): string {
  return `\`${scoreBar(s.score)}\` **${s.score}** — ${categoryLabel(s.key)}`;
}

function findingsTable(findings: AuditFinding[], limit = 12): string {
  const rows = findings.slice(0, limit).map((f) => {
    const detail = f.displayValue ? ` — ${f.displayValue}` : "";
    return `| ${f.severity} | ${categoryLabel(f.category)} | ${f.title}${detail} |`;
  });
  return ["| Severity | Area | Issue |", "| --- | --- | --- |", ...rows].join("\n");
}

const EFFORT_LABEL: Record<string, string> = { quick: "quick", moderate: "moderate", project: "project" };

export function renderReport(report: AegisReport): string {
  const lines: string[] = [];
  lines.push(`# Site audit — ${report.final_url}`);
  lines.push("");
  lines.push(`${report.strategy} · ${report.generated_by}`);
  lines.push("");

  lines.push("## Scores");
  lines.push("");
  for (const s of report.scores) lines.push(scoreLine(s));
  lines.push("");

  if (report.vitals.length > 0) {
    lines.push("## Core Web Vitals");
    lines.push("");
    for (const v of report.vitals) {
      lines.push(`- **${v.label}** — ${v.displayValue || "n/a"} (${v.rating.replace("-", " ")})`);
    }
    lines.push("");
  }

  if (report.overall_verdict) {
    lines.push("## The read");
    lines.push("");
    lines.push(report.overall_verdict);
    lines.push("");
  }

  if (report.headline_risks.length > 0) {
    lines.push("## What this is costing you");
    lines.push("");
    for (const r of report.headline_risks) {
      lines.push(`- **${r.risk}** — ${r.why_it_matters}`);
    }
    lines.push("");
  }

  if (report.priorities.length > 0) {
    lines.push("## Fix these first");
    lines.push("");
    for (const p of report.priorities) {
      lines.push(`${p.rank}. **${p.action}** _(${EFFORT_LABEL[p.effort] ?? p.effort})_ — ${p.rationale}`);
    }
    lines.push("");
  }

  lines.push("## Accessibility & the EU Accessibility Act");
  lines.push("");
  lines.push(
    `${report.accessibility_issue_count} accessibility issue${report.accessibility_issue_count === 1 ? "" : "s"} found. ${report.eaa_exposure_note}`,
  );
  lines.push("");
  if (report.accessibility_statement) {
    lines.push("**Draft accessibility statement** (review before publishing):");
    lines.push("");
    lines.push("> " + report.accessibility_statement.replace(/\n/g, "\n> "));
    lines.push("");
  }

  if (report.findings.length > 0) {
    lines.push("## Technical findings");
    lines.push("");
    lines.push(findingsTable(report.findings));
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  const c = report.severity_counts;
  lines.push(
    `_${c.critical} critical · ${c.serious} serious · ${c.moderate} moderate · ${c.minor} minor · $${report.usage.usd.toFixed(4)}_`,
  );

  return lines.join("\n");
}
