import { NextResponse } from "next/server";
import { assertAdmin } from "../../../../admin/lib/assert-admin";
import { getSupabaseServerClient } from "../../../../admin/lib/supabase-server";
import { geocodeArea } from "../../../../../lib/lead-finder/sources/geocode";
import { discoverOverpass } from "../../../../../lib/lead-finder/sources/overpass";
import { buildLead } from "../../../../../lib/lead-finder/score";
import { areaKey, leadToRow, DEFAULT_CATEGORIES } from "../../../../../lib/lead-finder/db-map";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST { area, categories?, radius? } → discover + insert leads; refuse repeat areas. */
export async function POST(request: Request): Promise<Response> {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { area?: string; categories?: string[]; radius?: number };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }

  const area = (body.area ?? "").trim();
  if (area.length < 3) {
    return NextResponse.json({ ok: false, error: "Enter an area, e.g. \"Kifisia, Greece\"" }, { status: 400 });
  }
  const key = areaKey(area);
  const categories = body.categories?.length ? body.categories : DEFAULT_CATEGORIES;
  const radius = Math.min(Math.max(body.radius ?? 3000, 500), 8000);

  const supabase = await getSupabaseServerClient();

  // Claim the area — the unique index on area_key blocks a second run.
  const claim = await supabase
    .from("lead_areas")
    .insert({ area_key: key, area_label: area, status: "running" })
    .select("id")
    .single();
  if (claim.error) {
    if (claim.error.code === "23505") {
      return NextResponse.json({ ok: false, error: `"${area}" has already been searched.` }, { status: 409 });
    }
    return NextResponse.json({ ok: false, error: claim.error.message }, { status: 500 });
  }

  try {
    const point = await geocodeArea(area);
    const raw = await discoverOverpass(point, categories, radius);
    const rows = raw.map((r) => leadToRow(buildLead(r, null)));

    let inserted = 0;
    if (rows.length) {
      const { error, count } = await supabase
        .from("marketing_leads")
        .upsert(rows, { onConflict: "source,source_id", ignoreDuplicates: true, count: "exact" });
      if (error) throw new Error(error.message);
      inserted = count ?? rows.length;
    }

    await supabase
      .from("lead_areas")
      .update({ status: "done", lead_count: rows.length })
      .eq("area_key", key);

    const noWebsite = rows.filter((r) => !r.has_website).length;
    return NextResponse.json({ ok: true, area, found: rows.length, inserted, noWebsite });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "discovery failed";
    await supabase.from("lead_areas").update({ status: "failed", error: msg }).eq("area_key", key);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
