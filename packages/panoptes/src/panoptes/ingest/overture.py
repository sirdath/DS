"""Overture Maps Places ingestion.

Pulls POIs for a bounding box straight from Overture's public GeoParquet on S3
via DuckDB — no API key, no full download; the parquet is partitioned so a
bbox query reads only the row groups it needs. License: CDLA-Permissive 2.0
(storable, commercial use fine; keep attribution in reports).
"""

from __future__ import annotations

from dataclasses import dataclass

import duckdb

from panoptes.config import BBox

_S3_TEMPLATE = (
    "s3://overturemaps-us-west-2/release/{release}/theme=places/type=place/*"
)


@dataclass(frozen=True)
class Place:
    """One POI, flattened to what scoring needs."""

    id: str
    name: str
    category: str
    lon: float
    lat: float
    confidence: float


def _connect() -> duckdb.DuckDBPyConnection:
    con = duckdb.connect()
    con.execute("INSTALL httpfs; LOAD httpfs;")
    con.execute("INSTALL spatial; LOAD spatial;")
    # Anonymous access to the public bucket; patient settings because S3 over
    # residential connections occasionally stalls (seen in the field).
    con.execute("SET s3_region='us-west-2';")
    con.execute("SET http_timeout=120000;")
    con.execute("SET http_retries=4;")
    return con


def fetch_places(area: BBox, release: str, min_confidence: float = 0.3) -> list[Place]:
    """All Overture places inside the bbox, with primary category."""
    con = _connect()
    rows = con.execute(
        f"""
        SELECT
            id,
            COALESCE(names.primary, '') AS name,
            COALESCE(categories.primary, 'unknown') AS category,
            ST_X(geometry) AS lon,
            ST_Y(geometry) AS lat,
            COALESCE(confidence, 0.0) AS confidence
        FROM read_parquet('{_S3_TEMPLATE.format(release=release)}', hive_partitioning=1)
        WHERE bbox.xmin >= ? AND bbox.xmax <= ?
          AND bbox.ymin >= ? AND bbox.ymax <= ?
          AND COALESCE(confidence, 0.0) >= ?
        """,
        [area.min_lon, area.max_lon, area.min_lat, area.max_lat, min_confidence],
    ).fetchall()
    return [Place(*row) for row in rows]
