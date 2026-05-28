import { NextResponse } from "next/server";
import { assertAdmin } from "../../../../admin/lib/assert-admin";
import { getSupabaseServerClient } from "../../../../admin/lib/supabase-server";
import { fetchSite } from "../../../../../lib/lead-finder/fetch-site";
import { analyseSite } from "../../../../../lib/lead-finder/analyze";
import { buildLead } from "../../../../../lib/lead-finder/score";
import { mapPool } from "../../../../../lib/lead-finder/util";
import { rowToRaw, type StoredLeadRow } from "../../../../../lib/lead-finder/db-map";

export const runtime = "nodejs";
export const maxDuration = 60;

// Conservative so a single invocation finishes well within the free-tier limit;
// the UI calls this repeatedly until `remaining` hits 0.
const BATCH = 8;
const CONCURRENCY = 8;
const TIMEOUT_MS = 7000;

const COLS = "id, source, source_id, name, category, area, website, phone, email, address, lat, lon, rating, reviews";

/** POST → analyse up to BATCH pending websites, write scores back, return {processed, remaining}. */
export async function POST(): Promise<Response> {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await getSupabaseServerClient();

  const { data, error } = await supabase
    .from("marketing_leads")
    .select(COLS)
    .eq("analysis_status", "pending")
    .not("website", "is", null)
    .order("lead_score", { ascending: false })
    .limit(BATCH);
  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  const rows = (data ?? []) as StoredLeadRow[];

  await mapPool(rows, CONCURRENCY, async (row) => {
    try {
      const fetched = await fetchSite(row.website as string, TIMEOUT_MS, true);
      const analysis = analyseSite(fetched);
      const lead = buildLead(rowToRaw(row), analysis);
      await supabase
        .from("marketing_leads")
        .update({
          lead_score: lead.leadScore,
          ugliness: analysis.ugliness,
          priority: lead.priority,
          tags: lead.tags,
          tech: analysis.tech,
          pitch_angle: lead.pitchAngle,
          analysis_status: "done",
        })
        .eq("id", row.id);
    } catch {
      await supabase.from("marketing_leads").update({ analysis_status: "failed" }).eq("id", row.id);
    }
  });

  const { count } = await supabase
    .from("marketing_leads")
    .select("id", { count: "exact", head: true })
    .eq("analysis_status", "pending")
    .not("website", "is", null);

  return NextResponse.json({ ok: true, processed: rows.length, remaining: count ?? 0 });
}
