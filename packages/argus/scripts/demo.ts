/**
 * Argus demo — runs a full weekly briefing on the sample tenant and prints it.
 * Without ANTHROPIC_API_KEY it runs scan-only (movements + board, no prose); with a
 * key it writes the real briefing. No network for competitor data — the demo uses
 * the ExampleObserver, so this is safe to run anywhere.
 *
 *   pnpm --filter @ds/argus demo
 *   ANTHROPIC_API_KEY=sk-… pnpm --filter @ds/argus demo
 */

import { ExampleObserver, formatMoney, getSample, runWeeklyBriefing } from "../src/index";

async function main(): Promise<void> {
  const s = getSample();
  const hasKey = Boolean(process.env.ANTHROPIC_API_KEY);

  const { briefing } = await runWeeklyBriefing({
    business: s.business,
    competitors: s.competitors,
    observer: new ExampleObserver(s.currMetrics),
    prevSnapshots: s.prevSnapshots,
    weekOf: s.weekOf,
    scanOnly: !hasKey,
  });

  console.log(`\n${briefing.business} · ${briefing.location} · week of ${briefing.weekOf}`);
  console.log(`${briefing.competitorCount} competitors · ${briefing.movements.length} movements\n`);

  if (briefing.summary) {
    console.log("BRIEFING\n" + briefing.summary + "\n");
    console.log("DO THIS NEXT");
    briefing.recommendations.forEach((r, i) => console.log(`  ${i + 1}. ${r.action}\n     ${r.rationale}`));
    console.log("");
  } else {
    console.log("(scan-only — set ANTHROPIC_API_KEY to generate the briefing prose)\n");
  }

  console.log("MOVEMENTS");
  for (const m of briefing.movements) {
    console.log(`  [${m.impact.toUpperCase().padEnd(6)}] ${m.competitorName} — ${m.headline}`);
  }

  console.log("\nBOARD");
  for (const b of briefing.board) {
    const rate = b.avgRate != null ? formatMoney(b.avgRate, b.currency) : "—";
    console.log(`  ${b.name.padEnd(26)} ${rate.padStart(6)}  ${b.rating ?? "—"}★  ${b.reviewCount ?? "—"} reviews (+${b.reviewVelocity})`);
  }
  console.log("");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
