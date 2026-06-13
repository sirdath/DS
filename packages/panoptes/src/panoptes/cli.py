"""Panoptes CLI.

  panoptes run <study.yaml> [-o out.html] [--mode data|advanced]
  panoptes recommend --sector gym --area athens-center [-o] [--mode] [--no-geocode]
  panoptes sectors
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

from panoptes import engine, gazetteer, recommend, report, sectors
from panoptes.config import StudyConfig


def _slug(s: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", s.lower()).strip("-") or "study"


def _write_outputs(art, out_path: str, recs=None) -> None:
    out = report.render(
        art.config, art.cell_scores, art.candidates, out_path,
        opportunities=art.opportunities, mode=art.mode, recommendations=recs,
    )
    payload = engine.build_payload(art, recommendations=recs)
    json_path = Path(str(out)).with_suffix(".json")
    json_path.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    print(f"[panoptes] report → {out} + {json_path.name} · mode={art.mode} · {art.seconds}s")


def _print_candidates(art) -> None:
    if not art.candidates:
        return
    import h3
    print("[panoptes] candidates, best first:")
    for i, r in enumerate(art.candidates, 1):
        twin = art.analogs.get(h3.latlng_to_cell(r.lat, r.lon, art.config.h3_resolution), 0.0)
        print(f"  #{i} {r.name}: {r.score.total} · resembles thriving areas {twin}/100")


def _print_recommendations(recs) -> None:
    print(f"\n[panoptes] ── recommended areas to open ({len(recs)}) ──")
    for r in recs:
        flag = " · WHITE-SPACE" if r.white_space else ""
        print(f"\n  #{r.rank}  {r.area_name}  — suitability {r.score}/100{flag}")
        print(f"      demand {r.demand} · competition {r.competition} · access {r.access} "
              f"· resemblance {r.analog} · {r.hex_count} hexes")
        for reason in r.reasons:
            print(f"      • {reason}")


def cmd_run(args) -> int:
    cfg = sectors.apply_sector(StudyConfig.from_yaml(args.config))
    art = engine.run_study(cfg, mode=args.mode, streets_mode=args.streets)
    _print_candidates(art)
    out_path = args.out or f"out/{_slug(cfg.name)}.html"
    _write_outputs(art, out_path)
    return 0


def cmd_recommend(args) -> int:
    profile = sectors.resolve_sector(args.sector)
    if profile is None:
        print(f"unknown sector '{args.sector}'. Available:", file=sys.stderr)
        for p in sectors.list_sectors():
            print(f"  {p.key} — {p.label}", file=sys.stderr)
        return 2
    if args.bbox:
        area = gazetteer.parse_bbox(args.bbox)
        area_name = args.bbox
    else:
        area = gazetteer.resolve_area(args.area)
        if area is None:
            print(f"unknown area '{args.area}'. Known: {', '.join(gazetteer.list_areas())} "
                  f"(or pass --bbox)", file=sys.stderr)
            return 2
        area_name = args.area

    res = args.res if args.res is not None else gazetteer.suggest_resolution(area)
    cfg = sectors.study_from_sector(
        profile, area, name=f"{profile.label} — {area_name}", h3_resolution=res,
    )
    art = engine.run_study(cfg, mode=args.mode, streets_mode=args.streets)
    recs = recommend.recommend_areas(art, sector=profile, top_n=args.top, geocode=not args.no_geocode)
    _print_recommendations(recs)
    out_path = args.out or f"out/{_slug(cfg.name)}.html"
    _write_outputs(art, out_path, recs=recs)
    return 0


def cmd_sectors(_args) -> int:
    print("Sectors:")
    for p in sectors.list_sectors():
        print(f"  {p.key:14} {p.label}")
    print("\nAreas:")
    for a in gazetteer.list_areas():
        print(f"  {a}")
    print("\nExample:  panoptes recommend --sector gym --area athens-center")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="panoptes", description="DS2 site-selection engine")
    sub = parser.add_subparsers(dest="command", required=True)

    run = sub.add_parser("run", help="run a study from a YAML config")
    run.add_argument("config")
    run.add_argument("-o", "--out", default=None)
    run.add_argument("--mode", choices=["data", "advanced"], default="data")
    run.add_argument("--streets", choices=["auto", "on", "off"], default="auto")
    run.set_defaults(func=cmd_run)

    rec = sub.add_parser("recommend", help="recommend where to open a sector in an area")
    rec.add_argument("--sector", required=True, help="e.g. gym, restaurant, pharmacy")
    rec.add_argument("--area", default="athens-center", help="named area (see `panoptes sectors`)")
    rec.add_argument("--bbox", default=None, help="minlon,minlat,maxlon,maxlat (overrides --area)")
    rec.add_argument("-o", "--out", default=None)
    rec.add_argument("--mode", choices=["data", "advanced"], default="data")
    rec.add_argument("--top", type=int, default=5)
    rec.add_argument("--res", type=int, default=None,
                     help="H3 resolution (auto: 9 for a neighbourhood, 8 for a metro)")
    rec.add_argument("--streets", choices=["auto", "on", "off"], default="auto",
                     help="street-network access pass; auto skips it for metro-scale areas to save CPU")
    rec.add_argument("--no-geocode", action="store_true", help="skip Nominatim area naming")
    rec.set_defaults(func=cmd_recommend)

    sec = sub.add_parser("sectors", help="list available sectors and areas")
    sec.set_defaults(func=cmd_sectors)

    args = parser.parse_args(argv)
    return int(args.func(args))


if __name__ == "__main__":
    sys.exit(main())
