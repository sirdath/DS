"""Build the bundled income layer from source files (reproducible, run rarely).

Inputs (download first — see commands at the bottom of this docstring):
  /tmp/aade2022.xlsx   AADE annual statistics, natural persons, tax year 2022
                       https://www.aade.gr/sites/default/files/2024-05/SD_FP_22F_3.xlsx
  /tmp/nuts3m.geojson  GISCO NUTS3 2024 boundaries, 1:3M, EPSG:4326
                       https://gisco-services.ec.europa.eu/distribution/v2/nuts/geojson/NUTS_RG_03M_2024_4326_LEVL_3.geojson

Outputs (committed with the package):
  src/panoptes/data/greece_income_2022.parquet   nuts_id · name · mean_income · income_index
  src/panoptes/data/greece_nuts3.geojson.gz      Greek NUTS3 geometries (id + geometry only)

Verified empirically (June 2026): AADE publishes income per prefecture (Π22),
NOT per postal code — the finest open geography for declared income in Greece.
Tax year 2022 is the latest published; the ~3-year lag is disclosed in reports.
"""

from __future__ import annotations

import gzip
import json
from pathlib import Path

import duckdb
import openpyxl

ROOT = Path(__file__).parent.parent

# NUTS3 (2024) → AADE Π22 row name(s). Merged NUTS3 units sum their prefectures;
# the four Athens sectors share the single AADE "Αθηνών" row.
NUTS_TO_AADE: dict[str, list[str]] = {
    "EL301": ["Αθηνών"], "EL302": ["Αθηνών"], "EL303": ["Αθηνών"], "EL304": ["Αθηνών"],
    "EL305": ["Ανατολικής Αττικής"], "EL306": ["Δυτικής Αττικής"], "EL307": ["Πειραιώς"],
    "EL411": ["Λέσβου"], "EL412": ["Σάμου"], "EL413": ["Χίου"],
    "EL421": ["Δωδεκανήσου"], "EL422": ["Κυκλάδων"],
    "EL431": ["Ηρακλείου"], "EL432": ["Λασιθίου"], "EL433": ["Ρεθύμνης"], "EL434": ["Χανίων"],
    "EL511": ["Έβρου"], "EL512": ["Ξάνθης"], "EL513": ["Ροδόπης"], "EL514": ["Δράμας"],
    "EL515": ["Καβάλας"],
    "EL521": ["Ημαθίας"], "EL522": ["Θεσσαλονίκης"], "EL523": ["Κιλκίς"], "EL524": ["Πέλλης"],
    "EL525": ["Πιερίας"], "EL526": ["Σερρών"], "EL527": ["Χαλκιδικής"],
    "EL531": ["Γρεβενών", "Κοζάνης"], "EL532": ["Καστοριάς"], "EL533": ["Φλωρίνης"],
    "EL541": ["Άρτας", "Πρεβέζης"], "EL542": ["Θεσπρωτίας"], "EL543": ["Ιωαννίνων"],
    "EL611": ["Καρδίτσης", "Τρικάλων"], "EL612": ["Λαρίσης"], "EL613": ["Μαγνησίας"],
    "EL621": ["Ζακύνθου"], "EL622": ["Κερκύρας"], "EL623": ["Κεφαλληνίας"], "EL624": ["Λευκάδος"],
    "EL631": ["Αιτωλίας και Ακαρνανίας"], "EL632": ["Αχαΐας"], "EL633": ["Ηλείας"],
    "EL641": ["Βοιωτίας"], "EL642": ["Ευβοίας"], "EL643": ["Ευρυτανίας"],
    "EL644": ["Φθιώτιδος"], "EL645": ["Φωκίδος"],
    "EL651": ["Αργολίδος", "Αρκαδίας"], "EL652": ["Κορινθίας"], "EL653": ["Λακωνίας", "Μεσσηνίας"],
}


def parse_aade() -> tuple[dict[str, tuple[int, float]], float]:
    """Π22 → {prefecture: (returns, declared_income)} + national mean."""
    ws = openpyxl.load_workbook("/tmp/aade2022.xlsx", read_only=True)["Π22"]
    rows = list(ws.iter_rows(values_only=True))
    out: dict[str, tuple[int, float]] = {}
    national_mean = 0.0
    for r in rows[9:]:
        name = r[0]
        if not name:
            continue
        if name == "Γενικό σύνολο":
            national_mean = float(r[2]) / float(r[1])
            continue
        out[str(name).strip()] = (int(r[1]), float(r[2]))
    return out, national_mean


def main() -> None:
    aade, national_mean = parse_aade()
    print(f"prefectures: {len(aade)} · national mean €{national_mean:,.0f}/return")

    # cross-check: every AADE row must be consumed by the mapping
    used = {n for names in NUTS_TO_AADE.values() for n in names}
    unused = set(aade) - used
    missing = used - set(aade)
    assert not unused, f"AADE rows not mapped: {unused}"
    assert not missing, f"mapping names absent from AADE: {missing}"

    rows = []
    geo = json.load(open("/tmp/nuts3m.geojson", encoding="utf-8"))
    features = []
    for f in geo["features"]:
        nid = f["properties"]["NUTS_ID"]
        if f["properties"].get("CNTR_CODE") != "EL":
            continue
        parts = NUTS_TO_AADE[nid]
        returns = sum(aade[p][0] for p in parts)
        income = sum(aade[p][1] for p in parts)
        mean = income / returns
        rows.append((nid, f["properties"].get("NAME_LATN", ""), round(mean, 2), round(mean / national_mean, 4)))
        features.append({"type": "Feature", "properties": {"NUTS_ID": nid}, "geometry": f["geometry"]})

    assert len(rows) == 52, len(rows)

    data_dir = ROOT / "src" / "panoptes" / "data"
    con = duckdb.connect()
    con.execute("CREATE TABLE t (nuts_id VARCHAR, name VARCHAR, mean_income DOUBLE, income_index DOUBLE)")
    con.executemany("INSERT INTO t VALUES (?, ?, ?, ?)", rows)
    con.execute(f"COPY t TO '{data_dir / 'greece_income_2022.parquet'}' (FORMAT PARQUET, COMPRESSION ZSTD)")

    with gzip.open(data_dir / "greece_nuts3.geojson.gz", "wt", encoding="utf-8") as f:
        json.dump({"type": "FeatureCollection", "features": features}, f, separators=(",", ":"))

    top = sorted(rows, key=lambda r: -r[3])[:3]
    low = sorted(rows, key=lambda r: r[3])[:3]
    print("highest index:", [(r[1], r[3]) for r in top])
    print("lowest index: ", [(r[1], r[3]) for r in low])
    print("written:", data_dir / "greece_income_2022.parquet", "+ greece_nuts3.geojson.gz")


if __name__ == "__main__":
    main()
