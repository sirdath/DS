/**
 * Plutus demo — run a daily collections cycle on the sample tenant.
 *
 *   pnpm --filter @ds/plutus demo                       # scan-only (no key)
 *   ANTHROPIC_API_KEY=sk-… pnpm --filter @ds/plutus demo  # + drafted reminders
 *
 * The AR state, KPIs, risk-ranked chase list and approval queue all compute with
 * no key. The drafted bilingual reminders need ANTHROPIC_API_KEY; without it the
 * queue shows the due steps awaiting approval.
 */

import { getSample, InMemorySource, renderReport, runDailyCycle, SAMPLE_TODAY } from "../src/index";

async function main(): Promise<void> {
  const t = getSample();
  const scanOnly = !process.env["ANTHROPIC_API_KEY"];
  if (scanOnly) {
    console.error("(no ANTHROPIC_API_KEY — scan-only: AR + chase list + queue, no drafted reminders)\n");
  }
  const source = new InMemorySource({ customers: t.customers, invoices: t.invoices, payments: t.payments });
  const result = await runDailyCycle({
    tenantId: t.tenantId,
    business: t.business,
    source,
    sequences: t.sequences,
    today: SAMPLE_TODAY,
    scanOnly,
  });
  console.log(renderReport(result, t.customers));
  if (!scanOnly) console.log(`\nCost: $${result.usage.usd.toFixed(4)}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
