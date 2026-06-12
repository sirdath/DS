"""Functional zones — the city's structure, named.

City-as-language: a business type's function is revealed by the types around
it. Pipeline (all public methods):

1. Type co-occurrence counts over spatial contexts (a POI's context = the
   categories in its hex + first ring).
2. PPMI transform — the matrix skip-gram embeddings implicitly factorise
   (Levy & Goldberg 2014), so explicit PPMI+SVD gives comparable type vectors
   with zero training time.
3. SVD → dense type embeddings.
4. Hex vectors = count-weighted mean of their neighbourhood's type vectors.
5. Seeded k-means over hex vectors → zones; each zone auto-labelled by its
   most over-represented categories ("cafe · bar · hotel").

Deterministic end-to-end (fixed seeds) so a study re-run reproduces its zones.
"""

from __future__ import annotations

import random
from collections import Counter
from dataclasses import dataclass

import h3
import numpy as np


@dataclass
class ZoneResult:
    assignments: dict[str, int]  # h3_id -> zone id
    labels: dict[int, str]  # zone id -> human-readable label
    sizes: dict[int, int]  # zone id -> hex count


def _hex_categories(places: list, resolution: int) -> dict[str, Counter]:
    out: dict[str, Counter] = {}
    for p in places:
        if p.category == "unknown":
            continue
        h = h3.latlng_to_cell(p.lat, p.lon, resolution)
        out.setdefault(h, Counter())[p.category] += 1
    return out


def _type_embeddings(
    hex_cats: dict[str, Counter], dims: int, min_count: int
) -> tuple[dict[str, int], np.ndarray]:
    totals: Counter = Counter()
    for c in hex_cats.values():
        totals.update(c)
    vocab = [t for t, n in totals.most_common() if n >= min_count]
    index = {t: i for i, t in enumerate(vocab)}
    n = len(vocab)
    if n < 4:
        return index, np.zeros((n, max(dims, 1)))

    # co-occurrence over neighbourhood contexts (hex + ring 1)
    M = np.zeros((n, n))
    for h, cats in hex_cats.items():
        ctx: Counter = Counter()
        for nb in h3.grid_disk(h, 1):
            c = hex_cats.get(nb)
            if c:
                ctx.update(c)
        for a, na in cats.items():
            ia = index.get(a)
            if ia is None:
                continue
            for b, nb_count in ctx.items():
                ib = index.get(b)
                if ib is not None and ia != ib:
                    M[ia, ib] += na * nb_count

    total = M.sum() or 1.0
    row = M.sum(axis=1, keepdims=True)
    col = M.sum(axis=0, keepdims=True)
    with np.errstate(divide="ignore", invalid="ignore"):
        pmi = np.log((M * total) / (row @ col))
    ppmi = np.where(np.isfinite(pmi), np.maximum(pmi, 0.0), 0.0)

    k = min(dims, n - 1)
    U, S, _ = np.linalg.svd(ppmi, full_matrices=False)
    emb = U[:, :k] * np.sqrt(S[:k])  # symmetric scaling, standard practice
    return index, emb


def _kmeans(X: np.ndarray, k: int, seed: int = 42, iters: int = 60) -> np.ndarray:
    rng = random.Random(seed)
    centroids = X[rng.sample(range(len(X)), k)].copy()
    labels = np.zeros(len(X), dtype=int)
    for _ in range(iters):
        d = ((X[:, None, :] - centroids[None, :, :]) ** 2).sum(axis=2)
        new = d.argmin(axis=1)
        if (new == labels).all():
            break
        labels = new
        for j in range(k):
            members = X[labels == j]
            if len(members):
                centroids[j] = members.mean(axis=0)
    return labels


def zone_map(
    places: list,
    resolution: int,
    k: int = 5,
    dims: int = 24,
    min_count: int = 5,
) -> ZoneResult:
    hex_cats = _hex_categories(places, resolution)
    index, emb = _type_embeddings(hex_cats, dims, min_count)
    if not index or emb.shape[0] < k or len(hex_cats) <= k:
        return ZoneResult({}, {}, {})

    hexes = list(hex_cats.keys())
    vecs = np.zeros((len(hexes), emb.shape[1]))
    for i, h in enumerate(hexes):
        agg: Counter = Counter()
        for nb in h3.grid_disk(h, 1):
            c = hex_cats.get(nb)
            if c:
                agg.update(c)
        total = 0.0
        for t, cnt in agg.items():
            j = index.get(t)
            if j is not None:
                vecs[i] += cnt * emb[j]
                total += cnt
        if total:
            vecs[i] /= total
    norms = np.linalg.norm(vecs, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    vecs = vecs / norms

    labels_arr = _kmeans(vecs, k)
    assignments = {h: int(labels_arr[i]) for i, h in enumerate(hexes)}

    # label each zone by its most over-represented categories vs the area
    global_tot: Counter = Counter()
    for c in hex_cats.values():
        global_tot.update(c)
    g_sum = sum(global_tot.values()) or 1
    labels: dict[int, str] = {}
    sizes: dict[int, int] = {}
    for z in range(k):
        zone_hexes = [h for h in hexes if assignments[h] == z]
        sizes[z] = len(zone_hexes)
        zc: Counter = Counter()
        for h in zone_hexes:
            zc.update(hex_cats[h])
        z_sum = sum(zc.values()) or 1
        lifts = [
            (cat, (n / z_sum) / (global_tot[cat] / g_sum))
            for cat, n in zc.items()
            if n >= 3 and global_tot[cat] >= min_count
        ]
        lifts.sort(key=lambda t: t[1], reverse=True)
        labels[z] = " · ".join(cat for cat, _ in lifts[:3]) or "mixed"
    return ZoneResult(assignments, labels, sizes)
