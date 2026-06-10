from panoptes.config import BBox, Candidate, Weights
from panoptes.grid import area_cells, assign_places
from panoptes.ingest.overture import Place
from panoptes.score import score_cells, score_candidates


def test_scoring_prefers_demand_and_penalises_rivals():
    area = BBox(min_lon=23.72, min_lat=37.97, max_lon=23.74, max_lat=37.99)
    cells = area_cells(area, resolution=9)
    # demand cluster at (37.98, 23.73); rival cluster at (37.975, 23.735)
    places = [Place(str(i), "shop", "shopping", 23.73, 37.98, 0.9) for i in range(10)]
    places += [Place(f"r{i}", "rival", "cafe", 23.735, 37.975, 0.9) for i in range(10)]
    assign_places(cells, places, 9, ["cafe"], ["shopping"])
    scores = score_cells(cells, Weights())

    ranked = score_candidates(
        [
            Candidate(name="demand-spot", lat=37.98, lon=23.73),
            Candidate(name="rival-spot", lat=37.975, lon=23.735),
        ],
        scores,
        resolution=9,
    )
    assert [r.name for r in ranked] == ["demand-spot", "rival-spot"]
