from panoptes.config import BBox, StudyConfig
from panoptes.sectors import SECTORS, apply_sector, resolve_sector, study_from_sector

AREA = BBox(min_lon=23.72, min_lat=37.97, max_lon=23.74, max_lat=37.99)


def test_resolve_by_key_alias_greek_and_substring():
    assert resolve_sector("gym").key == "gym"
    assert resolve_sector("fitness").key == "gym"
    assert resolve_sector("γυμναστήριο").key == "gym"
    assert resolve_sector("coffee").key == "cafe"
    assert resolve_sector("we want to open a pharmacy downtown").key == "pharmacy"
    assert resolve_sector("nonsense xyzzy") is None


def test_study_from_sector_fills_categories_and_weights():
    cfg = study_from_sector(SECTORS["restaurant"], AREA)
    assert "restaurant" in cfg.target_categories
    assert cfg.sector == "restaurant"
    assert cfg.weights.access == 1.1
    assert cfg.candidates == []


def test_apply_sector_fills_empty_but_respects_explicit():
    cfg = StudyConfig(name="x", area=AREA, sector="gym")
    out = apply_sector(cfg)
    assert "gym" in out.target_categories
    assert out.weights.demand == 1.2
    # explicit categories win over the sector default
    cfg2 = StudyConfig(name="x", area=AREA, sector="gym", target_categories=["yoga_studio"])
    assert apply_sector(cfg2).target_categories == ["yoga_studio"]


def test_apply_sector_noop_without_sector():
    cfg = StudyConfig(name="x", area=AREA, target_categories=["cafe"])
    assert apply_sector(cfg).target_categories == ["cafe"]


def test_every_profile_is_well_formed():
    for p in SECTORS.values():
        assert p.target_categories, p.key
        assert 0.0 <= p.demand_pop_share <= 1.0, p.key
        assert all(0.4 <= w <= 1.4 for w in (p.demand, p.competition, p.access)), p.key
        assert p.drivers and isinstance(p.clustering, bool)
