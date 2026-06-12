from panoptes.analysis import colocation_profile, opportunity_map
from panoptes.config import BBox, Weights
from panoptes.grid import area_cells, assign_places
from panoptes.ingest.overture import Place
from panoptes.score import score_cells


def _study_data():
    area = BBox(min_lon=23.72, min_lat=37.97, max_lon=23.76, max_lat=38.00)
    cells = area_cells(area, resolution=9)
    places = []
    # bakeries ALWAYS beside cafés (5 spots); pharmacies never near them
    for i, (lat, lon) in enumerate([(37.975, 23.73), (37.98, 23.735), (37.985, 23.74), (37.99, 23.745), (37.978, 23.75)]):
        places.append(Place(f"t{i}", "cafe", "cafe", lon, lat, 0.9))
        places.append(Place(f"b{i}", "bakery", "bakery", lon + 0.0005, lat, 0.9))
    for i in range(5):
        places.append(Place(f"p{i}", "pharmacy", "pharmacy", 23.7585, 37.9975 - i * 0.0001, 0.9))
    # background city: misc shops scattered on a grid, so "chance" has a real
    # baseline (without it, every non-empty neighbourhood is a café one and
    # lift degenerates toward 1)
    k = 0
    lon0, lat0 = 23.721, 37.971
    for r in range(9):
        for c in range(9):
            places.append(Place(f"m{k}", "shop", "clothing_store", lon0 + c * 0.004, lat0 + r * 0.003, 0.9))
            k += 1
    assign_places(cells, places, 9, ["cafe"], ["bakery"])
    return cells, places


def test_colocation_lift_finds_the_companion():
    _, places = _study_data()
    comps = colocation_profile(places, ["cafe"], 9, min_support=3)
    by_cat = {c.category: c for c in comps}
    assert "bakery" in by_cat and by_cat["bakery"].lift > 1.5
    assert "pharmacy" not in by_cat or by_cat["pharmacy"].lift < by_cat["bakery"].lift


def test_opportunity_flags_underserved_demand():
    cells, _ = _study_data()
    # a strong demand pocket with NO cafés: bakeries only, far from rivals
    extra = [Place(f"d{i}", "bakery", "bakery", 23.722, 37.9985 - i * 0.0001, 0.9) for i in range(12)]
    assign_places(cells, extra, 9, ["cafe"], ["bakery"])
    scores = score_cells(cells, Weights(demand_pop_share=0.0))  # POI-only demand for the synthetic case
    opps = opportunity_map(scores)
    ws = [h for h, o in opps.items() if o.white_space]
    assert len(ws) >= 1
    # the white-space hexes must have zero rivals
    assert all(scores[h].target_count == 0 for h in ws)


def test_analog_scores_rank_lookalikes_higher():
    from panoptes.analysis import analog_scores
    cells, places = _study_data()
    analogs = analog_scores(places, ["cafe"], 9, thriving_quantile=0.0)
    import h3
    near_cafes = analogs[h3.latlng_to_cell(37.98, 23.735, 9)]      # a thriving café spot
    pharmacy_corner = analogs[h3.latlng_to_cell(37.9975, 23.7585, 9)]  # the pharmacy cluster
    assert near_cafes > pharmacy_corner
