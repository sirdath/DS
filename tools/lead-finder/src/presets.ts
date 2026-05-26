/**
 * Area + category presets, tuned for DS2's market: Greek SMEs first, Cyprus second.
 * Use a preset name as --area, a single place, or several places separated by ";".
 */

export const AREA_PRESETS: Record<string, string[]> = {
  // Affluent / dense Athens commercial suburbs — high SME density, many dated sites.
  athens: [
    "Kifisia, Athens, Greece",
    "Glyfada, Athens, Greece",
    "Marousi, Athens, Greece",
    "Chalandri, Athens, Greece",
    "Nea Smyrni, Athens, Greece",
    "Kolonaki, Athens, Greece",
    "Piraeus, Greece",
  ],
  // Major Greek cities nationwide.
  "greece-major": [
    "Athens, Greece",
    "Thessaloniki, Greece",
    "Patra, Greece",
    "Heraklion, Crete, Greece",
    "Larissa, Greece",
    "Volos, Greece",
    "Ioannina, Greece",
    "Chania, Crete, Greece",
    "Rhodes, Greece",
    "Kalamata, Greece",
  ],
  // Cyprus.
  cyprus: ["Nicosia, Cyprus", "Limassol, Cyprus", "Larnaca, Cyprus", "Paphos, Cyprus"],
};

// greece-major + cyprus convenience preset
AREA_PRESETS["greece-cyprus"] = [...AREA_PRESETS["greece-major"]!, ...AREA_PRESETS["cyprus"]!];

/** A broad, Greek-SME-relevant default category set. */
export const DEFAULT_CATEGORIES = [
  "restaurant",
  "cafe",
  "bar",
  "hotel",
  "salon",
  "dentist",
  "lawyer",
  "accountant",
  "realestate",
  "gym",
  "car_repair",
  "florist",
  "jewellery",
  "travel",
  "retail",
];

/** Resolve an --area value into a list of place strings. */
export function resolveAreas(area: string): string[] {
  const key = area.toLowerCase().trim();
  if (AREA_PRESETS[key]) return AREA_PRESETS[key]!;
  // Otherwise treat ";" as a separator (commas appear inside place names).
  return area
    .split(";")
    .map((a) => a.trim())
    .filter(Boolean);
}
