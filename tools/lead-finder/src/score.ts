/** Turn a RawLead + optional SiteAnalysis into a prioritised, pitch-ready Lead. */
import type { RawLead, SiteAnalysis, Lead } from "./types.js";

export function buildLead(raw: RawLead, analysis: SiteAnalysis | null): Lead {
  const hasWebsite = Boolean(raw.website);
  const businessBoost = reviewsBoost(raw.reviews) + (raw.phone ? 6 : 0);

  let leadScore: number;
  let pitchAngle: string;

  if (!hasWebsite) {
    // No website at all → strongest intent for a build / end-to-end engagement.
    leadScore = clamp(72 + businessBoost);
    pitchAngle = "No website found — strongest case for a build-only or end-to-end engagement.";
  } else if (analysis && !analysis.reachable) {
    leadScore = clamp(74 + businessBoost * 0.5);
    pitchAngle = "Their listed website is broken / won't load — urgent rebuild opportunity.";
  } else if (analysis) {
    // Has a working site → redesign lead, driven by how dated it looks.
    leadScore = clamp(Math.round(analysis.ugliness * 0.9) + businessBoost);
    pitchAngle = pitchFromAnalysis(analysis);
  } else {
    leadScore = clamp(40 + businessBoost);
    pitchAngle = "Has a website (not analysed) — review manually.";
  }

  const tags = collectTags(raw, analysis, hasWebsite);
  const priority: Lead["priority"] = leadScore >= 65 ? "High" : leadScore >= 40 ? "Medium" : "Low";

  return {
    ...raw,
    hasWebsite,
    analysis,
    leadScore,
    priority,
    tags,
    pitchAngle,
    mapsUrl: buildMapsUrl(raw),
    discoveredAt: new Date().toISOString().slice(0, 10),
  };
}

function pitchFromAnalysis(a: SiteAnalysis): string {
  const has = (t: string) => a.signals.some((s) => s.tag === t);
  if (has("not-mobile-friendly")) return "Not mobile-friendly — most local searches are on phones; they're losing them.";
  if (has("no-https")) return "No HTTPS — visitors see a 'Not secure' warning; quick, credible win to fix.";
  if (has("table-layout") || has("deprecated-html") || has("legacy-cms") || has("flash"))
    return "Visibly dated build (legacy HTML) — undermines trust vs competitors.";
  if (has("stale-copyright")) return "Site looks abandoned (old copyright) — a refresh signals they're active.";
  if (has("diy-builder")) return "DIY template site — opportunity to differentiate and own the brand properly.";
  if (a.ugliness >= 30) return "Several dated signals — solid redesign candidate.";
  return "Reasonable site — lower priority; possible performance/SEO tune-up.";
}

function collectTags(raw: RawLead, analysis: SiteAnalysis | null, hasWebsite: boolean): string[] {
  const tags = new Set<string>();
  if (!hasWebsite) tags.add("no-website");
  if (analysis) for (const s of analysis.signals) tags.add(s.tag);
  if (analysis?.reachable && analysis.ugliness < 25 && hasWebsite) tags.add("modern-ok");
  return [...tags];
}

function reviewsBoost(reviews: number | null | undefined): number {
  if (!reviews || reviews <= 0) return 0;
  // Established businesses (more reviews) are better-qualified clients.
  return Math.min(16, Math.round(Math.log10(reviews + 1) * 9));
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function buildMapsUrl(raw: RawLead): string {
  if (raw.lat != null && raw.lon != null) {
    const q = encodeURIComponent(`${raw.name} ${raw.area ?? ""}`.trim());
    return `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=`.replace(/&query_place_id=$/, "") +
      `&center=${raw.lat},${raw.lon}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${raw.name} ${raw.address ?? raw.area ?? ""}`.trim())}`;
}
