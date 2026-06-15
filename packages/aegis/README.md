# @ds/aegis — site audit (the door-opener)

Point Aegis at a URL. It pulls the technical reality — Core Web Vitals, WCAG accessibility, SEO, best
practices — via Google's **PageSpeed Insights API** (which runs Lighthouse, including axe-core-powered
accessibility, on Google's infra, so there's no headless browser to run), and runs Claude over the
result to produce a **prioritised, plain-language scorecard** with the EU Accessibility Act exposure
spelled out.

This is DS2's challenge-first **lead-magnet**, not a product: run it on a prospect *before* the first
call and walk in with "your site has N WCAG failures and €X of exposure, here are the three fixes that
matter." Charge for the fix, never the scan.

## How it works

1. **Scan** (`scan.ts`) — one HTTPS call to PageSpeed Insights for the URL + strategy; `parseScan`
   normalises the raw Lighthouse JSON into category scores (0–100), Core Web Vitals, and the failing
   audits, each mapped to a severity from its Lighthouse weight. Pure parser — no key, no browser.
2. **Scorecard** (`engine.ts`) — deterministic counts, accessibility-issue tally, and EU-Accessibility-Act
   exposure, computed in code.
3. **Synthesis** (`synthesize.ts`) — one Sonnet pass turns the scan into the read an owner acts on: a
   challenge-first verdict ("this creates risk because…"), the few prioritised fixes with effort
   estimates, and a **draft accessibility statement**. The numbers stay in code; the model writes the prose.

## Usage

```ts
import { auditSite, renderReport } from "@ds/aegis";

const report = await auditSite("a-clients-site.com", { strategy: "mobile" });
console.log(renderReport(report)); // the Markdown scorecard
console.log(report.priorities); // the ranked fixes
console.log(report.eaa_exposure_note); // the regulatory exposure
```

`auditSite(url, opts)` returns an `AegisReport`. Options: `strategy` (`mobile`/`desktop`), `apiKey`
(Anthropic; else `ANTHROPIC_API_KEY`), `pagespeedApiKey` (optional, else `PAGESPEED_API_KEY`),
`scanOnly` (skip the model — technical scorecard only), `psi` (inject pre-fetched PSI JSON).

## Demo

```bash
pnpm --filter @ds/aegis demo example.com                  # scan-only (no key needed)
ANTHROPIC_API_KEY=sk-… pnpm --filter @ds/aegis demo example.com desktop
```

Writes the JSON report + Markdown scorecard to `out/`.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm --filter @ds/aegis demo <url> [mobile\|desktop]` | Audit a URL and print the scorecard |
| `pnpm --filter @ds/aegis test` | Run the test suite (no key, no network) |
| `pnpm --filter @ds/aegis check-types` | Typecheck |

Tests run the whole parse → scorecard → synthesis path against a PageSpeed Insights fixture with a
stubbed Claude client — no network, no key. The live PSI fetch + Sonnet synthesis run only via the demo
(and the `/workspace/aegis` surface).

## Notes

- PageSpeed Insights works without a key (rate-limited); set `PAGESPEED_API_KEY` for reliable quota.
- Automated scans catch ~a third of WCAG issues — the report says so. Aegis surfaces the machine-detectable
  failures and the regulatory exposure; a manual pass is still needed before claiming conformance.
