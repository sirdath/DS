/**
 * Render a FamaReport as a Markdown digest — the human-facing deliverable an owner
 * (or a DS consultant) reads. Pure formatting: no model calls, no side effects.
 */

import { topicLabel } from "./taxonomy";
import type { FamaReport, ReviewAnalysis, ThemeRollup } from "./types";

const STARS = ["5", "4", "3", "2", "1"] as const;

function trendPhrase(trend: number): string {
  if (trend > 0.1) return `improving (+${trend.toFixed(2)} vs older reviews)`;
  if (trend < -0.1) return `slipping (${trend.toFixed(2)} vs older reviews)`;
  return "holding steady";
}

function distributionBar(distribution: Record<string, number>, total: number): string[] {
  return STARS.map((star) => {
    const count = distribution[star] ?? 0;
    const width = total > 0 ? Math.round((count / total) * 20) : 0;
    const bar = "█".repeat(width) || "·";
    return `\`${star}★\` ${bar} ${count}`;
  });
}

function themesTable(themes: ThemeRollup[], limit = 8): string {
  const rows = themes.slice(0, limit).map((t) => {
    const net = t.positive - t.negative;
    const lean = net > 0 ? `+${net}` : String(net);
    return `| ${topicLabel(t.topic)} | ${t.mentions} | ${t.positive} | ${t.negative} | ${lean} |`;
  });
  return ["| Theme | Mentions | Positive | Negative | Net |", "| --- | --: | --: | --: | --: |", ...rows].join("\n");
}

function replyQueue(analyses: ReviewAnalysis[], limit = 5): string[] {
  const high = analyses.filter((a) => a.reply_priority === "high").slice(0, limit);
  if (high.length === 0) return ["_No urgent replies — nothing negative is waiting on a response._"];
  return high.map((a) => `- **${a.summary}**\n  > ${a.reply_draft}`);
}

/** Render the full report to Markdown. */
export function renderReport(report: FamaReport): string {
  const { business, aggregate: agg, usage } = report;
  const total = report.review_count;
  const sentiment = agg.sentiment_breakdown;
  const lang = agg.language_breakdown;

  const lines: string[] = [];
  lines.push(`# ${business.name} — review intelligence`);
  lines.push("");
  lines.push(
    `${business.type}${business.location ? `, ${business.location}` : ""} · ${total} reviews · ${report.date_range.from} → ${report.date_range.to}`,
  );
  lines.push("");
  lines.push(`**${agg.rating_average.toFixed(2)}★ average** — ${trendPhrase(agg.rating_trend)}`);
  lines.push("");
  lines.push(agg.overall_summary);
  lines.push("");

  lines.push("## At a glance");
  lines.push("");
  lines.push(...distributionBar(agg.rating_distribution, total));
  lines.push("");
  lines.push(
    `Sentiment — ${sentiment.positive} positive · ${sentiment.neutral} neutral · ${sentiment.negative} negative`,
  );
  lines.push(`Language — ${lang.el} Greek · ${lang.en} English${lang.other ? ` · ${lang.other} other` : ""}`);
  lines.push("");

  if (agg.strengths.length > 0) {
    lines.push("## What's working");
    lines.push("");
    for (const s of agg.strengths) {
      lines.push(`- **${topicLabel(s.theme)}** (${s.mentions} mentions) — "${s.example}"`);
    }
    lines.push("");
  }

  if (agg.issues.length > 0) {
    lines.push("## What's costing you");
    lines.push("");
    for (const issue of agg.issues) {
      lines.push(`- **${topicLabel(issue.theme)}** (${issue.mentions} mentions)`);
      lines.push(`  - Impact: ${issue.impact}`);
      lines.push(`  - Fix: ${issue.recommendation}`);
    }
    lines.push("");
  }

  if (agg.priorities.length > 0) {
    lines.push("## Do this next");
    lines.push("");
    for (const p of agg.priorities) {
      lines.push(`${p.rank}. **${p.action}** — ${p.rationale}`);
    }
    lines.push("");
  }

  lines.push("## Themes");
  lines.push("");
  lines.push(themesTable(agg.themes));
  lines.push("");

  lines.push("## Reply queue");
  lines.push("");
  lines.push(...replyQueue(report.analyses));
  lines.push("");

  lines.push("---");
  lines.push("");
  lines.push(
    `_${report.generated_by} · ${usage.input_tokens.toLocaleString()} in / ${usage.output_tokens.toLocaleString()} out tokens · $${usage.usd.toFixed(4)}_`,
  );

  return lines.join("\n");
}
