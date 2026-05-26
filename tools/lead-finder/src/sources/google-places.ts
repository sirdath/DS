/**
 * Optional discovery via the official Google Places API (Text Search + Place
 * Details). Requires GOOGLE_PLACES_API_KEY. Richer than OSM (ratings, review
 * counts, reliable websites) but billed per request. Used only when a key is set.
 */
import type { RawLead } from "../types.js";
import { log, sleep } from "../util.js";
import type { GeoPoint } from "./geocode.js";

const TEXT_SEARCH = "https://maps.googleapis.com/maps/api/place/textsearch/json";
const DETAILS = "https://maps.googleapis.com/maps/api/place/details/json";

interface TextResult {
  place_id: string;
  name: string;
  formatted_address?: string;
  types?: string[];
  rating?: number;
  user_ratings_total?: number;
  geometry?: { location?: { lat: number; lng: number } };
}

interface DetailsResult {
  website?: string;
  international_phone_number?: string;
  formatted_phone_number?: string;
}

export async function discoverGoogle(
  point: GeoPoint,
  categories: string[],
  radiusM: number,
  apiKey: string,
): Promise<RawLead[]> {
  const leads: RawLead[] = [];
  const seen = new Set<string>();

  for (const category of categories) {
    let pageToken: string | undefined;
    let pages = 0;
    do {
      const url = new URL(TEXT_SEARCH);
      url.searchParams.set("query", `${category} near ${point.displayName}`);
      url.searchParams.set("location", `${point.lat},${point.lon}`);
      url.searchParams.set("radius", String(radiusM));
      url.searchParams.set("key", apiKey);
      if (pageToken) url.searchParams.set("pagetoken", pageToken);

      const res = await fetch(url);
      const data = (await res.json()) as { results?: TextResult[]; next_page_token?: string; status: string };
      if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
        log.warn(`Google Places "${category}" returned status ${data.status}; skipping.`);
        break;
      }
      for (const r of data.results ?? []) {
        if (seen.has(r.place_id)) continue;
        seen.add(r.place_id);
        const details = await getDetails(r.place_id, apiKey);
        leads.push({
          source: "google",
          sourceId: r.place_id,
          name: r.name,
          category: (r.types?.[0] ?? category).replace(/_/g, " "),
          website: details.website ?? null,
          phone: details.international_phone_number ?? details.formatted_phone_number ?? null,
          email: null,
          address: r.formatted_address ?? null,
          area: null,
          lat: r.geometry?.location?.lat ?? null,
          lon: r.geometry?.location?.lng ?? null,
          rating: r.rating ?? null,
          reviews: r.user_ratings_total ?? null,
        });
      }
      pageToken = data.next_page_token;
      pages++;
      if (pageToken) await sleep(2000); // Google requires a short delay before the token is valid
    } while (pageToken && pages < 3);
  }

  log.ok(`Google Places returned ${leads.length} businesses (${leads.filter((l) => !l.website).length} with no website)`);
  return leads;
}

async function getDetails(placeId: string, apiKey: string): Promise<DetailsResult> {
  const url = new URL(DETAILS);
  url.searchParams.set("place_id", placeId);
  url.searchParams.set("fields", "website,formatted_phone_number,international_phone_number");
  url.searchParams.set("key", apiKey);
  try {
    const res = await fetch(url);
    const data = (await res.json()) as { result?: DetailsResult };
    return data.result ?? {};
  } catch {
    return {};
  }
}
