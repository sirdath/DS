"""Income layer — AADE declared income per prefecture, tax year 2022.

Verified empirically (June 2026): the finest open geography AADE publishes for
declared income is the prefecture (Π22 in the annual bulletin) — there is no
public per-postal-code file. So income enters the model as a prefecture-level
purchasing-power index (mean declared income per return / national mean),
joined to hexes via NUTS3 boundaries. Within one prefecture it is a constant —
it matters when a study compares sites across prefectures, and reports must
disclose both the resolution and the ~3-year data lag.

Sources: AADE annual statistics (public) · NUTS3 boundaries © EuroGeographics.
"""

from __future__ import annotations

import gzip
import json
from importlib import resources

import duckdb
from shapely import STRtree
from shapely.geometry import Point, shape

from panoptes.grid import Cell


def _load() -> tuple[STRtree, list[str], dict[str, float]]:
    data = resources.files("panoptes.data")
    with resources.as_file(data / "greece_nuts3.geojson.gz") as p:
        with gzip.open(p, "rt", encoding="utf-8") as f:
            geo = json.load(f)
    geoms, ids = [], []
    for feat in geo["features"]:
        geoms.append(shape(feat["geometry"]))
        ids.append(feat["properties"]["NUTS_ID"])
    with resources.as_file(data / "greece_income_2022.parquet") as p:
        rows = duckdb.connect().execute(f"SELECT nuts_id, income_index FROM '{p}'").fetchall()
    return STRtree(geoms), ids, {nid: idx for nid, idx in rows}


def assign_income(cells: dict[str, Cell]) -> int:
    """Set each hex's purchasing-power index from its prefecture.

    Hexes whose centroid falls outside every polygon (coastline simplification)
    fall back to the nearest one. Returns hexes matched directly (coverage).
    """
    tree, ids, index = _load()
    direct = 0
    points = {h: Point(c.lon, c.lat) for h, c in cells.items()}
    for h, pt in points.items():
        hits = tree.query(pt, predicate="within")
        if len(hits) > 0:
            cells[h].income_index = index.get(ids[hits[0]], 1.0)
            direct += 1
        else:
            nearest = tree.nearest(pt)
            cells[h].income_index = index.get(ids[nearest], 1.0) if nearest is not None else 1.0
    return direct
