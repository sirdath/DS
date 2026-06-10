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


class Weights(BaseModel):
    """Relative importance of each scoring pillar (normalised at runtime)."""

    demand: float = 1.0
    competition: float = 1.0
    access: float = 1.0


class StudyConfig(BaseModel):
    """Everything a study run needs."""

    name: str
    area: BBox
    # Overture category ids for the business being placed (flat leaf ids,
    # e.g. ["cafe", "coffee_shop"] — check a category histogram for your area).
    target_categories: list[str]
    # Categories whose presence signals demand (anchors / complements).
    complement_categories: list[str] = Field(default_factory=list)
    candidates: list[Candidate] = Field(default_factory=list)
    weights: Weights = Field(default_factory=Weights)
    # H3 resolution: 9 ≈ 175m hexes (street-level), 8 ≈ 460m (district-level).
    h3_resolution: int = 9
    overture_release: str = "2026-05-20.0"

    @classmethod
    def from_yaml(cls, path: str | Path) -> "StudyConfig":
        with open(path, encoding="utf-8") as f:
            return cls.model_validate(yaml.safe_load(f))
