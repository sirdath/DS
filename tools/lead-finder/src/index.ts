/**
 * DS2 Lead Finder — orchestrator.
 * discover (OSM / Google) → dedupe → analyse websites → score → export Excel.
 */
import { mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import type { RawLead, Lead } from "./types.js";
import { parseArgs, HELP } from "./config.js";
import { resolveAreas } from "./presets.js";
import { geocodeArea } from "./sources/geocode.js";
import { discoverOverpass } from "./sources/overpass.js";
import { discoverGoogle } from "./sources/google-places.js";
import { fetchSite } from "./fetch-site.js";
import { analyseSite } from "./analyze.js";
import { domainCreated } from "./domain-age.js";
import { buildLead } from "./score.js";
import { writeWorkbook } from "./excel.js";
import { log, mapPool, progressBar, sleep, leadKey, normaliseUrl } from "./util.js";

async function main(): Promise<void> {
  const cfg = parseArgs(process.argv);
  if (cfg === "help") {
    console.log(HELP);
    return;
  }

  const areas = resolveAreas(cfg.area);
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const useGoogle = cfg.useGoogle && Boolean(apiKey);

  log.step(`DS2 Lead Finder`);
  log.dim(`  Areas (${areas.length}): ${areas.join(" · ")}`);
  log.dim(`  Categories: ${cfg.categories.join(", ")}`);
  log.dim(`  Discovery: OpenStreetMap${useGoogle ? " + Google Places" : ""}  ·  radius ${cfg.radiusM}m  ·  analyse ≤ ${cfg.limit} sites`);

  // ── 1. Discover ──────────────────────────────────────────────
  log.step("Discovering businesses");
  const raw: RawLead[] = [];
  for (const [i, place] of areas.entries()) {
    try {
      const point = await geocodeArea(place);
      await sleep(1100); // Nominatim courtesy: ≤ 1 req/s
      const osm = await discoverOverpass(point, cfg.categories, cfg.radiusM);
      raw.push(...osm);
      if (useGoogle && apiKey) {
        const g = await discoverGoogle(point, cfg.categories, cfg.radiusM, apiKey);
        raw.push(...g);
      }
    } catch (err) {
      log.warn(`"${place}" failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    if (i < areas.length - 1) await sleep(2000); // be gentle to Overpass between areas
  }

  // ── 2. Dedupe ────────────────────────────────────────────────
  const byKey = new Map<string, RawLead>();
  for (const r of raw) {
    const key = leadKey(r.name, r.area, r.website);
    const existing = byKey.get(key);
    // Prefer the richer record (Google details / has website / has phone).
    if (!existing || score(r) > score(existing)) byKey.set(key, r);
  }
  const deduped = [...byKey.values()];
  const noSite = deduped.filter((r) => !normaliseUrl(r.website));
  const withSite = deduped.filter((r) => normaliseUrl(r.website));
  log.ok(`${deduped.length} unique businesses — ${noSite.length} with no website, ${withSite.length} with a website`);

  // ── 3. Analyse websites (capped, concurrent, polite) ─────────
  // Spread the analysis budget across industries (round-robin by category) so a
  // dense category (e.g. restaurants) doesn't eat the whole limit.
  const toAnalyse = interleaveByCategory(withSite).slice(0, cfg.limit);
  log.step(`Analysing ${toAnalyse.length} websites${cfg.domainAge ? " (+ domain age)" : ""}`);
  const analysed = await mapPool(
    toAnalyse,
    cfg.concurrency,
    async (r) => {
      const url = normaliseUrl(r.website)!;
      const fetched = await fetchSite(url, cfg.timeoutMs, cfg.respectRobots);
      const analysis = analyseSite(fetched);
      if (cfg.domainAge && analysis.reachable) {
        analysis.domainCreated = await domainCreated(analysis.finalUrl ?? url);
      }
      return buildLead(r, analysis);
    },
    (done, total) => progressBar(done, total, "sites"),
  );

  // ── 4. Build remaining leads (no-website + un-analysed overflow) ──
  const analysedIds = new Set(toAnalyse.map((r) => r.sourceId));
  const leads: Lead[] = [...analysed];
  for (const r of withSite) if (!analysedIds.has(r.sourceId)) leads.push(buildLead(r, null));
  for (const r of noSite) leads.push(buildLead(r, null));

  // ── 5. Filter + (optional) cap per industry for a balanced shortlist ──
  let final = leads.filter((l) => l.leadScore >= cfg.minScore);
  if (cfg.perIndustry > 0) final = capPerIndustry(final, cfg.perIndustry);

  // ── 6. Export ────────────────────────────────────────────────
  const outPath = resolve(cfg.out);
  await mkdir(dirname(outPath), { recursive: true });
  await writeWorkbook(final, outPath, { area: cfg.area, categories: cfg.categories });

  // ── 7. Report ────────────────────────────────────────────────
  const high = final.filter((l) => l.priority === "High").length;
  const nw = final.filter((l) => !l.hasWebsite).length;
  const ugly = final.filter((l) => l.hasWebsite && l.analysis && l.analysis.ugliness >= 30).length;
  log.step("Done");
  log.ok(`${final.length} leads → High ${high} · no-website ${nw} · dated sites ${ugly}`);
  log.ok(`Workbook: ${outPath}`);
  log.dim(`  Sheets: Summary · All leads · No website · Ugly sites`);

  // Top 5 preview
  const top = [...final].sort((a, b) => b.leadScore - a.leadScore).slice(0, 5);
  if (top.length) {
    log.step("Top leads");
    for (const l of top) {
      log.info(`[${l.leadScore}] ${l.name} (${l.category}) — ${l.hasWebsite ? l.website : "NO WEBSITE"}`);
      log.dim(`        ${l.pitchAngle}`);
    }
  }
}

function score(r: RawLead): number {
  return (r.website ? 2 : 0) + (r.phone ? 1 : 0) + (r.reviews ? 1 : 0);
}

/** Round-robin leads by category so a slice spans many industries, not one. */
function interleaveByCategory(leads: RawLead[]): RawLead[] {
  const byCat = new Map<string, RawLead[]>();
  for (const r of leads) {
    const list = byCat.get(r.category) ?? [];
    list.push(r);
    byCat.set(r.category, list);
  }
  const lists = [...byCat.values()];
  const out: RawLead[] = [];
  for (let i = 0; out.length < leads.length; i++) {
    let advanced = false;
    for (const list of lists) {
      if (i < list.length) {
        out.push(list[i]!);
        advanced = true;
      }
    }
    if (!advanced) break;
  }
  return out;
}

/** Keep only the top-N highest-scoring leads per industry. */
function capPerIndustry(leads: Lead[], n: number): Lead[] {
  const byCat = new Map<string, Lead[]>();
  for (const l of [...leads].sort((a, b) => b.leadScore - a.leadScore)) {
    const list = byCat.get(l.category) ?? [];
    if (list.length < n) {
      list.push(l);
      byCat.set(l.category, list);
    }
  }
  return [...byCat.values()].flat();
}

main().catch((err) => {
  log.err(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
});
