/**
 * Render a daily cycle to Markdown — the AR digest a DS2 consultant (or the client)
 * reads: cash to collect, ageing, the risk-ranked chase list with the "why", and
 * the approval queue with the drafted reminders. Pure formatting.
 */

import type { DailyCycleResult } from "./engine";
import { formatMoney } from "./money";
import type { ArKpis, Currency, Customer } from "./types";

function bar(pct: number): string {
  const n = Math.round(pct * 10);
  return "█".repeat(n) + "░".repeat(10 - n);
}

function kpiBlock(k: ArKpis, currency: Currency): string[] {
  const lines: string[] = [];
  lines.push(`**${formatMoney(k.totalAr, currency)} to collect** — ${formatMoney(k.pastDueAr, currency)} overdue (${Math.round(k.pastDuePct * 100)}%)`);
  lines.push("");
  lines.push(`DSO ${k.dso} days · best possible ${k.bestPossibleDso} · ${k.averageDaysDelinquent} days delinquent · avg days-to-pay ${k.avgDaysToPay}`);
  lines.push("");
  lines.push("Ageing:");
  for (const b of ["current", "1-30", "31-60", "61-90", "90+"] as const) {
    lines.push(`\`${b.padEnd(6)}\` \`${bar(k.bucketPct[b])}\` ${formatMoney(k.buckets[b], currency)}`);
  }
  return lines;
}

export function renderReport(result: DailyCycleResult, customers: Customer[]): string {
  const nameById = new Map(customers.map((c) => [c.id, c.name]));
  const { snapshot, priority, queue } = result;
  const lines: string[] = [];

  lines.push(`# Receivables — ${snapshot.asOf}`);
  lines.push("");
  lines.push(...kpiBlock(snapshot.kpis, snapshot.currency));
  lines.push("");

  lines.push("## Chase list — who to chase first");
  lines.push("");
  lines.push("| # | Customer | Risk | Exposure | Overdue | Why |");
  lines.push("| --- | --- | --- | --: | --: | --- |");
  for (const p of priority) {
    const why = p.risk.contributions
      .filter((c) => c.contribution > 0)
      .slice(0, 2)
      .map((c) => c.explanation)
      .join("; ");
    const band = p.risk.lowConfidence ? `${p.risk.band}*` : p.risk.band;
    lines.push(
      `| ${p.rank} | ${nameById.get(p.customerId) ?? p.customerId} | ${band} (${p.risk.score}) | ${formatMoney(p.exposure, snapshot.currency)} | ${p.oldestDaysOverdue}d | ${why || "—"} |`,
    );
  }
  lines.push("");
  lines.push("_\\* low confidence — thin payment history so far._");
  lines.push("");

  lines.push("## Approval queue");
  lines.push("");
  if (queue.length === 0) {
    lines.push("_Nothing due to chase today._");
  }
  for (const item of queue) {
    const f = item.step.facts;
    lines.push(`### ${f.customerName} — ${f.invoiceNumber} (${item.step.tone}, ${f.daysOverdue}d overdue)`);
    lines.push(`${formatMoney(f.amountDue, f.currency)} · ${item.status === "needs_approval" ? "needs approval" : "drafted"}`);
    lines.push("");
    if (item.draft) {
      const flag = item.draft.factCheckPassed ? "" : ` ⚠️ ${item.draft.factCheckIssues.join("; ")}`;
      lines.push(`**${item.draft.subject}**${flag}`);
      lines.push("");
      lines.push("> " + item.draft.body.replace(/\n/g, "\n> "));
    } else {
      lines.push("_(draft generated on approval — set ANTHROPIC_API_KEY)_");
    }
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push(`_${queue.length} to review · $${result.usage.usd.toFixed(4)}_`);
  return lines.join("\n");
}
