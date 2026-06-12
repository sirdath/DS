"""Decision analyses on top of the scored grid — public-literature methods.

- Co-location profile: which categories sit with the target more than chance
  (lift = observed/expected co-occurrence over hex neighbourhoods; association
  -rule statistics, cf. Levy & Goldberg 2014 for the PMI connection). High-lift
  categories are the target's natural anchors/complements — "good company".
- Opportunity (white-space): demand says conditions are right, saturation says
  nobody is serving it. opportunity = demand percentile − rival-density
  percentile; flagged white-space when demand is strong (>70th pct) AND the
  gap is in the top decile — a ranked list of under-served pockets.

Both are transparent by construction: every number traces to POI counts the
report already shows.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass

import h3

from panoptes.score import CellScore


@dataclass(frozen=True)
class Companion:
    category: str
    lift: float
    support: int  # neighbourhoods where the pair co-occurs


def _percentiles(values: list[float]) -> list[float]:
    """Rank-based percentile (0–100) per value; ties share the average rank."""
    order = sorted(range(len(values)), key=lambda i: values[i])
    pct = [0.0] * len(values)
    n = len(values)
    i = 0
    while i < n:
        j = i
        while j + 1 < n and values[order[j + 1]] == values[order[i]]:
            j += 1
        avg = (i + j) / 2 / max(n - 1, 1) * 100.0
        for k in range(i, j + 1):
            pct[order[k]] = avg
        i = j + 1
    return pct


def colocation_profile(
    places: list,
    target_categories: list[str],
    resolution: int,
    min_support: int = 10,
    top_n: int = 12,
) -> list[Companion]:
    """Categories over-represented around target POIs, by lift.

    POI-level contexts (the robust form in dense areas, where every
    neighbourhood contains a target and document-level lift degenerates to 1):
    each target POI's neighbourhood (its hex + first ring) contributes the
    categories found there; lift = share of C in target contexts / share of C
    in the whole study area. lift 2.0 = "twice as common next to the target
    as in the area at large".
    """
    targets = set(target_categories)
    cat_total: Counter = Counter()
    hex_cats: dict[str, Counter] = {}
    target_hexes: list[str] = []
    for p in places:
        if p.category == "unknown":
            continue
        cat_total[p.category] += 1
        h = h3.latlng_to_cell(p.lat, p.lon, resolution)
        hex_cats.setdefault(h, Counter())[p.category] += 1
        if p.category in targets:
            target_hexes.append(h)

    all_total = sum(cat_total.values())
    if all_total == 0 or not target_hexes:
        return []

    co: Counter = Counter()
    for h in target_hexes:
        for n in h3.grid_disk(h, 1):
            c = hex_cats.get(n)
            if c:
                co.update(c)
    for t in targets:  # the target is not its own companion
        co.pop(t, None)
    co_total = sum(co.values())
    if co_total == 0:
        return []

    out = []
    for cat, n in co.items():
        if n < min_support:
            continue
        lift = (n / co_total) / (cat_total[cat] / all_total)
        out.append(Companion(category=cat, lift=round(lift, 2), support=n))
    out.sort(key=lambda c: c.lift, reverse=True)
    return out[:top_n]


@dataclass
class Opportunity:
    h3_id: str
    opportunity: float  # demand pct − rival-density pct (−100 … +100)
    white_space: bool


def opportunity_map(cell_scores: dict[str, CellScore]) -> dict[str, Opportunity]:
    """Demand-vs-saturation gap per hex, with white-space flags.

    White-space: demand above the 70th percentile AND gap in the top decile —
    conditions are right and nobody is serving them.
    """
    ids = list(cell_scores.keys())
    demand_pct = _percentiles([cell_scores[h].demand for h in ids])
    # competition score is inverted rivals; invert back to saturation
    rivals_pct = _percentiles([100.0 - cell_scores[h].competition for h in ids])
    gaps = [demand_pct[i] - rivals_pct[i] for i in range(len(ids))]
    gap_pct = _percentiles(gaps)

    out: dict[str, Opportunity] = {}
    for i, h in enumerate(ids):
        out[h] = Opportunity(
            h3_id=h,
            opportunity=round(gaps[i], 1),
            white_space=demand_pct[i] > 70.0 and gap_pct[i] > 90.0,
        )
    return out
