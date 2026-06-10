"""Scoring model v0 — three transparent pillars per hex, 0–100.

- demand: a blend of complement/anchor POI gravity ("reasons to be here") and
  census population gravity ("people who live here"), both smoothed over the
  hex's neighbourhood. The blend knob is Weights.demand_pop_share. The AADE
  income layer joins this pillar next.
- competition: target-category density with distance decay — close rivals
  count more. Inverted: fewer rivals = higher score. (Deliberate v0 stance;
  some categories *benefit* from clustering, which is what the weight knob and
  the analyst's read are for. The report shows raw counts alongside.)
- access: POI diversity as a liveliness/accessibility proxy until the OSRM
  isochrone service is wired in.

Every score is shown with its inputs in the report — defensible, not a black box.
"""

from __future__ import annotations

from dataclasses import dataclass

import h3

from panoptes.config import Candidate, Weights
from panoptes.grid import Cell


@dataclass
class CellScore:
    h3_id: str
    lat: float
    lon: float
    demand: float
    competition: float
    access: float
    total: float
    target_count: int
    complement_count: int
    population: int


@dataclass
class CandidateResult:
    name: str
    lat: float
    lon: float
    score: CellScore


def _neighbourhood_sum(cells: dict[str, Cell], h: str, attr: str, rings: int = 2) -> float:
    """Distance-decayed sum of `attr` over the hex and its k-rings."""
    total = 0.0
    for k in range(rings + 1):
        weight = 1.0 / (1 + k)  # ring 0 → 1.0, ring 1 → 0.5, ring 2 → 0.33
        for n in h3.grid_ring(h, k):
            cell = cells.get(n)
            if cell is not None:
                total += weight * getattr(cell, attr)
    return total


def _diversity(cell: Cell) -> float:
    """Distinct category families present — crude but honest liveliness proxy."""
    return float(len({c.split(".")[0] for c in cell.categories}))


def _normalise(values: list[float]) -> list[float]:
    hi = max(values, default=0.0)
    if hi <= 0:
        return [0.0 for _ in values]
    return [100.0 * v / hi for v in values]


def score_cells(cells: dict[str, Cell], weights: Weights) -> dict[str, CellScore]:
    ids = list(cells.keys())
    raw_poi = [_neighbourhood_sum(cells, h, "complement_count") for h in ids]
    raw_pop = [_neighbourhood_sum(cells, h, "population") for h in ids]
    raw_rivals = [_neighbourhood_sum(cells, h, "target_count") for h in ids]
    raw_access = [_diversity(cells[h]) for h in ids]

    poi_n, pop_n = _normalise(raw_poi), _normalise(raw_pop)
    share = weights.demand_pop_share
    demand = [(1 - share) * poi_n[i] + share * pop_n[i] for i in range(len(ids))]
    access = _normalise(raw_access)
    # competition: most rivals → 0, no rivals → 100.
    rivals_n = _normalise(raw_rivals)
    competition = [100.0 - r for r in rivals_n]

    w_sum = weights.demand + weights.competition + weights.access
    out: dict[str, CellScore] = {}
    for i, h in enumerate(ids):
        cell = cells[h]
        total = (
            weights.demand * demand[i]
            + weights.competition * competition[i]
            + weights.access * access[i]
        ) / w_sum
        out[h] = CellScore(
            h3_id=h,
            lat=cell.lat,
            lon=cell.lon,
            demand=round(demand[i], 1),
            competition=round(competition[i], 1),
            access=round(access[i], 1),
            total=round(total, 1),
            target_count=cell.target_count,
            complement_count=cell.complement_count,
            population=int(cell.population),
        )
    return out


def score_candidates(
    candidates: list[Candidate],
    cell_scores: dict[str, CellScore],
    resolution: int,
) -> list[CandidateResult]:
    """Each candidate inherits its hex's score; ranked best-first."""
    results: list[CandidateResult] = []
    for c in candidates:
        h = h3.latlng_to_cell(c.lat, c.lon, resolution)
        score = cell_scores.get(h)
        if score is None:
            continue  # candidate outside the study area — surfaced by the CLI
        results.append(CandidateResult(name=c.name, lat=c.lat, lon=c.lon, score=score))
    return sorted(results, key=lambda r: r.score.total, reverse=True)
