"""H3 hex grid over the study area + per-cell POI aggregation.

The grid is the unit of analysis: every score is computed per hex, then
candidates inherit the scores of the hexes around them.
"""

from __future__ import annotations

from collections import Counter
from dataclasses import dataclass, field

import h3

from panoptes.config import BBox
from panoptes.ingest.overture import Place


@dataclass
class Cell:
    """One H3 hex with its POI makeup."""

    h3_id: str
    lat: float
    lon: float
    target_count: int = 0
    complement_count: int = 0
    total_pois: int = 0
    population: float = 0.0
    income_index: float = 1.0
    categories: Counter = field(default_factory=Counter)


def area_cells(area: BBox, resolution: int) -> dict[str, Cell]:
    """Every H3 cell whose centre falls inside the bbox."""
    poly = h3.LatLngPoly(
        [
            (area.min_lat, area.min_lon),
            (area.min_lat, area.max_lon),
            (area.max_lat, area.max_lon),
            (area.max_lat, area.min_lon),
        ]
    )
    cells: dict[str, Cell] = {}
    for h in h3.polygon_to_cells(poly, resolution):
        lat, lon = h3.cell_to_latlng(h)
        cells[h] = Cell(h3_id=h, lat=lat, lon=lon)
    return cells


def _matches(category: str, wanted: set[str]) -> bool:
    """Overture `categories.primary` is a flat leaf id ("cafe", "coffee_shop"),
    so matching is exact membership against the configured id set."""
    return category in wanted


def assign_places(
    cells: dict[str, Cell],
    places: list[Place],
    resolution: int,
    target_categories: list[str],
    complement_categories: list[str],
) -> None:
    """Bucket each place into its hex and tally target/complement counts."""
    targets, complements = set(target_categories), set(complement_categories)
    for p in places:
        h = h3.latlng_to_cell(p.lat, p.lon, resolution)
        cell = cells.get(h)
        if cell is None:
            continue  # place sits just outside the bbox-clipped grid
        cell.total_pois += 1
        cell.categories[p.category] += 1
        if _matches(p.category, targets):
            cell.target_count += 1
        if _matches(p.category, complements):
            cell.complement_count += 1
