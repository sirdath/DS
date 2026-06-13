/**
 * Fixed categorical palette for functional zones.
 * Blues / cyans / teals / slate / violet — dark-theme friendly.
 * Index matches the zone integer from zones.assignments[].zone.
 */
export const ZONE_COLORS = [
  '#2563eb', // 0
  '#22d3ee', // 1
  '#0ea5e9', // 2
  '#6366f1', // 3
  '#14b8a6', // 4
  '#8b5cf6', // 5
  '#3b82f6', // 6
  '#06b6d4', // 7
  '#0d9488', // 8
  '#7c3aed', // 9
] as const

/** Fallback for any zone id beyond the palette length. */
const FALLBACK_COLOR = '#4a5260'

export function zoneColor(zoneId: number): string {
  return ZONE_COLORS[zoneId] ?? FALLBACK_COLOR
}
