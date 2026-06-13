# Panoptes — DS2 site-selection engine

Per-study geospatial pipeline: ingest open data for an area, score every street-level
hex on demand / competition / access, rank the client's candidate sites, emit a
self-contained interactive HTML report (the portal deliverable).

```bash
cd packages/panoptes
uv sync

# Recommend where to open a sector in an area (no candidates needed):
uv run panoptes recommend --sector gym --area athens          # whole metro (~30s)
uv run panoptes recommend --sector gym --area athens-center   # just the core
uv run panoptes sectors                  # list sectors + named areas

# Score client-supplied candidate sites from a study YAML:
uv run panoptes run study.example.yaml   # live demo: central Athens cafés
uv run pytest -q
```

## Two ways to use it

**`recommend`** — the client names a sector ("gym", "restaurant", "pharmacy")
and an area; Panoptes maps the sector to its real Overture categories and
sector-tuned weights, runs the full pipeline, and returns ranked **areas to
open** with a plain reason for each (named via reverse geocoding). No candidate
sites required — the engine discovers them.

**`run`** — the analyst writes a study YAML (area + candidate sites, optionally
just `sector: gym` to auto-fill categories/weights) and Panoptes scores the
given candidates. The original flow.

Both share one pipeline (`engine.run_study`) and emit the same HTML map +
JSON contract.

**Scale & CPU.** Resolution is auto-picked from the area: street-level (res 9,
~175 m hexes) for a neighbourhood, district-level (res 8, ~460 m) for anything
metro-scale, so `--area athens` (the whole basin, ~534 km², ~630 hexes) stays
fast. The cityseer street-network pass is the one CPU-heavy step (minutes on a
metro graph), so it is **skipped above ~450 hexes** by default in favour of the
instant POI-diversity proxy — force it with `--streets on`, disable with
`--streets off` (the JSON's `access_source` records which ran).

## How a study works

1. **Config** (`study.yaml`): area bbox, target category ids, complement ids,
   candidate sites, pillar weights, H3 resolution (9 ≈ 175 m hexes).
2. **Ingest**: Overture Maps Places pulled for the bbox straight from public S3
   GeoParquet via DuckDB — no API key, no full download, ~20 k POIs/25 s for
   central Athens. License CDLA-Permissive 2.0 (commercial use + storage OK,
   attribution kept in the report footer).
3. **Grid**: H3 hexes over the area; each POI tallied into its hex.
4. **Score** (0–100 per hex, weights configurable, inputs shown):
   - *demand* — complement/anchor density, distance-decayed over 2 hex rings
   - *competition* — rival density, inverted (saturation scores low)
   - *access* — category diversity as a liveliness proxy (until OSRM isochrones)
5. **Report**: folium dark map, score heat layer with per-hex tooltips, ranked
   candidate pins → one HTML file.

Category ids are Overture's **flat leaf ids** (`cafe`, `coffee_shop`,
`greek_restaurant`…). To discover ids for a new area/vertical, histogram the
pull (see `fetch_places` + `Counter` — 5 lines).

## Verified data roadmap (day-1 → premium)

| Layer | Source | Status |
|---|---|---|
| POIs / competitors | Overture Places (CDLA-2.0) | **wired** |
| POI cross-check | Foursquare OS Places (Apache-2.0) | planned |
| Population | ELSTAT 2021 census + GHSL 100 m grid | planned (joins the demand pillar) |
| Income | AADE annual xlsx (per-postcode tables, ~2-3 yr lag — disclose) | planned |
| Accessibility | cityseer street-network centrality (OSM/Overpass) | **wired** (proxy fallback) |
| Tourism pressure | InsideAirbnb (Athens), INSETE | planned |
| Footfall | review-velocity proxy now; BestTime / telecom mobility = client-funded premium | later |
| Transit | OASA GTFS is **CC BY-NC — not usable commercially**; use OSM stops instead | caution |

## Honest limitations (v0.1)

- Demand has no population/income yet — it's pure POI gravity.
- Competition treats clustering as bad; some categories benefit from it
  (the weight knob + analyst judgement cover this, the report shows raw counts).
- Access = street-network closeness centrality (cityseer, 800m walk) when the
  OSM fetch succeeds; falls back to the POI-diversity proxy (disclosed in the
  JSON as access_source) when offline.

Every report states these. Disclosure is the product.

## Modes & roadmap

- `--mode data` (default): purely what the data says — local factors ignored; report banner says "DATA MODE — model output only".
- `--mode advanced`: analyst local factors applied (labelled per-hex). Roadmap: per-area web intelligence — Claude + web search gathering recent articles (safety, works, openings) per candidate, returned with citations as *suggested* local factors the analyst approves.
- Every run emits `<report>.json` — the stable contract for the upcoming business interface (portal module: map UI over hexes/candidates/companions/opportunities).
