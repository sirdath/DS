"""Sector taxonomy — plain-language business sectors → a ready study profile.

A user says "gym" or "restaurant"; this maps that to the real Overture
category ids being placed (target), the categories that signal demand for that
specific sector (complements), and sector-appropriate scoring weights. The
weights encode retail-geography judgement: a gym lives off nearby residents
(population-heavy demand), a restaurant off foot traffic and the evening
economy (access-heavy, clustering-tolerant), a pharmacy off medical proximity
and catchment population.

Category ids are Overture flat leaf ids, verified against a 61,900-POI central-
Athens pull (June 2026). `drivers` and `clustering` feed the recommendation
rationale shown to the client.
"""

from __future__ import annotations

from dataclasses import dataclass, field


@dataclass(frozen=True)
class SectorProfile:
    key: str
    label: str
    aliases: tuple[str, ...]
    target_categories: tuple[str, ...]
    complement_categories: tuple[str, ...]
    # scoring weights for this sector's three pillars
    demand: float
    competition: float
    access: float
    # within demand: how much census purchasing-power matters vs POI buzz
    demand_pop_share: float
    # one line on what makes a location work for this sector (client-facing)
    drivers: str
    # does the sector benefit from clustering with rivals? (restaurants yes,
    # pharmacies no) — softens how the competition pillar is read in rationale
    clustering: bool = False
    extra: dict = field(default_factory=dict)


