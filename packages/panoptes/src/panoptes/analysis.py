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


def analog_scores(
    places: list,
    target_categories: list[str],
    resolution: int,
    top_categories: int = 24,
    thriving_quantile: float = 0.75,
) -> dict[str, float]:
    """Applebaum's analog method (1966): how much does each hex resemble the
    places where the target already thrives?

    "Thriving" = hexes in the top quartile of target counts (incumbent density
    as the revealed-success proxy — no revenue data exists; reports disclose
    this). Each hex is described by the composition of its neighbourhood (hex
    + first ring) over the area's most common categories, target excluded.
    Score = cosine similarity to the mean thriving signature, scaled 0–100.
    """
    targets = set(target_categories)
    hex_cats: dict[str, Counter] = {}
    target_count: Counter = Counter()
    for p in places:
        if p.category == "unknown":
            continue
        h = h3.latlng_to_cell(p.lat, p.lon, resolution)
        hex_cats.setdefault(h, Counter())[p.category] += 1
        if p.category in targets:
            target_count[h] += 1

    vocab_counts: Counter = Counter()
    for c in hex_cats.values():
        vocab_counts.update(c)
    for t in targets:
        vocab_counts.pop(t, None)
    vocab = [cat for cat, _ in vocab_counts.most_common(top_categories)]
    if not vocab or not target_count:
        return {}

    def vector(h: str) -> list[float]:
        agg: Counter = Counter()
        for n in h3.grid_disk(h, 1):
            c = hex_cats.get(n)
            if c:
                agg.update(c)
        total = sum(agg[cat] for cat in vocab) or 1
        return [agg[cat] / total for cat in vocab]

    counts = sorted(target_count.values())
    cut = counts[int(len(counts) * thriving_quantile)] if len(counts) > 1 else counts[0]
    thriving = [h for h, n in target_count.items() if n >= cut]
    if not thriving:
        return {}

    sig = [0.0] * len(vocab)
    for h in thriving:
        v = vector(h)
        sig = [a + b for a, b in zip(sig, v)]
    sig = [a / len(thriving) for a in sig]
    sig_norm = sum(a * a for a in sig) ** 0.5 or 1.0

    out: dict[str, float] = {}
    for h in hex_cats:
        v = vector(h)
        v_norm = sum(a * a for a in v) ** 0.5
        if v_norm == 0:
            out[h] = 0.0
            continue
        cos = sum(a * b for a, b in zip(sig, v)) / (sig_norm * v_norm)
        out[h] = round(100.0 * max(cos, 0.0), 1)
    return out


def morans_i(
    cells: dict,
    attr: str = "target_count",
    permutations: int = 199,
) -> tuple[float, float]:
    """Global Moran's I over the hex grid (ring-1 adjacency) + permutation
    pseudo p-value — the "does location even matter?" gate (cf. the spatial
    autocorrelation step in classic retail-geography pipelines: I near 0 means
    the category scatters randomly and a site-selection study adds little;
    significantly positive I means location genuinely structures it).
    """
    import random

    ids = [h for h in cells]
    x = [float(getattr(cells[h], attr)) for h in ids]
    n = len(ids)
    if n < 3:
        return 0.0, 1.0
    mean = sum(x) / n
    dev = [v - mean for v in x]
    denom = sum(d * d for d in dev)
    if denom == 0:
        return 0.0, 1.0

    idx = {h: i for i, h in enumerate(ids)}
    pairs: list[tuple[int, int]] = []
    for h in ids:
        i = idx[h]
        for nb in h3.grid_ring(h, 1):
            j = idx.get(nb)
            if j is not None:
                pairs.append((i, j))
    w_sum = len(pairs)
    if w_sum == 0:
        return 0.0, 1.0

    def stat(d: list[float]) -> float:
        num = sum(d[i] * d[j] for i, j in pairs)
        return (n / w_sum) * (num / denom)

    observed = stat(dev)
    rng = random.Random(42)  # deterministic reports
    ge = 1
    shuffled = dev[:]
    for _ in range(permutations):
        rng.shuffle(shuffled)
        if stat(shuffled) >= observed:
            ge += 1
    p = ge / (permutations + 1)
    return round(observed, 3), round(p, 4)
