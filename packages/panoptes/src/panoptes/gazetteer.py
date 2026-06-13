"""Named areas → bounding boxes, so a user can say `--area glyfada` instead of
typing coordinates. Boxes are deliberately modest (a few km²) to keep a study
fast; pass `--bbox minlon,minlat,maxlon,maxlat` for anything not listed.
"""

from __future__ import annotations

from panoptes.config import BBox

AREAS: dict[str, BBox] = {
    "athens-center": BBox(min_lon=23.715, min_lat=37.960, max_lon=23.755, max_lat=37.990),
    "athens": BBox(min_lon=23.690, min_lat=37.940, max_lon=23.790, max_lat=38.010),
    "glyfada": BBox(min_lon=23.735, min_lat=37.850, max_lon=23.775, max_lat=37.880),
    "kifisia": BBox(min_lon=23.795, min_lat=38.060, max_lon=23.830, max_lat=38.090),
    "piraeus": BBox(min_lon=23.620, min_lat=37.925, max_lon=23.665, max_lat=37.955),
    "thessaloniki": BBox(min_lon=22.920, min_lat=40.615, max_lon=22.970, max_lat=40.650),
}


def resolve_area(name: str) -> BBox | None:
    key = name.strip().lower().replace("_", "-")
    return AREAS.get(key)


def parse_bbox(s: str) -> BBox:
    """Parse 'minlon,minlat,maxlon,maxlat'."""
    parts = [float(x) for x in s.split(",")]
    if len(parts) != 4:
        raise ValueError("bbox must be minlon,minlat,maxlon,maxlat")
    return BBox(min_lon=parts[0], min_lat=parts[1], max_lon=parts[2], max_lat=parts[3])


def list_areas() -> list[str]:
    return list(AREAS.keys())
