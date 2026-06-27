/**
 * Render a CompanyBrief + its sources to Markdown — stored in outreach_briefs.brief_md
 * for reading / export / copy-to-clipboard (the UI renders the structured JSON
 * directly). Mirrors @ds/aegis report.ts: pure formatting, deterministic.
 */

import type { BriefSource, CompanyBrief } from "./types";

export function renderBriefMarkdown(brief: CompanyBrief, sources: BriefSource[]): string {
  const lines: string[] = [];

  lines.push("# Outreach brief");
  if (brief.confidence < 0.6) {
    lines.push(`> ⚠️ Preliminary — confidence ${brief.confidence.toFixed(2)}. Treat as a starting point; verify before quoting.`);
  }
  lines.push("", `**Confidence:** ${brief.confidence.toFixed(2)} (${Math.round(brief.confidence * 100)}%)`, "");

  lines.push("## Overview", brief.overview, "");
  lines.push("## What they do", brief.whatTheyDo, "");
  lines.push("## Ideal customers", brief.idealCustomers, "");

  lines.push("## Pain points");
  if (brief.painPoints.length === 0) lines.push("_None identified._");
  for (const p of brief.painPoints) lines.push(`- **[${p.severity}] ${p.title}** — ${p.detail}`);
  lines.push("");

  lines.push("## Market environment", brief.marketEnvironment, "");
  if (brief.competitors.length) {
    lines.push("## Competitors");
    for (const c of brief.competitors) lines.push(`- ${c}`);
    lines.push("");
  }
  if (brief.recentSignals.length) {
    lines.push("## Recent signals");
    for (const s of brief.recentSignals) lines.push(`- ${s}`);
    lines.push("");
  }

  lines.push("## Outreach angle", brief.outreachAngle, "");

  lines.push("## Talking points");
  for (const t of brief.talkingPoints) lines.push(`- ${t}`);
  lines.push("");

  if (brief.emailSeeds.length) {
    lines.push("## Email seeds");
    for (const e of brief.emailSeeds) lines.push(`- ${e}`);
    lines.push("");
  }
  if (brief.gaps.length) {
    lines.push("## Gaps");
    for (const g of brief.gaps) lines.push(`- ${g}`);
    lines.push("");
  }

  lines.push("## Sources");
  if (sources.length === 0) lines.push("_No external sources consulted._");
  for (const s of sources) lines.push(`- [${s.title}](${s.url})`);

  return lines.join("\n");
}
