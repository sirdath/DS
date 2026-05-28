/** Map finder Lead objects to/from `marketing_leads` rows + shared constants. */
import type { Lead, RawLead } from "./types";

/** Normalised key for an area so the same place can't be searched twice. */
export function areaKey(area: string): string {
  return area.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Default Greek-SME industry set used when the caller doesn't pass categories. */
export const DEFAULT_CATEGORIES = [
  "restaurant", "cafe", "bar", "hotel", "salon", "dentist", "lawyer", "accountant",
  "notary", "realestate", "gym", "car_repair", "plumber", "electrician", "builder",
  "cleaner", "locksmith", "florist", "travel", "retail",
];

export interface LeadRow {
  source: string;
  source_id: string | null;
  name: string;
  category: string | null;
  area: string | null;
  website: string | null;
  has_website: boolean;
  phone: string | null;
  email: string | null;
  address: string | null;
  lat: number | null;
  lon: number | null;
  rating: number | null;
  reviews: number | null;
  lead_score: number;
  ugliness: number | null;
  priority: string;
  tags: string[];
  tech: string[];
  pitch_angle: string;
  maps_url: string;
  analysis_status: "pending" | "done" | "na" | "failed";
}

/** Columns the analyze step reads back to re-score a pending lead. */
export interface StoredLeadRow {
  id: string;
  source: string;
  source_id: string | null;
  name: string;
  category: string | null;
  area: string | null;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  lat: number | null;
  lon: number | null;
  rating: number | null;
  reviews: number | null;
}

export function rowToRaw(row: StoredLeadRow): RawLead {
  return {
    source: row.source === "google" ? "google" : "osm",
    sourceId: row.source_id ?? row.id,
    name: row.name,
    category: row.category ?? "business",
    website: row.website,
    phone: row.phone,
    email: row.email,
    address: row.address,
    area: row.area,
    lat: row.lat,
    lon: row.lon,
    rating: row.rating,
    reviews: row.reviews,
  };
}

export function leadToRow(l: Lead): LeadRow {
  return {
    source: l.source,
    source_id: l.sourceId,
    name: l.name,
    category: l.category,
    area: l.area,
    website: l.website,
    has_website: l.hasWebsite,
    phone: l.phone,
    email: l.email,
    address: l.address,
    lat: l.lat,
    lon: l.lon,
    rating: l.rating ?? null,
    reviews: l.reviews ?? null,
    lead_score: l.leadScore,
    ugliness: l.analysis?.ugliness ?? null,
    priority: l.priority,
    tags: l.tags,
    tech: l.analysis?.tech ?? [],
    pitch_angle: l.pitchAngle,
    maps_url: l.mapsUrl,
    analysis_status: l.analysis ? "done" : l.hasWebsite ? "pending" : "na",
  };
}
