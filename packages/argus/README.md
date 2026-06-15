# @ds/argus — competitor-watch engine

Argus watches a handful of named competitors and produces **one weekly briefing**:
what changed, why it matters, and what to do about it. Same house shape as
`@ds/fama` / `@ds/plutus` — a **pure deterministic core** plus **exactly one
quarantined Claude call** that only writes prose from already-computed facts.

> Code owns every number and the change detection. The model owns the narrative.

## Pipeline

```
observe → snapshot → diff(prev, curr) → score impact → [one Claude call] → briefing
```

1. **Observe** — for each competitor, an `Observer` captures `CompetitorMetrics`
   (rate, rating, reviews, social, SEO rank, offers, hiring). Missing signals are
   simply absent.
2. **Detect** (`detect.ts`) — diffs last week vs this week. A signal is only
   compared when present in **both** weeks, so a newly-added source never reads as a
   "change". Every headline/detail number is computed here.
3. **Impact** (`impact.ts`) — a single rules rubric turns each movement's normalized
   magnitude into high/medium/low; intrinsically noisy signals (social, content,
   hiring) are capped below "high".
4. **Board** (`board.ts`) — current metrics with week-over-week deltas, from the
   same two snapshots, so the board and the feed can never disagree.
5. **Briefing** (`briefing.ts`) — one Sonnet 4.6 call writes the summary +
   recommendations from a frozen fact sheet, then `factcheck.ts` verifies the prose
   is grounded before it ships.

## The observer seam

`Observer` is the only seam to the outside world. The package ships:

- **`ExampleObserver`** — pre-supplied metrics; drives the demo and tests, no network.
- **`FirecrawlObserver`** — the one fully-defensible scraping lane: a competitor's
  **own public site** via Firecrawl v2 `POST /v2/scrape` structured `json` extraction
  → headline rate, live offers, open roles.

Deliberately **not** in `FirecrawlObserver` (each is a distinct source — wire as its
own observer behind a flag, off by default):

| Signal | Real source | Why not here |
| --- | --- | --- |
| Reviews + rating velocity | Google Places API (official) | different API; the highest-value local signal |
| Nightly OTA rates | a licensed rate-shopping vendor | scraping Booking/Expedia breaches their ToS |
| SEO rank | a SERP API (DataForSEO/SerpApi) | scraping Google from client infra is fraught |
| Social followers | Meta Business Discovery (aggregate count only) | follower lists are PII — never stored |
| On-site content/photo refresh | Firecrawl `changeTracking` format | a naïve markdown hash false-fires weekly |

This keeps v1 honest, cheap, and on the defensible side of CFAA / GDPR / DB-rights /
platform-ToS from day one.

## Use

```ts
import { runWeeklyBriefing, ExampleObserver, getSample } from "@ds/argus";

const s = getSample();
const { briefing, snapshots } = await runWeeklyBriefing({
  business: s.business,
  competitors: s.competitors,
  observer: new ExampleObserver(s.currMetrics),
  prevSnapshots: s.prevSnapshots,   // last week's snapshots
  weekOf: s.weekOf,
  // scanOnly: true,                // movements + board only, no key needed
});
// persist `snapshots` → they become next week's prevSnapshots
```

## Scripts

```bash
pnpm --filter @ds/argus check-types
pnpm --filter @ds/argus test            # no key needed
pnpm --filter @ds/argus demo            # scan-only briefing on the sample
ANTHROPIC_API_KEY=sk-… pnpm --filter @ds/argus demo   # full briefing prose
```
