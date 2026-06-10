"""Study report: an interactive heat map + ranked candidates, one HTML file.

Self-contained output (folium/Leaflet inlined) so it can be emailed or dropped
into the DS2 portal as a deliverable without any hosting.
"""

from __future__ import annotations

from pathlib import Path

import folium

from panoptes.config import StudyConfig
from panoptes.score import CandidateResult, CellScore

_ATTRIBUTION = (
    "Data: Overture Maps Foundation (CDLA-Permissive 2.0) · © European Union, Eurostat census grid 2021 · "
    "Analysis: DS2 Panoptes v0.1 — scores are model output, shown with inputs; "
    "read with the accompanying notes."
)


def _colour(total: float) -> str:
    """Score → colour ramp (cold slate → DS2 blue → hot cyan)."""
    if total >= 80:
        return "#22d3ee"
    if total >= 60:
        return "#2563eb"
    if total >= 40:
        return "#1d4ed8"
    if total >= 20:
        return "#1e3a8a"
    return "#1f2937"


def render(
    config: StudyConfig,
    cell_scores: dict[str, CellScore],
    candidates: list[CandidateResult],
    out_path: str | Path,
) -> Path:
    centre_lat = (config.area.min_lat + config.area.max_lat) / 2
    centre_lon = (config.area.min_lon + config.area.max_lon) / 2
    m = folium.Map(location=[centre_lat, centre_lon], zoom_start=14, tiles="cartodbdark_matter")

    import h3  # local import keeps folium-free callers light

    for s in cell_scores.values():
        if s.total <= 0:
            continue
        boundary = [(lat, lon) for lat, lon in h3.cell_to_boundary(s.h3_id)]
        folium.Polygon(
            locations=boundary,
            color=_colour(s.total),
            weight=0.5,
            fill=True,
            fill_color=_colour(s.total),
            fill_opacity=0.35,
            tooltip=(
                f"score {s.total} · demand {s.demand} · "
                f"competition {s.competition} · access {s.access} · "
                f"rivals here: {s.target_count} · pop/km²: {s.population}"
            ),
        ).add_to(m)

    for rank, c in enumerate(candidates, start=1):
        folium.Marker(
            location=[c.lat, c.lon],
            tooltip=f"#{rank} {c.name} — score {c.score.total}",
            icon=folium.Icon(color="lightblue" if rank == 1 else "gray", icon="star"),
        ).add_to(m)

    title = (
        f'<div style="position:fixed;top:12px;left:60px;z-index:1000;'
        f"background:rgba(10,13,15,0.85);color:#e5e7eb;padding:10px 16px;"
        f'border-radius:10px;font-family:system-ui;max-width:520px">'
        f"<b>Panoptes · {config.name}</b><br>"
        f'<span style="font-size:12px;color:#9ca3af">{_ATTRIBUTION}</span></div>'
    )
    m.get_root().html.add_child(folium.Element(title))

    out = Path(out_path)
    out.parent.mkdir(parents=True, exist_ok=True)
    m.save(str(out))
    return out
