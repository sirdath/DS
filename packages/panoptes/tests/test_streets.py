from panoptes.config import BBox, Weights
from panoptes.grid import area_cells, assign_places
from panoptes.ingest.overture import Place
from panoptes.score import score_cells


def test_access_override_changes_access_scores():
    area = BBox(min_lon=23.72, min_lat=37.97, max_lon=23.74, max_lat=37.99)
    cells = area_cells(area, resolution=9)
    places = [Place(str(i), "shop", "shopping", 23.73, 37.98, 0.9) for i in range(5)]
    assign_places(cells, places, 9, ["cafe"], ["shopping"])
    ids = list(cells)
    override = {h: float(i) for i, h in enumerate(ids)}  # strictly increasing
    scored = score_cells(cells, Weights(), access_override=override)
    assert scored[ids[-1]].access == 100.0
    assert scored[ids[0]].access == 0.0


def test_empty_override_falls_back_to_proxy():
    area = BBox(min_lon=23.72, min_lat=37.97, max_lon=23.74, max_lat=37.99)
    cells = area_cells(area, resolution=9)
    places = [Place(str(i), "shop", "shopping", 23.73, 37.98, 0.9) for i in range(5)]
    assign_places(cells, places, 9, ["cafe"], ["shopping"])
    a = score_cells(cells, Weights(), access_override=None)
    b = score_cells(cells, Weights(), access_override={})
    # {} is falsy -> callers pass None; both paths must use the proxy identically
    assert {h: s.access for h, s in a.items()} == {h: s.access for h, s in b.items()}
