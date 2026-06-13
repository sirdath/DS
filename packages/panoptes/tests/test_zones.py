from panoptes.ingest.overture import Place
from panoptes.zones import zone_map


def _two_district_city():
    # food district (SW block) vs clothing district (NE block), tight at hex scale
    places = []
    i = 0
    for r in range(4):
        for c in range(4):
            for cat in ("cafe", "restaurant", "bar"):
                places.append(Place(f"f{i}", cat, cat, 23.722 + c * 0.0012, 37.972 + r * 0.001, 0.9))
                i += 1
    for r in range(4):
        for c in range(4):
            for cat in ("clothing_store", "shoe_store", "jewelry_store"):
                places.append(Place(f"s{i}", cat, cat, 23.752 + c * 0.0012, 37.995 + r * 0.001, 0.9))
                i += 1
    return places


def test_zone_map_separates_districts_and_labels_them():
    zr = zone_map(_two_district_city(), 9, k=2, min_count=3)
    assert zr.assignments and len(zr.labels) == 2
    # the two planted districts must not share a zone
    food_zone = {z for h, z in zr.assignments.items()
                 if any(lbl in zr.labels[z] for lbl in ("cafe", "restaurant", "bar"))}
    cloth_zone = {z for h, z in zr.assignments.items()
                  if any(lbl in zr.labels[z] for lbl in ("clothing_store", "shoe_store", "jewelry_store"))}
    assert food_zone and cloth_zone and food_zone != cloth_zone
    labels = " ".join(zr.labels.values())
    assert ("cafe" in labels or "restaurant" in labels) and ("clothing_store" in labels or "shoe_store" in labels)


def test_zone_map_deterministic():
    a = zone_map(_two_district_city(), 9, k=2, min_count=3)
    b = zone_map(_two_district_city(), 9, k=2, min_count=3)
    assert a.assignments == b.assignments and a.labels == b.labels
