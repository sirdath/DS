import pytest

from panoptes.gazetteer import list_areas, parse_bbox, resolve_area


def test_resolve_known_area():
    bb = resolve_area("athens-center")
    assert bb is not None and bb.min_lon < bb.max_lon and bb.min_lat < bb.max_lat


def test_resolve_unknown_area():
    assert resolve_area("atlantis") is None


def test_parse_bbox_roundtrip():
    bb = parse_bbox("23.71,37.96,23.75,37.99")
    assert bb.min_lon == 23.71 and bb.max_lat == 37.99


def test_parse_bbox_rejects_malformed():
    with pytest.raises(ValueError):
        parse_bbox("1,2,3")


def test_list_areas_nonempty():
    assert "glyfada" in list_areas()
