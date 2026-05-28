/** Storage upload + redesign_targets upsert for the ugly-site hunt. */
import { createHash } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { RawLead } from "./types.js";
import { safeHost } from "./util.js";

const BUCKET = "redesign-shots";

export function shotKey(website: string): string {
  const host = safeHost(website) || "site";
  const hash = createHash("sha1").update(website).digest("hex").slice(0, 8);
  return `${host}-${hash}.png`;
}

/** Websites already in the table (so we don't re-screenshot) for a given industry. */
export async function existingWebsites(sb: SupabaseClient, industry: string): Promise<Set<string>> {
  const { data } = await sb.from("redesign_targets").select("website").eq("industry", industry).limit(20000);
  return new Set((data ?? []).map((r) => (r as { website: string }).website));
}

export async function uploadShot(sb: SupabaseClient, key: string, png: Buffer): Promise<boolean> {
  const { error } = await sb.storage.from(BUCKET).upload(key, png, { contentType: "image/png", upsert: true });
  if (error) {
    console.warn(`upload ${key} failed: ${error.message}`);
    return false;
  }
  return true;
}

export interface TargetInput {
  lead: RawLead;
  industry: string;
  area: string;
  heuristicScore: number | null;
  tags: string[];
  tech: string[];
  screenshotPath: string | null;
}

export async function insertTarget(sb: SupabaseClient, t: TargetInput): Promise<void> {
  const l = t.lead;
  const { error } = await sb.from("redesign_targets").upsert(
    {
      industry: t.industry,
      area: t.area,
      name: l.name,
      website: l.website,
      phone: l.phone,
      email: l.email,
      address: l.address,
      lat: l.lat,
      lon: l.lon,
      source: l.source,
      screenshot_path: t.screenshotPath,
      heuristic_score: t.heuristicScore,
      tags: t.tags,
      tech: t.tech,
      vision_status: t.screenshotPath ? "pending" : "failed",
    },
    { onConflict: "source,website", ignoreDuplicates: true },
  );
  if (error) console.warn(`insert ${l.website} failed: ${error.message}`);
}
