"""Scoring model v0 — three transparent pillars per hex, 0–100.

- demand: a blend of complement/anchor POI gravity ("reasons to be here") and
  purchasing-power gravity — census population × the prefecture's AADE income
  index ("people who live here × what they earn") — both smoothed over the
  hex's neighbourhood. The blend knob is Weights.demand_pop_share.
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

import math

from panoptes.config import Candidate, LocalFactor, Weights
from panoptes.grid import Cell


@dataclass
class CellScore:
    """Per-hex result. `adjustments` lists analyst local factors applied here
    (name, points) — kept separate from the data pillars so the report can
    show exactly what is data and what is judgement."""
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
    adjustments: list[tuple[str, float]] = None  # type: ignore[assignment]


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


def _purchasing_power(cells: dict[str, Cell], h: str, rings: int = 2) -> float:
    """Population × income index, distance-decayed — heads weighted by wallets."""
    total = 0.0
    for k in range(rings + 1):
        weight = 1.0 / (1 + k)
        for n in h3.grid_ring(h, k):
            cell = cells.get(n)
            if cell is not None:
                total += weight * cell.population * cell.income_index
    return total


def _diversity(cell: Cell) -> float:
    """Distinct category families present — crude but honest liveliness proxy."""
    return float(len({c.split(".")[0] for c in cell.categories}))


def _normalise(values: list[float]) -> list[float]:
    hi = max(values, default=0.0)
    if hi <= 0:
        return [0.0 for _ in values]
    return [100.0 * v / hi for v in values]


def score_cells(
    cells: dict[str, Cell],
    weights: Weights,
    access_override: dict[str, float] | None = None,
) -> dict[str, CellScore]:
    """access_override: street-network centrality per hex (cityseer) when the
    network fetch succeeded; otherwise the POI-diversity proxy is used."""
    ids = list(cells.keys())
    raw_poi = [_neighbourhood_sum(cells, h, "complement_count") for h in ids]
    raw_pop = [_purchasing_power(cells, h) for h in ids]
    raw_rivals = [_neighbourhood_sum(cells, h, "target_count") for h in ids]
    if access_override:
        raw_access = [access_override.get(h, 0.0) for h in ids]
    else:
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
            adjustments=[],
        )
    return out


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6_371_000.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


def apply_local_factors(cell_scores: dict[str, CellScore], factors: list[LocalFactor]) -> None:
    """Adjust totals by analyst-entered local factors (clamped ±25 points per
    factor, totals clamped to 0–100). Each application is recorded on the cell
    so reports can attribute every point to either data or judgement."""
    for f in factors:
        adj = max(-25.0, min(25.0, f.adjustment))
        for s in cell_scores.values():
            if _haversine_m(f.lat, f.lon, s.lat, s.lon) <= f.radius_m:
                s.total = round(max(0.0, min(100.0, s.total + adj)), 1)
                s.adjustments.append((f.name, adj))


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
