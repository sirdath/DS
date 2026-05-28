/**
 * Bulk-analyze every pending website lead in Supabase: fetch the homepage, score
 * ugliness + fingerprint the stack, write it back. For the thousands of leads a
 * full sweep produces (the in-browser "Analyze pending" button is too slow at scale).
 *
 * Run:  SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npx tsx src/analyze-pending.ts
 */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RawLead } from "./types.js";
import { fetchSite } from "./fetch-site.js";
import { analyseSite } from "./analyze.js";
import { buildLead } from "./score.js";
import { mapPool, log } from "./util.js";
import { makeClient } from "./sink-supabase.js";

const BATCH = 100;
const CONCURRENCY = 10;
const TIMEOUT_MS = 8000;
const COLS = "id, source, source_id, name, category, area, website, phone, email, address, lat, lon, rating, reviews";

interface Row {
  id: string; source: string; source_id: string | null; name: string; category: string | null;
  area: string | null; website: string | null; phone: string | null; email: string | null;
  address: string | null; lat: number | null; lon: number | null; rating: number | null; reviews: number | null;
}

function rowToRaw(r: Row): RawLead {
  return {
    source: r.source === "google" ? "google" : "osm",
    sourceId: r.source_id ?? r.id, name: r.name, category: r.category ?? "business",
    website: r.website, phone: r.phone, email: r.email, address: r.address,
    area: r.area, lat: r.lat, lon: r.lon, rating: r.rating, reviews: r.reviews,
  };
}

async function nextBatch(sb: SupabaseClient): Promise<Row[]> {
  const { data, error } = await sb
    .from("marketing_leads")
    .select(COLS)
    .eq("analysis_status", "pending")
    .not("website", "is", null)
    .order("lead_score", { ascending: false })
    .limit(BATCH);
  if (error) throw new Error(error.message);
  return (data ?? []) as Row[];
}

async function main(): Promise<void> {
  const sb = makeClient();
  let done = 0;
  log.step("Bulk-analyzing pending website leads");
  for (let loop = 0; loop < 2000; loop++) {
    const rows = await nextBatch(sb);
    if (rows.length === 0) break;
    await mapPool(rows, CONCURRENCY, async (row) => {
      try {
        const fetched = await fetchSite(row.website as string, TIMEOUT_MS, true);
        const analysis = analyseSite(fetched);
        const lead = buildLead(rowToRaw(row), analysis);
        await sb.from("marketing_leads").update({
          lead_score: lead.leadScore, ugliness: analysis.ugliness, priority: lead.priority,
          tags: lead.tags, tech: analysis.tech, pitch_angle: lead.pitchAngle, analysis_status: "done",
        }).eq("id", row.id);
      } catch {
        await sb.from("marketing_leads").update({ analysis_status: "failed" }).eq("id", row.id);
      }
    });
    done += rows.length;
    log.ok(`analyzed ${done} (batch of ${rows.length})`);
  }
  log.step(`Done — analyzed ${done} websites.`);
}

main().catch((err) => {
  log.err(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
});
