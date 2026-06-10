"""Population layer — Eurostat 2021 census grid, Greece extract.

The bundled parquet (94 KB) holds every populated 1 km cell in Greece from the
official EU 2021 census grid (ESTAT DF_CENSUS_GRID_2021 v2.2; extract sums to
10,443,890 — the census total). Each H3 hex inherits the population of the
1 km cell containing its centroid: at res 9 a hex is ~30× smaller than the
cell, so this reads as "people per km² around here" — a density context, and
honest about its 1 km resolution.

Free to reuse with attribution (© European Union, Eurostat / GISCO).
"""

from __future__ import annotations

from importlib import resources

import duckdb
from pyproj import Transformer

from panoptes.grid import Cell

# WGS84 lon/lat → ETRS89-LAEA (EPSG:3035), the grid's CRS. Grid ids are the
# lower-left corner of 1 km squares: N{floor(y/1000)*1000} E{floor(x/1000)*1000}.
_TO_3035 = Transformer.from_crs("EPSG:4326", "EPSG:3035", always_xy=True)


def _load_grid() -> dict[tuple[int, int], int]:
    data_path = resources.files("panoptes.data") / "greece_census_grid_2021.parquet"
    with resources.as_file(data_path) as p:
        rows = duckdb.connect().execute(
            f"SELECT n_min, e_min, pop FROM '{p}'"
        ).fetchall()
    return {(n, e): pop for n, e, pop in rows}


def assign_population(cells: dict[str, Cell]) -> int:
    """Set each hex's population from its containing census cell.

    Returns the number of hexes that landed in a populated cell (coverage
    signal for the CLI — zero means the study area is outside Greece or the
    extract is broken, and the report must not pretend otherwise).
    """
    grid = _load_grid()
    covered = 0
    for cell in cells.values():
        x, y = _TO_3035.transform(cell.lon, cell.lat)
        key = (int(y // 1000) * 1000, int(x // 1000) * 1000)
        pop = grid.get(key, 0)
        cell.population = float(pop)
        if pop > 0:
            covered += 1
    return covered
