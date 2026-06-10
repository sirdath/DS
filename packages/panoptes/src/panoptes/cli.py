"""Panoptes CLI: `panoptes run study.yaml [-o report.html]`."""

from __future__ import annotations

import argparse
import sys
import time

from panoptes import grid, report, score
from panoptes.config import StudyConfig
from panoptes.ingest import overture, population


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="panoptes", description="DS2 site-selection engine")
    sub = parser.add_subparsers(dest="command", required=True)
    run = sub.add_parser("run", help="run a study from a YAML config")
    run.add_argument("config", help="path to study YAML")
    run.add_argument("-o", "--out", default=None, help="output HTML path")
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

    cell_scores = score.score_cells(cells, cfg.weights)
    ranked = score.score_candidates(cfg.candidates, cell_scores, cfg.h3_resolution)

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
            print(f"  #{i} {r.name}: {r.score.total}")

    out = report.render(cfg, cell_scores, ranked, out_path)
    print(f"[panoptes] report → {out} · total {time.time() - t0:.1f}s")
    return 0


if __name__ == "__main__":
    sys.exit(main())
