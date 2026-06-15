# @ds/fama — Review Intelligence

Fama pulls a business's reviews and *reads* them. Not aggregation — intelligence: per-review
sentiment, theme extraction, and reply drafts (Greek **and** English), then a cross-review
synthesis that names what's working, what's quietly costing the business, and the few things
to fix next. Source-agnostic — feed it normalised `Review` objects from any platform (Google
Business Profile wiring comes later).

## How it works

Two passes, deliberately split by cost and reliability:

1. **Per-review read** — one **Sonnet 4.6** call per review, with a cached system prompt (task +
   theme taxonomy + business context stay constant across the batch, so we pay full price only on
   each review's text). Structured output guarantees a parseable result. Bounded concurrency.
2. **Synthesis** — one **Opus 4.8** call over the whole set for the judgment arithmetic can't give:
   strengths, issues, and a ranked priority list.

**Deterministic numbers are computed in code, never by the model** — rating average, distribution,
sentiment/language splits, theme counts, and the recent-vs-older trend are arithmetic, so the
report's hard numbers are exact and cheap. The model only writes the qualitative layer on top, and
mention counts are joined back from the rollups so it can't drift them.

Every call's token usage and cost is summed into the report, so each deliverable carries an exact,
auditable price tag.

## Usage

```ts
import { analyzeReviews, renderReport } from "@ds/fama";

const report = await analyzeReviews(reviews, {
  name: "Aetheria Suites",
  type: "boutique hotel",
  location: "Plaka, Athens",
});

console.log(renderReport(report)); // Markdown digest
console.log(report.aggregate.priorities); // the ranked to-do list
console.log(report.usage.usd); // what the run cost
```

`analyzeReviews(reviews, business, opts?)` returns a `FamaReport`: every per-review read, the
aggregate (deterministic stats + model synthesis), and summed usage. Options: `client` / `apiKey`
(else falls back to `ANTHROPIC_API_KEY`), `concurrency` (default 5), `onProgress`.

## Demo

Four realistic Greek+English sample sets live in `samples/` (boutique hotel, family taverna, dental
clinic, specialty cafe — 18 reviews each, with recurring themes the synthesis can find).

```bash
ANTHROPIC_API_KEY=sk-… pnpm --filter @ds/fama demo            # hotel (default)
ANTHROPIC_API_KEY=sk-… pnpm --filter @ds/fama demo taverna    # or dental / cafe
```

Writes the JSON report and Markdown digest to `out/`.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm --filter @ds/fama demo [set]` | Analyse a sample set live and print the report |
| `pnpm --filter @ds/fama test` | Run the test suite (no API key needed) |
| `pnpm --filter @ds/fama check-types` | Typecheck |

The tests cover the pure logic — stats, parsing/normalisation, cost math, the system prompt, the
report renderer, and the full engine orchestration via a stubbed client — so they run without a key.
The two Claude calls run only via the demo.
