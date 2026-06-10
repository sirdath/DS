from panoptes.config import BBox
from panoptes.grid import area_cells
from panoptes.ingest.population import assign_population


def test_athens_hexes_get_census_population():
    # central Athens — among the densest places in Greece
    area = BBox(min_lon=23.72, min_lat=37.97, max_lon=23.74, max_lat=37.99)
    cells = area_cells(area, resolution=9)
    covered = assign_population(cells)
    assert covered / len(cells) > 0.9  # nearly every central hex is populated
    assert max(c.population for c in cells.values()) > 5000  # dense urban core


def test_sea_hexes_get_zero():
    # open water between Aegina and Salamina — nobody lives there
    # (first attempt used a bbox that clipped Aegina's north coast: the grid
    # correctly returned Souvala's population. Geography 1, test author 0.)
    area = BBox(min_lon=23.45, min_lat=37.80, max_lon=23.47, max_lat=37.82)
    cells = area_cells(area, resolution=9)
    covered = assign_population(cells)
    assert covered == 0
