from types import SimpleNamespace

import h3

from panoptes.analysis import Opportunity
from panoptes.config import BBox
from panoptes.grid import area_cells
from panoptes.recommend import recommend_areas
from panoptes.score import CellScore
from panoptes.sectors import SECTORS
from panoptes.zones import ZoneResult


def _artifacts():
    area = BBox(min_lon=23.72, min_lat=37.97, max_lon=23.74, max_lat=37.99)
    cells = area_cells(area, 9)
    ids = list(cells)
    seed = ids[len(ids) // 2]
    good = {seed} | (set(h3.grid_disk(seed, 1)) & set(ids))

    cell_scores, opps, analogs = {}, {}, {}
    for h, c in cells.items():
        hi = h in good
        cell_scores[h] = CellScore(
            h3_id=h, lat=c.lat, lon=c.lon,
            demand=70.0 if hi else 30.0, competition=75.0 if hi else 40.0,
            access=72.0 if hi else 35.0, total=80.0 if hi else 30.0,
            target_count=0 if hi else 1, complement_count=5 if hi else 1,
            population=5000 if hi else 1000, adjustments=[],
        )
        opps[h] = Opportunity(h3_id=h, opportunity=40.0 if hi else -10.0, white_space=hi)
        analogs[h] = 85.0 if hi else 40.0
    zones = ZoneResult(assignments={h: 0 for h in cells},
                       labels={0: "cafe · bar · hotel"}, sizes={0: len(cells)})
    return SimpleNamespace(cell_scores=cell_scores, opportunities=opps, analogs=analogs, zones=zones)


def test_recommend_clusters_the_good_area_with_reasons():
    recs = recommend_areas(_artifacts(), sector=SECTORS["gym"], top_n=3, geocode=False)
    assert recs
    top = recs[0]
    assert top.score >= 70.0          # surfaced the high-scoring cluster
    assert top.hex_count >= 3         # grouped the contiguous hexes
    assert top.white_space            # carried the white-space flag
    assert top.reasons                # generated rationale
    assert any("demand" in r.lower() or "white-space" in r.lower() for r in top.reasons)


def test_geocode_off_falls_back_to_coordinates():
    recs = recommend_areas(_artifacts(), sector=None, top_n=1, geocode=False)
    assert "," in recs[0].area_name   # "lat, lon"


def test_empty_grid_returns_nothing():
    art = SimpleNamespace(cell_scores={}, opportunities={}, analogs={}, zones=ZoneResult({}, {}, {}))
    assert recommend_areas(art, sector=None) == []
