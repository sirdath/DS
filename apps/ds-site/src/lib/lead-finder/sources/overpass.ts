/**
 * Discover businesses via the OpenStreetMap Overpass API (free, no key,
 * ToS-friendly). Returns businesses with AND without a `website` tag — the
 * ones without are prime "needs a site built" leads.
 */
import type { RawLead } from "../types";
import { USER_AGENT, log, sleep } from "../util";
import type { GeoPoint } from "./geocode";

const ENDPOINT = "https://overpass-api.de/api/interpreter";

/** Map friendly category names → OSM tag selectors. Unknown names fall back to shop=<name>. */
const CATEGORY_SELECTORS: Record<string, string[]> = {
  // Hospitality / retail
  restaurant: ['["amenity"="restaurant"]'],
  cafe: ['["amenity"="cafe"]'],
  bar: ['["amenity"="bar"]', '["amenity"="pub"]'],
  bakery: ['["shop"="bakery"]'],
  hotel: ['["tourism"="hotel"]', '["tourism"="guest_house"]'],
  gym: ['["leisure"="fitness_centre"]', '["leisure"="sports_centre"]'],
  salon: ['["shop"="hairdresser"]', '["shop"="beauty"]'],
  florist: ['["shop"="florist"]'],
  jewellery: ['["shop"="jewelry"]'],
  furniture: ['["shop"="furniture"]'],
  clothes: ['["shop"="clothes"]'],
  retail: ['["shop"]'],
  travel: ['["shop"="travel_agency"]'],
  // Professional services (high-intent: nearly all need a credible site)
  lawyer: ['["office"="lawyer"]'],
  accountant: ['["office"="accountant"]'],
  notary: ['["office"="notary"]'],
  insurance: ['["office"="insurance"]'],
  architect: ['["office"="architect"]'],
  realestate: ['["office"="estate_agent"]'],
  // Health
  dentist: ['["amenity"="dentist"]', '["healthcare"="dentist"]'],
  doctor: ['["amenity"="doctors"]', '["healthcare"="doctor"]'],
  vet: ['["amenity"="veterinary"]'],
  pharmacy: ['["amenity"="pharmacy"]'],
  // Trades & home services (often no/old site — strong opportunity)
  plumber: ['["craft"="plumber"]'],
  electrician: ['["craft"="electrician"]'],
  builder: ['["craft"="builder"]', '["office"="construction_company"]'],
  carpenter: ['["craft"="carpenter"]'],
  painter: ['["craft"="painter"]'],
  hvac: ['["craft"="hvac"]'],
  roofer: ['["craft"="roofer"]'],
  locksmith: ['["craft"="locksmith"]', '["shop"="locksmith"]'],
  gardener: ['["craft"="gardener"]', '["shop"="garden_centre"]'],
  cleaner: ['["craft"="cleaning"]', '["shop"="dry_cleaning"]', '["shop"="laundry"]'],
  car_repair: ['["shop"="car_repair"]', '["shop"="tyres"]'],
  // Logistics (OSM coverage is thin here — Google Places is far better; see README)
  mover: ['["office"="moving_company"]'],
  transport: ['["office"="logistics"]'],
  contractor: ['["craft"]', '["office"="company"]'],
};

function selectorsFor(category: string): string[] {
  const key = category.toLowerCase().trim();
  if (CATEGORY_SELECTORS[key]) return CATEGORY_SELECTORS[key]!;
  // Fallback: try as a shop value (covers most retail niches).
  return [`["shop"="${key}"]`];
}

function buildQuery(point: GeoPoint, categories: string[], radiusM: number): string {
  const around = `(around:${radiusM},${point.lat},${point.lon})`;
  const clauses: string[] = [];
  for (const cat of categories) {
    for (const sel of selectorsFor(cat)) {
      clauses.push(`  node${sel}${around};`);
      clauses.push(`  way${sel}${around};`);
    }
  }
  return `[out:json][timeout:90];\n(\n${clauses.join("\n")}\n);\nout center tags;`;
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

function categoryOf(tags: Record<string, string>): string {
  return (
    tags.amenity ||
    tags.shop ||
    tags.office ||
    tags.tourism ||
    tags.leisure ||
    tags.healthcare ||
    tags.craft ||
    "business"
  ).replace(/_/g, " ");
}

function addressOf(tags: Record<string, string>): string | null {
  const parts = [
    [tags["addr:housenumber"], tags["addr:street"]].filter(Boolean).join(" "),
    tags["addr:postcode"],
    tags["addr:city"] || tags["addr:suburb"],
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

export async function discoverOverpass(
  point: GeoPoint,
  categories: string[],
  radiusM: number,
): Promise<RawLead[]> {
  const query = buildQuery(point, categories, radiusM);
  // Overpass rate-limits aggressively (429/504). Retry a couple of times with backoff.
  let res: Response | null = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "User-Agent": USER_AGENT },
      body: `data=${encodeURIComponent(query)}`,
    });
    if (res.ok) break;
    if (res.status === 429 || res.status === 504 || res.status === 503) {
      const wait = 5000 * (attempt + 1);
      log.warn(`Overpass busy (${res.status}); retrying in ${wait / 1000}s…`);
      await sleep(wait);
      continue;
    }
    break;
  }
  if (!res || !res.ok) {
    const body = res ? await res.text().catch(() => "") : "";
    throw new Error(`Overpass query failed (${res?.status ?? "no response"}). ${body.slice(0, 200)}`);
  }
  const data = (await res.json()) as { elements: OverpassElement[] };

  const seen = new Set<string>();
  const leads: RawLead[] = [];
  for (const el of data.elements) {
    const tags = el.tags;
    if (!tags || !tags.name) continue; // unnamed nodes aren't actionable leads
    const id = `${el.type}/${el.id}`;
    if (seen.has(id)) continue;
    seen.add(id);
    const lat = el.lat ?? el.center?.lat ?? null;
    const lon = el.lon ?? el.center?.lon ?? null;
    leads.push({
      source: "osm",
      sourceId: id,
      name: tags.name,
      category: categoryOf(tags),
      website: tags.website || tags["contact:website"] || tags.url || null,
      phone: tags.phone || tags["contact:phone"] || null,
      email: tags.email || tags["contact:email"] || null,
      address: addressOf(tags),
      area: tags["addr:city"] || tags["addr:suburb"] || null,
      lat,
      lon,
    });
  }
  log.ok(`Overpass returned ${leads.length} named businesses (${leads.filter((l) => !l.website).length} with no website)`);
  return leads;
}