# ── The taxonomy. Seeded with grounded reference profiles across families;
#    expanded and domain-reviewed via the build workflow. ──────────────────────
SECTORS: dict[str, SectorProfile] = {
    "gym": SectorProfile(
        key="gym",
        label="Gym / fitness studio",
        aliases=("fitness", "fitness studio", "gymnasium", "fitness center", "γυμναστήριο"),
        target_categories=("gym", "gymnastics_center", "fitness_trainer", "sports_and_fitness_instruction"),
        complement_categories=(
            "health_food_store", "smoothie_juice_bar", "sporting_goods", "spas",
            "beauty_salon", "college_university", "corporate_office", "coworking_space",
        ),
        demand=1.2, competition=1.0, access=0.7, demand_pop_share=0.6,
        drivers="Members come from the surrounding residences and workplaces; "
                "affluent, health-conscious catchments with few nearby gyms win.",
        clustering=False,
    ),
    "restaurant": SectorProfile(
        key="restaurant",
        label="Restaurant",
        aliases=("eatery", "dining", "taverna", "εστιατόριο", "ταβέρνα"),
        target_categories=(
            "restaurant", "greek_restaurant", "italian_restaurant", "seafood_restaurant",
            "barbecue_restaurant", "pizza_restaurant",
        ),
        complement_categories=(
            "bar", "cocktail_bar", "cafe", "hotel", "hostel", "theatre",
            "public_plaza", "clothing_store", "shopping", "landmark_and_historical_building",
        ),
        demand=1.0, competition=0.6, access=1.1, demand_pop_share=0.3,
        drivers="Foot traffic, the evening economy and tourism drive covers; "
                "central, walkable spots near bars, hotels and culture do best. "
                "Restaurant rows help rather than hurt.",
        clustering=True,
    ),
    "cafe": SectorProfile(
        key="cafe",
        label="Café / coffee shop",
        aliases=("coffee", "coffee shop", "espresso bar", "καφετέρια", "καφέ"),
        target_categories=("cafe", "coffee_shop"),
        complement_categories=(
            "restaurant", "bar", "bakery", "bookstore", "college_university",
            "corporate_office", "coworking_space", "clothing_store", "shopping",
        ),
        demand=1.0, competition=0.8, access=0.9, demand_pop_share=0.4,
        drivers="A blend of residents, office workers and passers-by; works near "
                "workplaces, shopping and culture, but central Athens is saturated.",
        clustering=True,
    ),
    "pharmacy": SectorProfile(
        key="pharmacy",
        label="Pharmacy",
        aliases=("chemist", "drugstore", "φαρμακείο"),
        target_categories=("pharmacy",),
        complement_categories=(
            "doctor", "dentist", "medical_center", "hospital", "health_and_medical",
            "veterinarian", "eye_care_clinic", "supermarket",
        ),
        demand=1.2, competition=1.1, access=0.6, demand_pop_share=0.6,
        drivers="Serves a residential catchment and clusters around clinics and "
                "doctors; saturation matters (Greek pharmacies are density-regulated).",
        clustering=False,
    ),
    "beauty_salon": SectorProfile(
        key="beauty_salon",
        label="Beauty / hair salon",
        aliases=("salon", "hairdresser", "hair salon", "nail salon", "barber",
                 "κομμωτήριο", "ινστιτούτο ομορφιάς"),
        target_categories=("beauty_salon", "hair_salon", "nail_salon", "barber", "spas"),
        complement_categories=(
            "clothing_store", "womens_clothing_store", "shopping",
            "cosmetic_and_beauty_supplies", "cafe", "gym",
        ),
        demand=1.0, competition=0.8, access=0.8, demand_pop_share=0.5,
        drivers="Local, repeat clientele from the surrounding neighbourhood plus "
                "retail foot traffic; affluent residential streets convert best.",
        clustering=False,
    ),
    "supermarket": SectorProfile(
        key="supermarket",
        label="Supermarket / grocery",
        aliases=("grocery", "grocery store", "mini market", "σούπερ μάρκετ", "παντοπωλείο"),
        target_categories=("supermarket", "grocery_store"),
        complement_categories=(
            "bakery", "butcher_shop", "pharmacy", "banks", "convenience_store",
            "flowers_and_gifts_shop",
        ),
        demand=1.2, competition=1.0, access=1.0, demand_pop_share=0.7,
        drivers="A dense residential catchment with road access and parking; "
                "wins where people live, not where tourists pass.",
        clustering=False,
    ),
    "bar": SectorProfile(
        key="bar",
        label="Bar",
        aliases=("pub", "cocktail bar", "lounge", "μπαρ", "ποτάδικο"),
        target_categories=("bar", "cocktail_bar", "pub", "beer_bar", "lounge"),
        complement_categories=("restaurant", "greek_restaurant", "hotel", "music_venue", "dance_club", "cinema", "public_plaza", "fast_food_restaurant", "college_university"),
        demand=1, competition=0.6, access=1.1, demand_pop_share=0.25,
        drivers="Bars win on a dense, walkable nightlife strip with restaurants, hotels, clubs and late-crowd anchors that keep people out after dark.",
        clustering=True,
    ),
    "bakery": SectorProfile(
        key="bakery",
        label="Bakery",
        aliases=("bakery", "patisserie", "bread shop", "φούρνος", "αρτοποιείο"),
        target_categories=("bakery",),
        complement_categories=("supermarket", "grocery_store", "butcher_shop", "coffee_shop", "school", "elementary_school", "farmers_market", "convenience_store", "public_plaza"),
        demand=1.2, competition=1, access=0.8, demand_pop_share=0.6,
        drivers="Bakeries win on a dense residential catchment with daily-bread habits, a walk-by spot near homes, schools and grocery runs, and steady morning footfall.",
        clustering=False,
    ),
    "fast_food": SectorProfile(
        key="fast_food",
        label="Fast food (souvlaki / kebab / burger)",
        aliases=("souvlaki", "kebab shop", "burger joint", "σουβλατζίδικο", "ψητοπωλείο"),
        target_categories=("fast_food_restaurant", "doner_kebab", "burger_restaurant", "sandwich_shop", "chicken_restaurant"),
        complement_categories=("bar", "cocktail_bar", "cinema", "music_venue", "college_university", "high_school", "corporate_office", "stadium_arena", "public_plaza"),
        demand=1.1, competition=0.8, access=1.1, demand_pop_share=0.3,
        drivers="Quick-service grills run on high pass-by footfall and impulse hunger near bars, campuses, offices and venues, plus a visible, easy-to-reach corner spot.",
        clustering=True,
    ),
    "dessert_shop": SectorProfile(
        key="dessert_shop",
        label="Dessert shop (ice cream / patisserie)",
        aliases=("ice cream parlour", "patisserie", "gelateria", "ζαχαροπλαστείο", "παγωτατζίδικο"),
        target_categories=("desserts", "ice_cream_shop", "chocolatier", "cupcake_shop", "pancake_house"),
        complement_categories=("coffee_shop", "cafe", "restaurant", "park", "public_plaza", "cinema", "shopping_center", "hotel", "boutique"),
        demand=1, competition=0.8, access=1, demand_pop_share=0.35,
        drivers="Dessert shops feed off strolling leisure footfall — squares, seafronts, shopping streets and cinema nights — where a treat is an impulse stop, not a planned errand.",
        clustering=True,
    ),
    "wine_bar": SectorProfile(
        key="wine_bar",
        label="Wine bar",
        aliases=("enoteca", "wine cellar", "wine tasting bar", "οινοποιείο", "κάβα"),
        target_categories=("wine_bar", "winery"),
        complement_categories=("restaurant", "greek_restaurant", "seafood_restaurant", "hotel", "art_gallery", "boutique", "theatre", "cocktail_bar", "delicatessen"),
        demand=1, competition=0.7, access=1, demand_pop_share=0.3,
        drivers="Wine bars rely on an affluent, food-led evening district — fine restaurants, galleries, boutiques and hotels — that draws discerning drinkers willing to seek out a curated spot.",
        clustering=True,
    ),
    "dental_clinic": SectorProfile(
        key="dental_clinic",
        label="Dental clinic",
        aliases=("dentist", "dental practice", "orthodontist", "οδοντίατρος", "οδοντιατρείο"),
        target_categories=("dentist", "oral_surgeon"),
        complement_categories=("pharmacy", "medical_center", "health_and_medical", "doctor", "corporate_office", "supermarket", "elementary_school"),
        demand=1.2, competition=1, access=0.7, demand_pop_share=0.6,
        drivers="A dentist wins from an affluent residential or office catchment with few rival practices nearby, because patients pick one close to home or work and stay for years.",
        clustering=False,
    ),
    "medical_practice": SectorProfile(
        key="medical_practice",
        label="Medical practice (GP / doctor)",
        aliases=("doctor", "general practitioner", "GP", "γιατρός", "ιατρείο"),
        target_categories=("doctor", "medical_center", "health_and_medical"),
        complement_categories=("pharmacy", "hospital", "physical_therapy", "supermarket", "retirement_home", "corporate_office", "elementary_school"),
        demand=1.2, competition=0.9, access=0.7, demand_pop_share=0.65,
        drivers="A general practice lives off the residents around it, so denser, older, well-pharmacied neighbourhoods with a strong census catchment and easy walk-in access perform best.",
        clustering=False,
    ),
    "veterinary_clinic": SectorProfile(
        key="veterinary_clinic",
        label="Veterinary clinic",
        aliases=("vet", "veterinarian", "animal clinic", "κτηνίατρος", "κτηνιατρείο"),
        target_categories=("veterinarian",),
        complement_categories=("pet_store", "pet_groomer", "pet_services", "park", "supermarket", "grocery_store", "corporate_office"),
        demand=1.1, competition=0.9, access=0.7, demand_pop_share=0.65,
        drivers="Pet owners stay loyal to the vet near home, so affluent residential districts with high pet density, pet shops and parks nearby and few competing clinics win.",
        clustering=False,
    ),
    "optician": SectorProfile(
        key="optician",
        label="Optician / eyewear",
        aliases=("optometrist", "eyewear", "glasses shop", "οπτικά", "οπτικός"),
        target_categories=("eyewear_and_optician", "optometrist", "eye_care_clinic"),
        complement_categories=("pharmacy", "clothing_store", "shopping", "supermarket", "health_and_medical", "elementary_school", "retirement_home"),
        demand=1, competition=0.9, access=0.85, demand_pop_share=0.5,
        drivers="Eyewear is a considered purchase blending a local healthcare catchment with high-street footfall, so visible retail streets in a populous, ageing neighbourhood near pharmacies and shops do best.",
        clustering=False,
    ),
    "fashion_boutique": SectorProfile(
        key="fashion_boutique",
        label="Fashion boutique / clothing store",
        aliases=("clothing store", "apparel shop", "boutique", "ready-to-wear", "μπουτίκ", "κατάστημα ρούχων"),
        target_categories=("clothing_store", "womens_clothing_store", "mens_clothing_store", "boutique", "fashion"),
        complement_categories=("cafe", "shoe_store", "jewelry_store", "shopping_center", "department_store", "hotel", "public_plaza", "beauty_salon"),
        demand=1, competition=0.7, access=1.1, demand_pop_share=0.3,
        drivers="Discretionary, browse-led apparel spend converts best on a central, walkable high-street or shopping-district pitch with heavy strolling footfall near cafes, shoe shops and mall anchors.",
        clustering=True,
    ),
    "shoe_store": SectorProfile(
        key="shoe_store",
        label="Shoe store",
        aliases=("footwear shop", "shoe shop", "sneaker store", "κατάστημα υποδημάτων", "παπουτσίδικο"),
        target_categories=("shoe_store",),
        complement_categories=("clothing_store", "womens_clothing_store", "boutique", "shopping_center", "department_store", "cafe", "fashion_accessories_store", "public_plaza"),
        demand=1, competition=0.8, access=1.1, demand_pop_share=0.3,
        drivers="Footwear is comparison-shopped on foot, so a high-street or mall pitch beside clothing boutiques inside a walkable retail cluster converts best.",
        clustering=True,
    ),
    "jewelry_store": SectorProfile(
        key="jewelry_store",
        label="Jewellery store",
        aliases=("jeweller", "jewellery shop", "goldsmith", "watch and jewellery", "κοσμηματοπωλείο", "χρυσοχοείο"),
        target_categories=("jewelry_store",),
        complement_categories=("bridal_shop", "clothing_store", "boutique", "hotel", "cocktail_bar", "restaurant", "shopping_center", "public_plaza", "art_gallery"),
        demand=1, competition=0.7, access=1, demand_pop_share=0.25,
        drivers="High-value, considered and gift/tourism-led purchases favour prestigious high-street and luxury-district pitches near hotels, bridal shops and upscale dining.",
        clustering=True,
    ),
    "bridal_lingerie": SectorProfile(
        key="bridal_lingerie",
        label="Bridal & lingerie shop",
        aliases=("bridal shop", "wedding dress shop", "lingerie store", "underwear shop", "νυφικά", "εσώρουχα"),
        target_categories=("bridal_shop", "lingerie_store", "swimwear_store"),
        complement_categories=("jewelry_store", "flowers_and_gifts_shop", "beauty_salon", "hair_salon", "womens_clothing_store", "shoe_store", "hotel", "cafe"),
        demand=1, competition=0.7, access=1, demand_pop_share=0.35,
        drivers="Planned, appointment-led wedding and intimate-apparel purchases pull from a city-wide catchment, so a visible high-street pitch near jewellers, florists and bridal/beauty services wins.",
        clustering=True,
    ),
    "bookstore": SectorProfile(
        key="bookstore",
        label="Bookstore",
        aliases=("book shop", "stationery and books", "βιβλιοπωλείο", "second-hand books", "comic shop"),
        target_categories=("bookstore",),
        complement_categories=("college_university", "school", "library", "high_school", "language_school", "cafe", "coffee_shop", "art_gallery", "museum"),
        demand=1, competition=0.7, access=0.9, demand_pop_share=0.45,
        drivers="A bookstore wins where an educated, browsing crowd already gathers — beside universities, schools and libraries on a walkable street whose cafes keep people lingering.",
        clustering=True,
    ),
    "pet_store": SectorProfile(
        key="pet_store",
        label="Pet store",
        aliases=("pet shop", "pet supplies", "aquarium shop", "petshop", "κατάστημα κατοικιδίων", "ζωοτροφές"),
        target_categories=("pet_store",),
        complement_categories=("veterinarian", "pet_groomer", "pet_services", "park", "grocery_store", "supermarket", "convenience_store"),
        demand=1.1, competition=0.9, access=0.8, demand_pop_share=0.65,
        drivers="A pet store thrives in a dense residential neighbourhood thick with pet-owning households, beside a vet, a groomer and a park where owners already run their daily errands.",
        clustering=False,
    ),
    "florist": SectorProfile(
        key="florist",
        label="Florist",
        aliases=("flower shop", "flowers and gifts", "florist and gift shop", "ανθοπωλείο", "λουλούδια"),
        target_categories=("flowers_and_gifts_shop",),
        complement_categories=("bridal_shop", "hotel", "restaurant", "hospital", "medical_center", "cafe", "jewelry_store", "park"),
        demand=1, competition=0.8, access=0.9, demand_pop_share=0.4,
        drivers="A florist works on a high-footfall street near life-event anchors — bridal shops, hotels, restaurants and hospitals — where occasion and impulse gifting is constant rather than tied to who lives next door.",
        clustering=True,
    ),
    "electronics_store": SectorProfile(
        key="electronics_store",
        label="Electronics store",
        aliases=("mobile phone store", "computer shop", "consumer electronics", "tech store", "κατάστημα ηλεκτρονικών", "κινητά"),
        target_categories=("electronics", "mobile_phone_store", "computer_store", "it_service_and_computer_repair"),
        complement_categories=("shopping_center", "corporate_office", "college_university", "professional_services", "clothing_store", "hardware_store", "appliance_store"),
        demand=1.1, competition=0.8, access=1.1, demand_pop_share=0.4,
        drivers="An electronics store works as a comparison-shopping destination on a retail high street or near a shopping centre and offices, where buyers travel in deliberately and easy parking or transit makes a considered purchase convenient.",
        clustering=True,
    ),
    "hotel": SectorProfile(
        key="hotel",
        label="Hotel",
        aliases=("hotel", "boutique hotel", "guesthouse", "ξενοδοχείο", "πανσιόν", "κατάλυμα"),
        target_categories=("hotel", "resort", "bed_and_breakfast", "service_apartments", "holiday_rental_home"),
        complement_categories=("restaurant", "bar", "cafe", "museum", "theatre", "art_gallery", "public_plaza", "souvenir_shop", "travel_services"),
        demand=1, competition=0.6, access=1.2, demand_pop_share=0.25,
        drivers="Guests follow attractions, transport links and the evening economy, so central, walkable spots near culture, dining and nightlife fill the most rooms.",
        clustering=True,
    ),
    "coworking_or_office": SectorProfile(
        key="coworking_or_office",
        label="Coworking / office space",
        aliases=("coworking", "shared office", "serviced office", "flex office", "συνεργατικός χώρος", "γραφεία"),
        target_categories=("corporate_office", "professional_services"),
        complement_categories=("cafe", "coffee_shop", "restaurant", "it_service_and_computer_repair", "real_estate", "accountant", "lawyer", "bank_credit_union", "gym"),
        demand=1, competition=0.7, access=1.2, demand_pop_share=0.35,
        drivers="Members come from the surrounding professional ecosystem, so transit-rich business districts with cafes and services nearby fill desks fastest.",
        clustering=True,
    ),
    "laundromat": SectorProfile(
        key="laundromat",
        label="Laundromat / dry cleaner",
        aliases=("launderette", "self-service laundry", "dry cleaner", "πλυντήριο ρούχων", "καθαριστήριο", "στεγνοκαθαριστήριο"),
        target_categories=("laundromat", "dry_cleaning", "shoe_repair"),
        complement_categories=("supermarket", "convenience_store", "grocery_store", "cafe", "holiday_rental_home", "service_apartments", "college_university", "pharmacy"),
        demand=1.1, competition=1, access=0.6, demand_pop_share=0.65,
        drivers="A near-home convenience used by renters, flat-dwellers and students, so dense residential blocks with small homes and short-stay rentals convert best.",
        clustering=False,
    ),
    "tutoring": SectorProfile(
        key="tutoring",
        label="Tutoring / language school",
        aliases=("tutoring center", "language school", "cram school", "frontistirio", "φροντιστήριο", "σχολή ξένων γλωσσών"),
        target_categories=("tutoring_center", "language_school", "art_school", "music_school"),
        complement_categories=("elementary_school", "high_school", "preschool", "college_university", "bookstore", "library", "park", "cafe"),
        demand=1.2, competition=0.9, access=0.7, demand_pop_share=0.6,
        drivers="Enrolment comes from families with school-age children nearby, so catchments dense in households near schools with easy parental drop-off win.",
        clustering=False,
    ),
}


