"""Street-network access — cityseer centrality aggregated to hexes.

The access pillar's proper form: download the OSM street network for the study
area (Overpass), compute gravity-weighted closeness centrality at a walkable
threshold on the network's nodes, and average node centrality per H3 hex.
A hex scores high when the street structure concentrates reachable activity
around it — real network structure, not the POI-diversity proxy.

Network fetch needs the internet and Overpass goodwill; callers treat an empty
result as "fall back to the proxy" and the report discloses which one ran.
"""

from __future__ import annotations

import logging

import h3

from panoptes.config import BBox

logger = logging.getLogger(__name__)

_WALK_DISTANCE = 800  # metres — comfortable walk


def hex_centrality(area: BBox, resolution: int) -> dict[str, float]:
    """Mean node closeness centrality per hex; {} on any failure."""
    try:
        import os

        os.environ.setdefault("TQDM_DISABLE", "1")  # silence cityseer progress bars
        from shapely.geometry import box as shapely_box

        from cityseer.metrics import networks
        from cityseer.tools import io

        poly = shapely_box(area.min_lon, area.min_lat, area.max_lon, area.max_lat)

        # overpass-api.de answers 406 to python-requests' default User-Agent;
        # cityseer hardcodes both the endpoint and a bare requests.get, so we
        # inject a proper UA for the duration of the fetch (verified: same
        # query 406 -> 200 with a UA set).
        real_get = io.requests.get

        def _ua_get(*args: object, **kwargs: object):  # type: ignore[no-untyped-def]
            headers = dict(kwargs.pop("headers", None) or {})  # type: ignore[arg-type]
            headers.setdefault("User-Agent", "panoptes-ds2/0.2 (+https://github.com/sirdath/DS)")
            return real_get(*args, headers=headers, **kwargs)  # type: ignore[arg-type]

        io.requests.get = _ua_get
        try:
            G = io.osm_graph_from_poly(poly, simplify=True)
        finally:
            io.requests.get = real_get
        nodes_gdf, _edges_gdf, structure = io.network_structure_from_nx(G)
        nodes_gdf = networks.node_centrality_shortest(
            structure, nodes_gdf, distances=[_WALK_DISTANCE]
        )
        # column names vary slightly across versions — pick by prefix
        col = next(
            (c for c in nodes_gdf.columns if c.startswith("cc_harmonic")),
            None,
        ) or next((c for c in nodes_gdf.columns if c.startswith("cc_beta")), None)
        if col is None:
            logger.warning("cityseer centrality columns not found: %s", list(nodes_gdf.columns))
            return {}

        # nodes are in a projected CRS; go back to WGS84 for hex assignment
        wgs = nodes_gdf.to_crs(4326)
        sums: dict[str, float] = {}
        counts: dict[str, int] = {}
        for geom, value in zip(wgs.geometry, nodes_gdf[col]):
            if geom is None or value != value:  # NaN guard
                continue
            hex_id = h3.latlng_to_cell(geom.y, geom.x, resolution)
            sums[hex_id] = sums.get(hex_id, 0.0) + float(value)
            counts[hex_id] = counts.get(hex_id, 0) + 1
        return {h: sums[h] / counts[h] for h in sums}
    except Exception as exc:  # network down, Overpass refusal, API drift
        logger.warning("street network unavailable, falling back to proxy: %s", exc)
        return {}
