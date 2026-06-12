from panoptes.config import BBox
from panoptes.grid import area_cells
from panoptes.ingest.income import assign_income


def test_athens_centre_gets_above_average_index():
    area = BBox(min_lon=23.72, min_lat=37.97, max_lon=23.74, max_lat=37.99)
    cells = area_cells(area, resolution=9)
    matched = assign_income(cells)
    assert matched / len(cells) > 0.9
    idx = {round(c.income_index, 3) for c in cells.values()}
    # central Athens = Kentrikos Tomeas Athinon, mapped to the "Αθηνών" AADE row
    assert all(i > 1.2 for i in idx), idx


def test_rural_low_income_prefecture():
    # Pyrgos, Ileia — the lowest-income prefecture in the 2022 data
    area = BBox(min_lon=21.43, min_lat=37.66, max_lon=21.46, max_lat=37.69)
    cells = area_cells(area, resolution=9)
    assign_income(cells)
    idx = {round(c.income_index, 3) for c in cells.values()}
    assert all(i < 0.75 for i in idx), idx
