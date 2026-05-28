/**
 * Analyse a homepage for outdatedness / poor design. Each detected problem is a
 * weighted Signal; the sum (capped at 100) is the "ugliness" score — higher means
 * a stronger case for a redesign, i.e. a better lead for DS2.
 *
 * Heuristics are deliberately conservative and explainable: every point on the
 * score traces back to a concrete, defensible signal we can put in front of a client.
 */
import * as cheerio from "cheerio";
import type { SiteAnalysis, Signal } from "./types";
import type { FetchedSite } from "./fetch-site";
import { fingerprint } from "./fingerprint";

const THIS_YEAR = new Date().getFullYear();
const MODERN_BUILDERS = /wix|squarespace|shopify|webflow|framer|duda/i;

export function analyseSite(site: FetchedSite): SiteAnalysis {
  const signals: Signal[] = [];
  const add = (tag: string, detail: string, weight: number) => signals.push({ tag, detail, weight });

  // ── Unreachable / broken: the site is listed but doesn't load. Strong lead. ──
  if (!site.ok || !site.html) {
    const reason = site.error ?? "no content";
    add("site-down", `Listed site does not load (${reason})`, 40);
    return {
      reachable: false, finalUrl: site.finalUrl, statusCode: site.status,
      https: site.finalUrl?.startsWith("https:") ?? false, mobileFriendly: false,
      ttfbMs: site.ttfbMs, pageKb: site.bytes ? Math.round(site.bytes / 1024) : null,
      title: null, hasMetaDescription: false, copyrightYear: null, generator: null,
      server: site.headers?.get("server") ?? null,
      lastModified: null, domainCreated: null, tech: [],
      ugliness: capScore(signals), signals, notes: site.blockedByRobots ? "robots.txt disallowed homepage" : null,
    };
  }

  const $ = cheerio.load(site.html);
  const html = site.html;
  const headLower = html.slice(0, 4000).toLowerCase();
  const finalUrl = site.finalUrl ?? "";
  const https = finalUrl.startsWith("https:");
  const generator = $('meta[name="generator"]').attr("content") ?? null;
  const server = site.headers?.get("server") ?? null;
  const isModernBuilder = MODERN_BUILDERS.test(generator ?? "") || MODERN_BUILDERS.test(headLower);

  // ── HTTPS ──
  if (!https) add("no-https", "Served over plain HTTP — no SSL (browsers flag it 'Not secure')", 18);

  // ── Mobile responsiveness (the single biggest tell) ──
  const viewport = $('meta[name="viewport"]').attr("content");
  const mobileFriendly = Boolean(viewport && /width\s*=\s*(device-width|\d)/i.test(viewport));
  if (!mobileFriendly) add("not-mobile-friendly", "No responsive viewport meta — breaks on phones", 22);

  // ── Quirks mode / missing doctype ──
  if (!/^\s*<!doctype html>/i.test(html)) add("legacy-doctype", "Missing modern <!doctype html> (renders in quirks mode)", 9);

  // ── Table-based layout ──
  const layoutTables = $("table").filter((_, el) => {
    const role = ($(el).attr("role") ?? "").toLowerCase();
    return role !== "presentation" && ($(el).find("table").length > 0 || $(el).attr("width") != null || $(el).attr("bgcolor") != null);
  }).length;
  if (layoutTables >= 1) add("table-layout", `Page laid out with <table>s (${layoutTables}) — a pre-2010 technique`, 14);

  // ── Deprecated tags / attributes ──
  const deprecatedTags = $("font, center, marquee, frameset, frame, blink").length;
  if (deprecatedTags > 0) add("deprecated-html", `Uses obsolete tags (<font>/<center>/<marquee>…) ×${deprecatedTags}`, 12);
  if (/\s(bgcolor|alink|vlink|link)\s*=/.test(headLower)) add("deprecated-attrs", "Uses obsolete HTML attributes (bgcolor/alink…)", 6);

  // ── Flash / legacy plugins ──
  if (/\.swf(["')\s]|$)/i.test(html) || $('object[type*="flash"], embed[type*="flash"]').length > 0) {
    add("flash", "Embeds Flash (.swf) — dead since 2020", 12);
  }

  // ── Document/title/meta basics ──
  const title = ($("title").first().text() || "").trim() || null;
  if (!title) add("no-title", "No <title> tag", 6);
  const hasMetaDescription = $('meta[name="description"]').attr("content")?.trim() ? true : false;
  if (!hasMetaDescription) add("no-meta-description", "No meta description (hurts SEO + click-through)", 5);
  if ($('meta[property^="og:"]').length === 0) add("no-open-graph", "No Open Graph tags (ugly link previews when shared)", 4);
  if ($('link[rel*="icon"]').length === 0 && !/favicon/i.test(headLower)) add("no-favicon", "No favicon", 3);

  // ── Stale copyright year ──
  const copyrightYear = extractCopyrightYear($.text());
  if (copyrightYear && copyrightYear < THIS_YEAR - 2) {
    add("stale-copyright", `Footer copyright says ${copyrightYear} — looks abandoned`, 10);
  }

  // ── Old generators / servers ──
  if (generator && /(frontpage|dreamweaver|joomla!?\s*1\.|wordpress\s*[1-4]\.)/i.test(generator)) {
    add("legacy-cms", `Built with a dated tool (${generator})`, 9);
  }
  if (server && /(IIS\/[67]\.|Apache\/1\.|Apache\/2\.[0-2]\.)/i.test(server)) {
    add("old-server", `Served by old infrastructure (${server})`, 5);
  }

  // ── Tech-stack fingerprint: detect libraries/frameworks and flag legacy ones ──
  const fp = fingerprint(html, site.headers, generator);
  for (const s of fp.signals) signals.push(s);
  if (/document\.write\s*\(/.test(html)) add("document-write", "Uses document.write() (legacy scripting)", 4);

  // ── Fixed-width / non-fluid layout ──
  if (/<(body|table|div)[^>]*\swidth\s*=\s*["']?(7\d\d|8\d\d|9\d\d|10\d\d)\b/i.test(html)) {
    add("fixed-width", "Fixed pixel-width layout (doesn't reflow on mobile)", 6);
  }
  const inlineStyles = $("[style]").length;
  if (inlineStyles > 40) add("inline-style-soup", `Heavy inline styling (${inlineStyles} style="" attrs)`, 4);

  // ── Page weight / responsiveness proxies ──
  const pageKb = Math.round(site.bytes / 1024);
  if (site.bytes > 0 && site.bytes < 1500) add("under-construction", "Almost no content — placeholder / parked page", 8);
  if (site.ttfbMs != null && site.ttfbMs > 1800) add("slow", `Slow to respond (${site.ttfbMs}ms first byte)`, 6);

  // ── Modern DIY builder: a real but commoditised site — upsell, lower weight. ──
  if (isModernBuilder) add("diy-builder", "Built on a DIY template builder (Wix/Squarespace/…) — room to differentiate", 6);

  // ── Freshness: Last-Modified header as a "last touched" proxy ──
  const lmHeader = site.headers?.get("last-modified");
  let lastModified: string | null = null;
  if (lmHeader) {
    const d = new Date(lmHeader);
    if (!Number.isNaN(d.getTime())) {
      lastModified = d.toISOString().slice(0, 10);
      const ageYears = (Date.now() - d.getTime()) / (365 * 24 * 3600 * 1000);
      if (ageYears > 3) add("stale-last-modified", `Homepage not changed since ${lastModified} (${ageYears.toFixed(0)}y)`, 6);
    }
  }

  return {
    reachable: true, finalUrl, statusCode: site.status, https, mobileFriendly,
    ttfbMs: site.ttfbMs, pageKb, title, hasMetaDescription, copyrightYear, generator, server,
    lastModified, domainCreated: null, tech: fp.tech,
    ugliness: capScore(signals), signals, notes: null,
  };
}

function capScore(signals: Signal[]): number {
  const total = signals.reduce((s, sig) => s + sig.weight, 0);
  return Math.min(100, total);
}

function extractCopyrightYear(text: string): number | null {
  const matches = [...text.matchAll(/(?:©|copyright|\(c\))\s*(?:\d{4}\s*[-–]\s*)?(\d{4})/gi)];
  let latest: number | null = null;
  for (const m of matches) {
    const y = Number(m[1]);
    if (y >= 1995 && y <= THIS_YEAR + 1) latest = latest === null ? y : Math.max(latest, y);
  }
  return latest;
}
