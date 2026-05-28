/**
 * Overnight screenshot pass: for every redesign_target without a screenshot yet,
 * capture the homepage, save it locally (for the vision pass) and upload to the
 * redesign-shots bucket (for the admin gallery). Resumable + crash-guarded.
 *
 * Run: SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npx tsx src/shoot-pending.ts
 */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { SupabaseClient } from "@supabase/supabase-js";
import { screenshot } from "./screenshot.js";
import { mapPool, log } from "./util.js";
import { makeClient } from "./sink-supabase.js";
import { shotKey, uploadShot } from "./sink-redesign.js";

// undici can throw from a socket callback on malformed HTTP — keep the run alive.
process.on("uncaughtException", (e) => log.warn(`uncaught (continuing): ${e instanceof Error ? e.message : String(e)}`));
process.on("unhandledRejection", (e) => log.warn(`unhandled (continuing): ${e instanceof Error ? e.message : String(e)}`));

const BATCH = 80;
const CONCURRENCY = 4;
const WINDOW = "1100,720"; // a touch smaller → keeps PNGs ~250-350KB (storage budget)
const SHOTS_DIR = join(process.cwd(), "shots");

interface Row { id: string; website: string }

async function nextBatch(sb: SupabaseClient): Promise<Row[]> {
  const { data, error } = await sb
    .from("redesign_targets")
    .select("id, website")
    .is("screenshot_path", null)
    .eq("vision_status", "pending")
    .order("heuristic_score", { ascending: false, nullsFirst: false })
    .limit(BATCH);
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

async function main(): Promise<void> {
  const sb = makeClient();
  await mkdir(SHOTS_DIR, { recursive: true });
  let shot = 0;
  let failed = 0;
  log.step("Overnight screenshot pass");
  for (let loop = 0; loop < 5000; loop++) {
    const rows = await nextBatch(sb);
    if (rows.length === 0) break;
    await mapPool(rows, CONCURRENCY, async (row) => {
      const png = await screenshot(row.website, 22000, WINDOW);
      if (!png) {
        await sb.from("redesign_targets").update({ vision_status: "failed" }).eq("id", row.id);
        failed++;
        return;
      }
      const key = shotKey(row.website);
      await writeFile(join(SHOTS_DIR, key), png).catch(() => {});
      const ok = await uploadShot(sb, key, png);
      await sb.from("redesign_targets").update({ screenshot_path: ok ? key : key }).eq("id", row.id);
      shot++;
    });
    if (shot % 160 < CONCURRENCY) log.ok(`shot ${shot}, failed ${failed}`);
  }
  log.step(`Screenshot pass done — ${shot} captured, ${failed} failed/unreachable.`);
}

main().catch((err) => {
  log.err(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
});
