/**
 * Firecrawl-backed observer — the one fully-defensible scraping lane: a competitor's
 * OWN public site. Uses Firecrawl v2 `POST /v2/scrape` (synchronous, inline) with the
 * structured `json` format to extract the clean literal signals — headline rate, live
 * offers, open roles — that the deterministic core can diff without ambiguity.
 *
 * Deliberately NARROW and honest:
 *  - Reviews/ratings (Google Places API), SEO rank (a SERP API), and social follower
 *    counts (Meta Business Discovery, aggregate-only) are legally/technically distinct
 *    sources — they belong behind their own observers, not here. This one never invents
 *    them.
 *  - On-site content/photo "refresh" detection is intentionally omitted: a naïve hash of
 *    rendered markdown fires every week on dynamic content. That signal should use
 *    Firecrawl's native `changeTracking` format (persistent snapshots, whitespace/order
 *    resilient) — a follow-up lane, noted here so no one wires the noisy version.
 *  - Any failure returns {} so a competitor simply has "no signal this week" — a scrape
 *    error must never manufacture a false movement.
 */

import { createHash } from "node:crypto";
import type { Observer } from "../observer";
import type { BusinessRef, CompetitorMetrics, CompetitorRef, Currency } from "../types";

const DEFAULT_BASE = "https://api.firecrawl.dev";

const EXTRACT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    headlineRate: { type: ["number", "null"], description: "The lowest or representative nightly/headline price shown, as a number with no currency symbol. null if none is shown." },
    currency: { type: ["string", "null"], description: "ISO currency code of that price (EUR, GBP, USD). null if unknown." },
    offers: { type: "array", items: { type: "string" }, description: "Current promotions or special offers, each a short phrase. Empty array if none." },
    hiring: { type: "array", items: { type: "string" }, description: "Open job titles advertised on the site. Empty array if none." },
  },
  required: ["offers", "hiring"],
} as const;

const PROMPT =
  "Extract the headline nightly price, any live promotional offers, and any advertised open job roles from this business's own website. Use only what is shown; do not guess.";

interface ScrapeResponse {
  success?: boolean;
  data?: {
    json?: { headlineRate?: number | null; currency?: string | null; offers?: unknown; hiring?: unknown };
  };
}

export interface FirecrawlObserverOptions {
  apiKey: string;
  baseUrl?: string;
  /** Injectable for tests; defaults to global fetch. */
  fetchImpl?: typeof fetch;
}

function normalizeCurrency(raw: unknown): Currency | undefined {
  if (raw === "EUR" || raw === "GBP" || raw === "USD") return raw;
  return undefined;
}

function asStringArray(raw: unknown): string[] {
  return Array.isArray(raw) ? raw.filter((x): x is string => typeof x === "string" && x.trim() !== "") : [];
}

export class FirecrawlObserver implements Observer {
  readonly kind = "firecrawl";
  private readonly apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;

  constructor(opts: FirecrawlObserverOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = (opts.baseUrl ?? DEFAULT_BASE).replace(/\/$/, "");
    this.fetchImpl = opts.fetchImpl ?? fetch;
  }

  async observe(competitor: CompetitorRef, business: BusinessRef): Promise<CompetitorMetrics> {
    try {
      const url = /^https?:\/\//.test(competitor.url) ? competitor.url : `https://${competitor.url}`;
      const res = await this.fetchImpl(`${this.baseUrl}/v2/scrape`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          url,
          onlyMainContent: true,
          formats: ["markdown", { type: "json", schema: EXTRACT_SCHEMA, prompt: PROMPT }],
        }),
      });
      if (!res.ok) return {};

      const body = (await res.json()) as ScrapeResponse;
      // Firecrawl can return HTTP 200 with success:false for a failed scrape.
      if (body?.success === false) return {};
      const extracted = body?.data?.json ?? {};
      const metrics: CompetitorMetrics = { offers: asStringArray(extracted.offers), hiring: asStringArray(extracted.hiring) };

      if (typeof extracted.headlineRate === "number" && Number.isFinite(extracted.headlineRate)) {
        metrics.avgRate = Math.round(extracted.headlineRate * 100);
        metrics.currency = normalizeCurrency(extracted.currency) ?? business.currency;
      }
      return metrics;
    } catch {
      return {};
    }
  }
}

/** Stable 16-char hash of a string — exposed for a future changeTracking lane. */
export function contentFingerprint(text: string): string {
  return createHash("sha256").update(text).digest("hex").slice(0, 16);
}