def _norm(s: str) -> str:
    return s.strip().lower().replace("-", " ").replace("_", " ")


def resolve_sector(query: str) -> SectorProfile | None:
    """Best-effort match of a free-text sector to a profile (key/label/alias,
    then substring)."""
    q = _norm(query)
    for p in SECTORS.values():
        if q == _norm(p.key) or q == _norm(p.label) or any(q == _norm(a) for a in p.aliases):
            return p
    # substring fallback: "open a coffee place" → cafe
    for p in SECTORS.values():
        haystack = [p.key, p.label, *p.aliases]
        if any(_norm(h) in q or q in _norm(h) for h in haystack):
            return p
    return None


def list_sectors() -> list[SectorProfile]:
    return list(SECTORS.values())


def _weights(p: SectorProfile):
    from panoptes.config import Weights

    return Weights(
        demand=p.demand, competition=p.competition, access=p.access,
        demand_pop_share=p.demand_pop_share,
    )


def study_from_sector(profile: SectorProfile, area, name: str | None = None, h3_resolution: int = 9):
    """Build a candidate-free StudyConfig for a sector over an area — the input
    to a `recommend` run."""
    from panoptes.config import StudyConfig

    return StudyConfig(
        name=name or f"{profile.label} study",
        area=area,
        sector=profile.key,
        target_categories=list(profile.target_categories),
        complement_categories=list(profile.complement_categories),
        weights=_weights(profile),
        h3_resolution=h3_resolution,
    )


def apply_sector(cfg):
    """If a study YAML names a sector, fill any unset target/complement
    categories and default weights from its profile. Explicit values win."""
    from panoptes.config import StudyConfig, Weights

    if not cfg.sector:
        return cfg
    p = resolve_sector(cfg.sector)
    if p is None:
        raise ValueError(f"unknown sector '{cfg.sector}' — run `panoptes sectors`")
    data = cfg.model_dump()
    if not data["target_categories"]:
        data["target_categories"] = list(p.target_categories)
    if not data["complement_categories"]:
        data["complement_categories"] = list(p.complement_categories)
    if cfg.weights == Weights():  # untouched defaults → use the sector's
        data["weights"] = _weights(p).model_dump()
    return StudyConfig.model_validate(data)
