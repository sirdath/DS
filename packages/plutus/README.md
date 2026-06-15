# @ds/plutus — accounts-receivable collections engine

Plutus watches a business's unpaid invoices, works out **who to chase first**, and uses Claude **only to
draft** bilingual (Greek/English) escalating reminders that a human **approves before sending**. It's the
council's #1 product ([decision](../../docs/strategy/2026-06-15-council-decision.md),
[design](../../docs/strategy/2026-06-15-plutus-design.md)).

## The one principle
**Code owns every number and the schedule; Claude only writes prose.** Amounts, days overdue, the
statutory-interest line, which step we're on — all computed deterministically and handed to the draft as
*fixed facts*. A **fact-check guard** rejects any draft that misstates them. That's what makes the engine
auditable and fully testable without a key.

## What it does
1. **AR state + KPIs** (`ageing.ts`, pure) — nets the payment ledger against invoices, buckets the
   ageing, computes cash-to-collect, DSO / best-possible-DSO / days-delinquent / avg-days-to-pay.
2. **Risk score** (`scoring.ts`, pure) — a transparent 0–100 score (recency of late payment is the top
   signal), with the 2–3 drivers shown and thin history flagged low-confidence. Ranks the chase list by
   **risk × value × urgency** — reprioritising off "biggest invoice first" onto "most likely to stay
   unpaid × most money × most overdue".
3. **Cadence** (`cadence.ts`, pure) — the default 8-step sequence (−3, 0, +3, +7, +14, +30, +45, +60),
   rolled to the next business day, with a stable idempotency key.
4. **Draft** (`draft.ts`, the only model call) — Claude writes the reminder in the customer's language
   (Greek in the formal register) and tone, then it's fact-checked.
5. **Engine** (`engine.ts`) — `runDailyCycle` pulls records, computes everything, drafts the genuinely-new
   steps, and returns an **approval queue** + **append-only audit events**. It never sends.

## Safety (the higher bar)
- **Exactly-once** — run the daily cycle twice and each step is drafted once (dedupe via the audit log).
- **Stop-on-payment** — apply a payment and the pending step is cancelled; `dispatch` re-checks the live
  balance one last time before any send.
- **Human approval gate** — the engine only produces drafts; nothing leaves without an approval.
- **No marketing** — the fact-check guard rejects promotional content (a reminder is a service message).

## Usage
```ts
import { runDailyCycle, InMemorySource, renderReport } from "@ds/plutus";

const source = new InMemorySource({ customers, invoices, payments });
const result = await runDailyCycle({ tenantId, business, source, sequences, today: "2026-06-15" });
console.log(renderReport(result, customers)); // AR digest + chase list + approval queue
```
The whole cycle runs with **no key** in `scanOnly` mode (AR + chase list + queue); the bilingual reminder
drafts need `ANTHROPIC_API_KEY`. Source + channel are seams — real adapters (CSV/Xero/Elorus; email/Viber)
plug in app-side.

## Demo
```bash
pnpm --filter @ds/plutus demo                       # scan-only
ANTHROPIC_API_KEY=sk-… pnpm --filter @ds/plutus demo  # + drafted reminders
```

## Scripts
| Script | What it does |
| --- | --- |
| `pnpm --filter @ds/plutus demo` | Run a daily cycle on the sample tenant (Meraki Studio) |
| `pnpm --filter @ds/plutus test` | Run the test suite (no key — incl. exactly-once + stop-on-payment) |
| `pnpm --filter @ds/plutus check-types` | Typecheck |

The tests run the full cycle against the sample tenant with a stubbed Claude client and zero external
systems — the AR math, scoring, cadence, fact-check, dedupe and cancellation are all proven without a key.
