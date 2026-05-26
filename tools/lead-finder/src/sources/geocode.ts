/** Geocode a free-text area to a centre point via OpenStreetMap Nominatim. */
import { USER_AGENT, log } from "../util.js";

export interface GeoPoint {
  lat: number;
  lon: number;
  displayName: string;
}

export async function geocodeArea(area: string): Promise<GeoPoint> {
  const url = new URL("https://nominatim.openstreetmap.org/search");
  url.searchParams.set("q", area);
  url.searchParams.set("format", "json");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");

  const res = await fetch(url, { headers: { "User-Agent": USER_AGENT, "Accept-Language": "en" } });
  if (!res.ok) throw new Error(`Nominatim geocode failed (${res.status}) for "${area}"`);
  const rows = (await res.json()) as Array<{ lat: string; lon: string; display_name: string }>;
  if (rows.length === 0) throw new Error(`Could not geocode area "${area}". Try a more specific place name.`);
  const r = rows[0]!;
  const point = { lat: Number(r.lat), lon: Number(r.lon), displayName: r.display_name };
  log.ok(`Geocoded "${area}" → ${point.displayName} (${point.lat.toFixed(4)}, ${point.lon.toFixed(4)})`);
  return point;
}
