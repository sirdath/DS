# DS2 Lead Finder

Finds SMEs that need our help and exports a prioritised Excel of leads. For each
business it works out **whether they have a website**, and if they do, **how
outdated it is** — then scores and tags it so we can pick who to approach first.

Built for DS2's market: **Greece first, Cyprus second.** Greek SMEs are full of
businesses with no site or a decade-old one — exactly our build/redesign work.

## What it does

1. **Discovers businesses** in an area, by industry, from:
   - **OpenStreetMap** (default — free, no key, ToS-friendly). Returns businesses
     *with and without* a `website` tag. The ones without are prime build leads.
   - **Google Places** (optional — set `GOOGLE_PLACES_API_KEY`). Richer data
     (ratings, review counts, reliable websites) and *far* better coverage of
     service industries (transport, cleaners, movers…) via keyword text search.
2. **Analyses each website** (polite: robots.txt, timeouts, rate-limited) for
   concrete signs it's dated, and **fingerprints the tech stack**:
   - no HTTPS · not mobile-friendly (no responsive viewport) · table-based layout
   - obsolete HTML (`<font>`/`<center>`/Flash) · legacy doctype/quirks mode
   - **old libraries**: jQuery 1/2, Bootstrap 2/3, MooTools, Prototype, AngularJS 1,
     ASP.NET WebForms, `ga.js`, end-of-life PHP, old WordPress…
   - stale copyright year · `Last-Modified` age · **domain registration date** (RDAP)
   - slow response · tiny/placeholder pages · DIY builders (Wix/Squarespace)
3. **Scores & tags** each lead (0–100), assigns **High/Medium/Low** priority, and
   writes a one-line **pitch angle** ("Not mobile-friendly — losing phone visitors").
4. **Exports a formatted .xlsx** with sheets: **Summary · All leads · No website ·
   Ugly sites**, colour-coded by priority/ugliness, with clickable site + map links.

## Usage

```bash
cd tools/lead-finder
npm install            # first time only

# Athens commercial suburbs, default broad SME categories:
npm run find -- --area athens

# Target specific high-need industries, ~8 best companies each:
npm run find -- --area "Thessaloniki, Greece" \
  --categories "lawyer,accountant,dentist,plumber,electrician,car_repair,realestate,cleaner,mover" \
  --per-industry 8

# Sweep many cities at once (preset), bigger run:
npm run find -- --area greece-major --radius 5000 --limit 400
```

Output lands in `out/ds2-leads-<area>-<date>.xlsx`.

### Options

| Flag | Default | Notes |
| --- | --- | --- |
| `--area` | `athens` | Preset (`athens`, `greece-major`, `cyprus`, `greece-cyprus`) or place(s) split by `;` |
| `--categories` | broad SME set | Comma-separated. For Google, any keyword works ("transport company") |
| `--radius` | `4000` | Metres around each area centre |
| `--limit` | `200` | Max websites analysed (no-website leads aren't capped) |
| `--per-industry` | `0` (all) | Keep only the top-N leads per industry |
| `--concurrency` | `6` | Parallel site fetches |
| `--timeout` | `12000` | Per-site timeout (ms) |
| `--min-score` | `0` | Drop leads below this lead score |
| `--no-domain-age` | off | Skip RDAP domain-creation lookups (faster) |
| `--no-robots` | off | Skip robots.txt check (default: respect it) |
| `--no-google` | off | Ignore `GOOGLE_PLACES_API_KEY` |
| `--out` | auto | Output path |

### Google Places (recommended for service industries)

```bash
# PowerShell
$env:GOOGLE_PLACES_API_KEY = "AIza..."; npm run find -- --area athens --categories "moving company,cleaning service,transport"
```

OSM under-tags trades/logistics; Google's keyword text search finds them well.

## Categories

Known OSM presets include: `restaurant, cafe, bar, hotel, salon, dentist, doctor,
vet, pharmacy, lawyer, accountant, notary, insurance, architect, realestate,
plumber, electrician, builder, carpenter, painter, hvac, roofer, locksmith,
gardener, cleaner, car_repair, mover, transport, retail, florist, jewellery,
travel`. Unknown names fall back to an OSM `shop=<name>` lookup; for Google they're
used verbatim as search keywords.

## How the score works

- **No website** → ~72+ base (strongest build lead).
- **Broken/unreachable site** → ~74 (urgent rebuild).
- **Working site** → driven by the **ugliness** score (sum of weighted signals,
  capped at 100), plus a small boost for established businesses (more reviews / a phone).
- Priority: **High ≥ 65 · Medium ≥ 40 · Low** otherwise.

Every point traces back to a concrete, explainable signal you can show a prospect.

## Notes on conduct (important)

- Discovery uses **official/open APIs** (OpenStreetMap, Google Places) — we do **not**
  scrape Google Maps' UI (against their ToS).
- Website analysis fetches **only the public homepage**, **respects `robots.txt`**,
  rate-limits, sets an honest `User-Agent`, and never logs in or submits forms.
- This is market research to offer a legitimate service. Use the contact details
  for genuine, relevant outreach — not spam.

## Architecture

```
src/
  index.ts          orchestrator: discover → dedupe → analyse → score → export
  config.ts         CLI flag parsing
  presets.ts        Greek/Cyprus area presets + default categories
  sources/
    geocode.ts      Nominatim (area → lat/lon)
    overpass.ts     OpenStreetMap discovery (free)
    google-places.ts  Google Places discovery (optional)
  fetch-site.ts     polite homepage fetch (robots, timeout, size cap, timing)
  analyze.ts        ugliness heuristics + signals
  fingerprint.ts    tech-stack detection (legacy library flags)
  domain-age.ts     RDAP domain registration date
  score.ts          lead score + priority + pitch angle
  excel.ts          formatted multi-sheet workbook
```
