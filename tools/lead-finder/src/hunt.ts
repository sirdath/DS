/**
 * Ugly-site hunt: discover real business websites for an industry across areas,
 * screenshot + heuristically score each, store in redesign_targets (vision pending).
 * Visual scoring is a separate Workflow pass (subagent per screenshot).
 *
 * Run: SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… \
 *      npx tsx src/hunt.ts --industry gym --area "Kifisia, Greece" --radius 3000 --cap 40
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { geocodeArea } from "./sources/geocode.js";
import { discoverOverpass } from "./sources/overpass.js";
import { fetchSite } from "./fetch-site.js";
import { analyseSite } from "./analyze.js";
import { screenshot } from "./screenshot.js";
import { log, mapPool, normaliseUrl, sleep } from "./util.js";
import { resolveAreas } from "./presets.js";
import { makeClient, claimArea, finishArea } from "./sink-supabase.js";
import { existingWebsites, shotKey, uploadShot, insertTarget } from "./sink-redesign.js";
import type { RawLead } from "./types.js";

function arg(flag: string, def: string): string {
  const i = process.argv.indexOf(flag);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1]! : def;
}

async function main(): Promise<void> {
  const industry = arg("--industry", "gym");
  const areaArg = arg("--area", "Kifisia, Greece");
  const radius = Number(arg("--radius", "3000"));
  const cap = Number(arg("--cap", "60")); // max sites screenshotted per area
  const areas = resolveAreas(areaArg);
  const sb = makeClient();
  const SHOTS_DIR = join(process.cwd(), "shots"); // local copies for the vision-scoring pass
  await mkdir(SHOTS_DIR, { recursive: true });

  log.step(`Hunt: industry="${industry}" · ${areas.length} area(s) · cap ${cap}/area`);
  const already = await existingWebsites(sb, industry);
  log.dim(`  ${already.size} ${industry} sites already in the table`);
  let totalInserted = 0;

  for (const area of areas) {
    const huntKey = `hunt:${industry}:${area}`;
    if (!(await claimArea(sb, huntKey).catch(() => false))) {
      log.dim(`skip "${area}" (${industry}) — already hunted`);
      continue;
    }
    try {
      const point = await geocodeArea(area);
      await sleep(1200);
      const raw = await discoverOverpass(point, [industry], radius);
      const seen = new Set<string>();
      const targets = raw
        .map((r) => ({ r, url: normaliseUrl(r.website) }))
        .filter((x): x is { r: RawLead; url: string } => {
          if (!x.url || already.has(x.url) || seen.has(x.url)) return false;
          seen.add(x.url);
          return true;
        })
        .slice(0, cap);

      let inserted = 0;
      await mapPool(targets, 3, async ({ r, url }) => {
        const fetched = await fetchSite(url, 12000, true);
        const analysis = analyseSite(fetched);
        const png = await screenshot(fetched.finalUrl ?? url);
        let screenshotPath: string | null = null;
        if (png) {
          const key = shotKey(url);
          await writeFile(join(SHOTS_DIR, key), png).catch(() => {}); // local copy for vision pass
          if (await uploadShot(sb, key, png)) screenshotPath = key;
        }
        await insertTarget(sb, {
          lead: { ...r, website: url },
          industry,
          area,
          heuristicScore: analysis.reachable ? analysis.ugliness : null,
          tags: analysis.signals.map((s) => s.tag),
          tech: analysis.tech,
          screenshotPath,
        });
        inserted++;
      });
      await finishArea(sb, huntKey, inserted, true);
      totalInserted += inserted;
      log.ok(`${area} (${industry}) → ${targets.length} sites, ${inserted} stored (total ${totalInserted})`);
    } catch (err) {
      await finishArea(sb, huntKey, 0, false);
      log.err(`${area} (${industry}) failed: ${err instanceof Error ? err.message : String(err)}`);
    }
    await sleep(8000);
  }
  log.step(`Hunt done — ${totalInserted} sites stored. Next: run the vision-scoring Workflow.`);
}

main().catch((err) => {
  log.err(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
});
