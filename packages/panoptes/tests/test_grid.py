from panoptes.config import BBox
from panoptes.grid import area_cells, assign_places, _matches
from panoptes.ingest.overture import Place


def test_category_set_matching():
    wanted = {"cafe", "coffee_shop"}
    assert _matches("cafe", wanted)
    assert _matches("coffee_shop", wanted)
    assert not _matches("cafeteria", wanted)


def test_grid_assign_counts_target_and_complements():
    area = BBox(min_lon=23.72, min_lat=37.97, max_lon=23.74, max_lat=37.99)
    cells = area_cells(area, resolution=9)
    assert len(cells) > 20  # this ~3.7 km² bbox is ~32 hexes at res 9

    places = [
        Place("1", "Cafe A", "cafe", 23.73, 37.98, 0.9),
        Place("2", "Shop B", "shopping", 23.73, 37.98, 0.9),
        Place("3", "Outside", "cafe", 23.50, 37.50, 0.9),
    ]
    assign_places(cells, places, 9, ["cafe"], ["shopping"])
    assert sum(c.target_count for c in cells.values()) == 1
    assert sum(c.complement_count for c in cells.values()) == 1
    assert sum(c.total_pois for c in cells.values()) == 2
