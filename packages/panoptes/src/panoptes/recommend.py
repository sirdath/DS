"""Area recommendations — turn the scored grid into ranked, named places to
open, with a plain reason for each.

A `recommend` run has no client-supplied candidates: the engine must surface
where to open. Method: take the strongest hexes (overall suitability nudged
toward under-served ones), group adjacent ones into contiguous areas, name each
by reverse-geocoding its centroid, and write data-driven reasons from the pillar
breakdown, analog resemblance, opportunity gap and functional zone.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass, field

import h3

logger = logging.getLogger(__name__)


@dataclass
class AreaRecommendation:
    rank: int
    lat: float
    lon: float
    area_name: str
    zone_label: str
    score: float
    opportunity: float
    demand: float
    competition: float
    access: float
    analog: float
    rivals_in_area: int
    hex_count: int
    white_space: bool
    reasons: list[str] = field(default_factory=list)


def _components(hexes: set[str]) -> list[list[str]]:
    """Connected components over H3 ring-1 adjacency."""
    seen: set[str] = set()
    comps: list[list[str]] = []
    for start in hexes:
        if start in seen:
            continue
        stack, comp = [start], []
        while stack:
            x = stack.pop()
            if x in seen:
                continue
            seen.add(x)
            comp.append(x)
            for nb in h3.grid_disk(x, 1):
                if nb in hexes and nb not in seen:
                    stack.append(nb)
        comps.append(comp)
    return comps


def _reverse_geocode(lat: float, lon: float) -> str | None:
    """Nominatim reverse geocode → a neighbourhood/suburb name. Best-effort:
    returns None on any failure so the caller falls back to coordinates."""
    try:
        import requests

        r = requests.get(
            "https://nominatim.openstreetmap.org/reverse",
            params={"lat": lat, "lon": lon, "format": "json", "zoom": 14, "addressdetails": 1},
            headers={"User-Agent": "panoptes-ds2/0.3 (+https://github.com/sirdath/DS)"},
            timeout=15,
        )
        if r.status_code != 200:
            return None
        addr = r.json().get("address", {})
        for key in ("suburb", "neighbourhood", "city_district", "quarter", "town", "village", "city"):
            if addr.get(key):
                name = addr[key]
                city = addr.get("city") or addr.get("town")
                return f"{name}, {city}" if city and city != name else str(name)
        return None
    except Exception as exc:  # offline / rate-limited / API drift
        logger.warning("reverse geocode failed: %s", exc)
        return None


def recommend_areas(art, sector=None, top_n: int = 5, geocode: bool = True) -> list[AreaRecommendation]:
    """Rank the best areas to open. `art` is a StudyArtifacts; `sector` an
    optional SectorProfile used for the rationale wording."""
    import time

    scores = art.cell_scores
    opps = art.opportunities
    analogs = art.analogs
    zones = art.zones
    if not scores:
        return []

    label = sector.label.lower() if sector else "the target"
    clustering_ok = bool(sector and sector.clustering)

    # recommendation score: overall suitability, nudged toward under-served
    # hexes (opportunity in −100…100 contributes up to ±20).
    def rec_score(h: str) -> float:
        opp = opps[h].opportunity if h in opps else 0.0
        return scores[h].total + 0.2 * opp

    ranked_hexes = sorted(scores, key=rec_score, reverse=True)
    # candidate pool: top 25% by recommendation score, and only genuinely good
    # cells (total above the grid median) so weak areas never get surfaced.
    totals = sorted(s.total for s in scores.values())
    median = totals[len(totals) // 2]
    pool_size = max(1, len(ranked_hexes) // 4)
    pool = {h for h in ranked_hexes[:pool_size] if scores[h].total >= median}
    if not pool:
        pool = set(ranked_hexes[:pool_size])

    areas = []
    for comp in _components(pool):
        n = len(comp)
        wsum = sum(scores[h].total for h in comp) or 1.0
        lat = sum(scores[h].lat * scores[h].total for h in comp) / wsum
        lon = sum(scores[h].lon * scores[h].total for h in comp) / wsum
        mean = lambda f: sum(f(h) for h in comp) / n  # noqa: E731
        zone_counts: dict[int, int] = {}
        for h in comp:
            z = zones.assignments.get(h)
            if z is not None:
                zone_counts[z] = zone_counts.get(z, 0) + 1
        zone_label = zones.labels.get(max(zone_counts, key=zone_counts.get), "") if zone_counts else ""
        areas.append({
            "hexes": comp, "lat": lat, "lon": lon, "hex_count": n,
            "score": round(mean(lambda h: scores[h].total), 1),
            "demand": round(mean(lambda h: scores[h].demand), 1),
            "competition": round(mean(lambda h: scores[h].competition), 1),
            "access": round(mean(lambda h: scores[h].access), 1),
            "opportunity": round(mean(lambda h: opps[h].opportunity if h in opps else 0.0), 1),
            "analog": round(mean(lambda h: analogs.get(h, 0.0)), 1),
            "rivals": sum(scores[h].target_count for h in comp),
            "white_space": any(opps[h].white_space for h in comp if h in opps),
            "zone_label": zone_label,
        })

    areas.sort(key=lambda a: a["score"], reverse=True)
    top = areas[:top_n]

    out: list[AreaRecommendation] = []
    for rank, a in enumerate(top, start=1):
        name = _reverse_geocode(a["lat"], a["lon"]) if geocode else None
        if geocode and rank < len(top):
            time.sleep(1.0)  # Nominatim asks for ≤1 request/second
        if not name:
            name = f"{a['lat']:.4f}, {a['lon']:.4f}"
        out.append(AreaRecommendation(
            rank=rank, lat=round(a["lat"], 5), lon=round(a["lon"], 5), area_name=name,
            zone_label=a["zone_label"], score=a["score"], opportunity=a["opportunity"],
            demand=a["demand"], competition=a["competition"], access=a["access"],
            analog=a["analog"], rivals_in_area=a["rivals"], hex_count=a["hex_count"],
            white_space=a["white_space"], reasons=_reasons(a, label, clustering_ok),
        ))
    return out


def _reasons(a: dict, label: str, clustering_ok: bool) -> list[str]:
    r: list[str] = []
    if a["demand"] >= 65:
        r.append(f"Strong nearby demand — populated, higher-income catchment (demand {a['demand']}/100).")
    elif a["demand"] >= 45:
        r.append(f"Solid local demand (demand {a['demand']}/100).")
    if a["competition"] >= 70 and not clustering_ok:
        r.append(f"Little competition — few rival {label} in the area ({a['rivals']} nearby).")
    if a["access"] >= 70:
        r.append(f"Excellent street access and footfall potential (access {a['access']}/100).")
    if a["analog"] >= 70:
        r.append(f"Closely resembles areas where {label} already thrive ({a['analog']}/100 match).")
    if a["white_space"]:
        r.append("Under-served white-space: high demand meets low saturation here.")
    if clustering_ok and a["rivals"] > 0:
        r.append(f"A {label} cluster is nearby — for this sector that signals a healthy market, not a barrier.")
    if a["zone_label"]:
        r.append(f"Sits in a {a['zone_label']} district.")
    return r or ["Balanced conditions across demand, competition and access."]
