"""The study pipeline as a library call — `run_study(cfg, mode)`.

Refactored out of the CLI so `panoptes run` and `panoptes recommend` share one
code path: ingest → grid → demand/income/access layers → score → analyses.
Returns everything downstream consumers (CLI printout, report, recommendations,
JSON contract) need.
"""

from __future__ import annotations

import time
from dataclasses import dataclass

from panoptes import analysis, grid, score, zones
from panoptes.analysis import Companion, Opportunity
from panoptes.config import StudyConfig
from panoptes.grid import Cell
from panoptes.ingest import income, overture, population, streets
from panoptes.ingest.overture import Place
from panoptes.score import CandidateResult, CellScore
from panoptes.zones import ZoneResult


@dataclass
class StudyArtifacts:
    config: StudyConfig
    mode: str
    places: list[Place]
    cells: dict[str, Cell]
    cell_scores: dict[str, CellScore]
    candidates: list[CandidateResult]
    companions: list[Companion]
    analogs: dict[str, float]
    opportunities: dict[str, Opportunity]
    zones: ZoneResult
    morans_i: float
    morans_p: float
    access_source: str
    seconds: float


def run_study(cfg: StudyConfig, mode: str = "data", log=print) -> StudyArtifacts:
    """Run the full pipeline. `log` is called with progress strings (pass a
    no-op to silence)."""
    t0 = time.time()
    log(f"[panoptes] study: {cfg.name}")
    log(f"[panoptes] pulling Overture places ({cfg.overture_release}) …")
    places = overture.fetch_places(cfg.area, cfg.overture_release)
    log(f"[panoptes] {len(places)} places in area · {time.time() - t0:.1f}s")

    cells = grid.area_cells(cfg.area, cfg.h3_resolution)
    grid.assign_places(cells, places, cfg.h3_resolution, cfg.target_categories, cfg.complement_categories)
    log(f"[panoptes] grid: {len(cells)} hexes at res {cfg.h3_resolution}")

    covered = population.assign_population(cells)
    log(f"[panoptes] census population joined: {covered}/{len(cells)} hexes in populated cells")
    matched = income.assign_income(cells)
    idx = sorted({round(c.income_index, 4) for c in cells.values()})
    log(f"[panoptes] income index joined: {matched}/{len(cells)} direct · range {idx[0]}–{idx[-1]}")

    t1 = time.time()
    access = streets.hex_centrality(cfg.area, cfg.h3_resolution)
    if access:
        log(f"[panoptes] street network: closeness centrality on {len(access)} hexes "
            f"(cityseer, 800m) · {time.time() - t1:.1f}s")
    else:
        log("[panoptes] street network unavailable — access falls back to the POI-diversity proxy")
    access_source = "street_network" if access else "poi_diversity_proxy"

    mi, mp = analysis.morans_i(cells)
    verdict = ("location structures this category" if (mi > 0.1 and mp < 0.05)
               else "WEAK clustering — site choice may matter less for this category")
    log(f"[panoptes] spatial clustering gate: Moran's I {mi} (p={mp}) — {verdict}")

    cell_scores = score.score_cells(cells, cfg.weights, access_override=access or None)
    if mode == "advanced" and cfg.local_factors:
        score.apply_local_factors(cell_scores, cfg.local_factors)
        for f in cfg.local_factors:
            n_hit = sum(1 for s in cell_scores.values() if any(a[0] == f.name for a in s.adjustments))
            log(f"[panoptes] local factor (analyst judgement): {f.name} {f.adjustment:+.0f} pts "
                f"over {n_hit} hexes — {f.note}")

    ranked = score.score_candidates(cfg.candidates, cell_scores, cfg.h3_resolution)
    companions = analysis.colocation_profile(places, cfg.target_categories, cfg.h3_resolution)
    analogs = analysis.analog_scores(places, cfg.target_categories, cfg.h3_resolution)
    opps = analysis.opportunity_map(cell_scores)
    zr = zones.zone_map(places, cfg.h3_resolution)

    return StudyArtifacts(
        config=cfg, mode=mode, places=places, cells=cells, cell_scores=cell_scores,
        candidates=ranked, companions=companions, analogs=analogs, opportunities=opps,
        zones=zr, morans_i=mi, morans_p=mp, access_source=access_source,
        seconds=round(time.time() - t0, 1),
    )


def build_payload(art: StudyArtifacts, recommendations: list | None = None) -> dict:
    """The machine-readable JSON contract the viewer/portal consume."""
    import dataclasses

    payload = {
        "study": art.config.name,
        "mode": art.mode,
        "generated_by": "panoptes v0.3",
        "sector": art.config.sector,
        "access_source": art.access_source,
        "morans_i": art.morans_i,
        "morans_p": art.morans_p,
        "hexes": [dataclasses.asdict(s) for s in art.cell_scores.values()],
        "candidates": [
            {"name": r.name, "lat": r.lat, "lon": r.lon, "score": dataclasses.asdict(r.score)}
            for r in art.candidates
        ],
        "companions": [dataclasses.asdict(c) for c in art.companions],
        "opportunities": [dataclasses.asdict(o) for o in art.opportunities.values()],
        "zones": {
            "labels": {str(z): lbl for z, lbl in art.zones.labels.items()},
            "assignments": [{"h3_id": h, "zone": z} for h, z in art.zones.assignments.items()],
        },
        "local_factors_applied": art.mode == "advanced" and bool(art.config.local_factors),
    }
    if recommendations is not None:
        payload["recommendations"] = [dataclasses.asdict(r) for r in recommendations]
    return payload
