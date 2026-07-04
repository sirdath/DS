// Licensed-image lane: search real image APIs (Openverse / Unsplash / Pexels),
// return normalized {url, author, license, source, title} items ready to download.
// These sources are safe to SHIP (licence + attribution captured in sources.json).

const UA = "DS2-inspo/1.0 (+https://ds2-consulting.com)";

/** Openverse — open API, no key required. Returns CC/public-domain imagery. */
async function openverse(query, { count, orientation }) {
  const params = new URLSearchParams({
    q: query,
    page_size: String(Math.min(count, 60)),
    // commercial + modification friendly by default; drop to widen results.
    license_type: "commercial,modification",
  });
  if (orientation) params.set("aspect_ratio", orientation === "portrait" ? "tall" : orientation === "landscape" ? "wide" : "square");
  const res = await fetch(`https://api.openverse.org/v1/images/?${params}`, {
    headers: { "user-agent": UA, accept: "application/json" },
  });
  if (!res.ok) throw new Error(`Openverse ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  return (data.results || []).map((r) => ({
    url: r.url,
    title: r.title || query,
    author: r.creator || "unknown",
    license: `${(r.license || "").toUpperCase()} ${r.license_version || ""}`.trim(),
    source: r.foreign_landing_url || r.url,
  }));
}

/** Unsplash — needs UNSPLASH_ACCESS_KEY. Free tier: 50 req/hr. */
async function unsplash(query, { count, orientation }) {
  const key = process.env.UNSPLASH_ACCESS_KEY;
  if (!key) throw new Error("UNSPLASH_ACCESS_KEY not set (get one free at unsplash.com/developers).");
  const params = new URLSearchParams({ query, per_page: String(Math.min(count, 30)) });
  if (orientation) params.set("orientation", orientation);
  const res = await fetch(`https://api.unsplash.com/search/photos?${params}`, {
    headers: { "user-agent": UA, authorization: `Client-ID ${key}`, "accept-version": "v1" },
  });
  if (!res.ok) throw new Error(`Unsplash ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  return (data.results || []).map((r) => ({
    url: r.urls?.full || r.urls?.regular,
    title: r.description || r.alt_description || query,
    author: r.user?.name || "unknown",
    license: "Unsplash License",
    source: r.links?.html || r.urls?.regular,
  }));
}

/** Pexels — needs PEXELS_API_KEY. Free tier: 200 req/hr. */
async function pexels(query, { count, orientation }) {
  const key = process.env.PEXELS_API_KEY;
  if (!key) throw new Error("PEXELS_API_KEY not set (get one free at pexels.com/api).");
  const params = new URLSearchParams({ query, per_page: String(Math.min(count, 80)) });
  if (orientation) params.set("orientation", orientation);
  const res = await fetch(`https://api.pexels.com/v1/search?${params}`, {
    headers: { "user-agent": UA, authorization: key },
  });
  if (!res.ok) throw new Error(`Pexels ${res.status}: ${await res.text().catch(() => "")}`);
  const data = await res.json();
  return (data.photos || []).map((r) => ({
    url: r.src?.original || r.src?.large2x,
    title: r.alt || query,
    author: r.photographer || "unknown",
    license: "Pexels License",
    source: r.url,
  }));
}

const SOURCES = { openverse, unsplash, pexels };

/** Fetch normalized items for a query from the chosen source. */
export async function searchStock(query, { source = "openverse", count = 12, orientation } = {}) {
  const fn = SOURCES[source];
  if (!fn) throw new Error(`Unknown source "${source}". Use one of: ${Object.keys(SOURCES).join(", ")}.`);
  const items = await fn(query, { count, orientation });
  return items.filter((it) => it.url).slice(0, count);
}

export const STOCK_SOURCES = Object.keys(SOURCES);
