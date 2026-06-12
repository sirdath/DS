"""Panoptes CLI: `panoptes run study.yaml [-o report.html]`."""

from __future__ import annotations

import argparse
import dataclasses
import json
import sys
import time
from pathlib import Path

from panoptes import analysis, grid, report, score, zones
from panoptes.config import StudyConfig
from panoptes.ingest import income, overture, population


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="panoptes", description="DS2 site-selection engine")
    sub = parser.add_subparsers(dest="command", required=True)
    run = sub.add_parser("run", help="run a study from a YAML config")
    run.add_argument("config", help="path to study YAML")
    run.add_argument("-o", "--out", default=None, help="output HTML path")
    run.add_argument(
        "--mode", choices=["data", "advanced"], default="data",
        help="data = purely what the data says; advanced = analyst local factors applied (web intel: roadmap)",
    )
    args = parser.parse_args(argv)

    cfg = StudyConfig.from_yaml(args.config)
    out_path = args.out or f"out/{cfg.name.lower().replace(' ', '-')}.html"

    t0 = time.time()
    print(f"[panoptes] study: {cfg.name}")
    print(f"[panoptes] pulling Overture places ({cfg.overture_release}) …")
    places = overture.fetch_places(cfg.area, cfg.overture_release)
    print(f"[panoptes] {len(places)} places in area · {time.time() - t0:.1f}s")

    cells = grid.area_cells(cfg.area, cfg.h3_resolution)
    grid.assign_places(cells, places, cfg.h3_resolution, cfg.target_categories, cfg.complement_categories)
    print(f"[panoptes] grid: {len(cells)} hexes at res {cfg.h3_resolution}")
    covered = population.assign_population(cells)
    print(f"[panoptes] census population joined: {covered}/{len(cells)} hexes in populated cells")
    matched = income.assign_income(cells)
    idx = sorted({round(c.income_index, 4) for c in cells.values()})
    print(f"[panoptes] income index joined: {matched}/{len(cells)} direct · range {idx[0]}–{idx[-1]}")

    mi, mp = analysis.morans_i(cells)
    verdict = "location structures this category" if (mi > 0.1 and mp < 0.05) else "WEAK clustering — site choice may matter less for this category"
    print(f"[panoptes] spatial clustering gate: Moran's I {mi} (p={mp}) — {verdict}")

    cell_scores = score.score_cells(cells, cfg.weights)
    if args.mode == "advanced" and cfg.local_factors:
        score.apply_local_factors(cell_scores, cfg.local_factors)
        for f in cfg.local_factors:
            n_hit = sum(1 for s in cell_scores.values() if any(a[0] == f.name for a in s.adjustments))
            print(f"[panoptes] local factor (analyst judgement): {f.name} {f.adjustment:+.0f} pts over {n_hit} hexes — {f.note}")
    ranked = score.score_candidates(cfg.candidates, cell_scores, cfg.h3_resolution)
    companions = analysis.colocation_profile(places, cfg.target_categories, cfg.h3_resolution)
    analogs = analysis.analog_scores(places, cfg.target_categories, cfg.h3_resolution)
    opps = analysis.opportunity_map(cell_scores)
    zr = zones.zone_map(places, cfg.h3_resolution)
    if zr.labels:
        print("[panoptes] functional zones (PPMI+SVD type embeddings, k-means):")
        for z, label in sorted(zr.labels.items(), key=lambda t: -zr.sizes.get(t[0], 0)):
            print(f"  zone {z} ({zr.sizes.get(z, 0)} hexes): {label}")
    ws = [h for h, o in opps.items() if o.white_space]
    if companions:
        print("[panoptes] the target's best company (lift vs chance):")
        for c in companions[:6]:
            print(f"  {c.lift:5.2f}x  {c.category}  (in {c.support} neighbourhoods)")
    print(f"[panoptes] white-space hexes (demand>70th pct, gap top decile): {len(ws)}")

    missing = {c.name for c in cfg.candidates} - {r.name for r in ranked}
    for name in sorted(missing):
        print(f"[panoptes] WARNING: candidate '{name}' is outside the study area — skipped")

    top = sorted(cell_scores.values(), key=lambda s: s.total, reverse=True)[:5]
    print("[panoptes] top hexes:")
    for s in top:
        print(f"  {s.total:5.1f}  ({s.lat:.4f}, {s.lon:.4f})  demand={s.demand} comp={s.competition} access={s.access}")

    if ranked:
        print("[panoptes] candidates, best first:")
        for i, r in enumerate(ranked, 1):
            import h3 as _h3
            twin = analogs.get(_h3.latlng_to_cell(r.lat, r.lon, cfg.h3_resolution), 0.0)
            print(f"  #{i} {r.name}: {r.score.total} · resembles thriving areas {twin}/100")

    out = report.render(cfg, cell_scores, ranked, out_path, opportunities=opps, mode=args.mode)

    # machine-readable artifact — the contract the business interface consumes
    payload = {
        "study": cfg.name,
        "mode": args.mode,
        "generated_by": "panoptes v0.2",
        "hexes": [dataclasses.asdict(s) for s in cell_scores.values()],
        "candidates": [
            {"name": r.name, "lat": r.lat, "lon": r.lon, "score": dataclasses.asdict(r.score)}
            for r in ranked
        ],
        "companions": [dataclasses.asdict(c) for c in companions],
        "opportunities": [dataclasses.asdict(o) for o in opps.values()],
        "local_factors_applied": args.mode == "advanced" and bool(cfg.local_factors),
        "zones": {
            "labels": {str(z): lbl for z, lbl in zr.labels.items()},
            "assignments": [{"h3_id": h, "zone": z} for h, z in zr.assignments.items()],
        },
    }
    json_path = Path(str(out)).with_suffix(".json")
    json_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(f"[panoptes] report → {out} + {json_path.name} · mode={args.mode} · total {time.time() - t0:.1f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
