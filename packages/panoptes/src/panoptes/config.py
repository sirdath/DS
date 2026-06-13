"""Study configuration — the single input to a Panoptes run.

A study is one engagement: an area, a business category, optional candidate
sites, and scoring weights. Loaded from YAML (see study.example.yaml).
"""

from __future__ import annotations

from pathlib import Path

import yaml
from pydantic import BaseModel, Field, model_validator


class BBox(BaseModel):
    """Geographic bounding box, WGS84."""

    min_lon: float
    min_lat: float
    max_lon: float
    max_lat: float

    @model_validator(mode="after")
    def _sane(self) -> "BBox":
        if self.min_lon >= self.max_lon or self.min_lat >= self.max_lat:
            raise ValueError("bbox min must be < max on both axes")
        return self


class Candidate(BaseModel):
    """A candidate site the client is considering."""

    name: str
    lat: float
    lon: float


class LocalFactor(BaseModel):
    """Analyst-entered local knowledge the open data cannot see (crime levels,
    planned works, a metro opening). Applied as a transparent score adjustment
    within radius_m of the point; always labelled as judgement in the report,
    never blended invisibly into the data-driven pillars."""

    name: str
    lat: float
    lon: float
    radius_m: float = 500.0
    adjustment: float  # score points, e.g. -12 or +8 (clamped to ±25)
    note: str = ""


class Weights(BaseModel):
    """Relative importance of each scoring pillar (normalised at runtime)."""

    demand: float = 1.0
    competition: float = 1.0
    access: float = 1.0
    # Inside the demand pillar: how much weight census population carries
    # versus complement-POI gravity (0 = POIs only, 1 = population only).
    demand_pop_share: float = 0.4


class StudyConfig(BaseModel):
    """Everything a study run needs."""

    name: str
    area: BBox
    # Optional sector key (e.g. "gym", "restaurant"); when set, the engine
    # fills target/complement categories and weights from the sector profile
    # unless they are given explicitly here.
    sector: str | None = None
    # Overture category ids for the business being placed (flat leaf ids,
    # e.g. ["cafe", "coffee_shop"] — check a category histogram for your area).
    target_categories: list[str] = Field(default_factory=list)
    # Categories whose presence signals demand (anchors / complements).
    complement_categories: list[str] = Field(default_factory=list)
    candidates: list[Candidate] = Field(default_factory=list)
    local_factors: list[LocalFactor] = Field(default_factory=list)
    weights: Weights = Field(default_factory=Weights)
    # H3 resolution: 9 ≈ 175m hexes (street-level), 8 ≈ 460m (district-level).
    h3_resolution: int = 9
    overture_release: str = "2026-05-20.0"

    @classmethod
    def from_yaml(cls, path: str | Path) -> "StudyConfig":
        with open(path, encoding="utf-8") as f:
            return cls.model_validate(yaml.safe_load(f))
