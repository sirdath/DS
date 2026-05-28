/** Shared data shapes for the DS2 lead finder. */

/** A business discovered from a source, before website analysis. */
export interface RawLead {
  source: "osm" | "google";
  sourceId: string;
  name: string;
  category: string;
  website: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  area: string | null;
  lat: number | null;
  lon: number | null;
  /** Google-only signals (undefined for OSM). */
  rating?: number | null;
  reviews?: number | null;
}

/** One detected problem with a website. Higher weight = stronger redesign signal. */
export interface Signal {
  tag: string;
  detail: string;
  weight: number;
}

/** Result of analysing a single website. */
export interface SiteAnalysis {
  reachable: boolean;
  finalUrl: string | null;
  statusCode: number | null;
  https: boolean;
  mobileFriendly: boolean;
  ttfbMs: number | null;
  pageKb: number | null;
  title: string | null;
  hasMetaDescription: boolean;
  copyrightYear: number | null;
  generator: string | null;
  server: string | null;
  /** Last-Modified header (ISO date) if the server sent one — a freshness proxy. */
  lastModified: string | null;
  /** Domain registration date (ISO) via RDAP, when available — "when it was made". */
  domainCreated: string | null;
  /** Detected tech stack (modern + legacy), e.g. ["jQuery 1.11","Bootstrap 3"]. */
  tech: string[];
  /** 0–100, higher = uglier / more outdated = better redesign lead. */
  ugliness: number;
  signals: Signal[];
  notes: string | null;
}

/** A fully processed lead ready for export. */
export interface Lead extends RawLead {
  hasWebsite: boolean;
  analysis: SiteAnalysis | null;
  leadScore: number;
  priority: "High" | "Medium" | "Low";
  tags: string[];
  pitchAngle: string;
  mapsUrl: string;
  discoveredAt: string;
}

export interface Config {
  /** Free-text area, e.g. "Kifisia, Greece" or "Shoreditch, London". */
  area: string;
  /** OSM category presets to search, e.g. ["restaurant","cafe","lawyer"]. */
  categories: string[];
  /** Search radius in metres around the geocoded area centre. */
  radiusM: number;
  /** Max leads to analyse (protects against huge areas + rate limits). */
  limit: number;
  /** Concurrent website fetches. */
  concurrency: number;
  /** Per-request timeout (ms). */
  timeoutMs: number;
  /** Respect robots.txt before fetching a homepage. */
  respectRobots: boolean;
  /** Output .xlsx path. */
  out: string;
  /** Use Google Places if GOOGLE_PLACES_API_KEY is set. */
  useGoogle: boolean;
  /** Only keep leads at/above this lead score (0 = keep all). */
  minScore: number;
  /** Keep at most N leads per industry in the output (0 = keep all). */
  perIndustry: number;
  /** Look up domain registration date via RDAP ("when it was made"). */
  domainAge: boolean;
}
