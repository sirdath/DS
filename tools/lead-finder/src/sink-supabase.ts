/**
 * Supabase sink for the sweep: writes discovered leads straight into the
 * `marketing_leads` table and records the area in `lead_areas`. Uses the
 * service-role key (bypasses RLS) — local/CLI use only, never shipped to the browser.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Lead } from "./types.js";
import { leadStableKey } from "./util.js";

export function makeClient(): SupabaseClient {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

export function areaKey(area: string): string {
  return area.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Claim an area; returns false if it was already searched (unique area_key). */
export async function claimArea(sb: SupabaseClient, area: string): Promise<boolean> {
  const { error } = await sb
    .from("lead_areas")
    .insert({ area_key: areaKey(area), area_label: area, status: "running" });
  if (error) {
    if (error.code === "23505") return false; // already exists
    throw new Error(error.message);
  }
  return true;
}

export async function finishArea(sb: SupabaseClient, area: string, count: number, ok = true): Promise<void> {
  await sb
    .from("lead_areas")
    .update({ status: ok ? "done" : "failed", lead_count: count })
    .eq("area_key", areaKey(area));
}

/** Upsert leads; `areaLabel` is stamped as each lead's area so the admin can filter by it. */
export async function upsertLeads(sb: SupabaseClient, leads: Lead[], areaLabel: string): Promise<number> {
  if (!leads.length) return 0;
  const rows = leads.map((l) => ({
    source: l.source,
    source_id: l.sourceId,
    name: l.name,
    category: l.category,
    area: areaLabel,
    website: l.website,
    has_website: l.hasWebsite,
    phone: l.phone,
    email: l.email,
    address: l.address,
    lat: l.lat,
    lon: l.lon,
    rating: l.rating ?? null,
    reviews: l.reviews ?? null,
    lead_score: l.leadScore,
    ugliness: l.analysis?.ugliness ?? null,
    priority: l.priority,
    tags: l.tags,
    tech: l.analysis?.tech ?? [],
    pitch_angle: l.pitchAngle,
    maps_url: l.mapsUrl,
    analysis_status: l.analysis ? "done" : l.hasWebsite ? "pending" : "na",
    _key: leadStableKey(l.source, l.sourceId), // not a column — dropped below
  })).map(({ _key, ...row }) => row);

  const { error, count } = await sb
    .from("marketing_leads")
    .upsert(rows, { onConflict: "source,source_id", ignoreDuplicates: true, count: "exact" });
  if (error) throw new Error(error.message);
  return count ?? rows.length;
}
