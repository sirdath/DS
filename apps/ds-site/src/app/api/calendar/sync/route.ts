import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { isCalendarSyncConfigured, listChanges, type GoogleChange } from "@/app/admin/lib/google-calendar";

// Pulls changes made in Google Calendar (e.g. on a founder's phone) back into the
// admin calendar. Guarded by CRON_SECRET (path is /api/* so it isn't behind the
// /admin auth). Writes Supabase directly via the service-role key — NOT through the
// server actions — so it never re-triggers the admin→Google write-through (no loop).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CRON_SECRET = process.env.CRON_SECRET;

function authorized(req: Request): boolean {
  if (!CRON_SECRET) return false;
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const token = bearer || new URL(req.url).searchParams.get("token");
  return token === CRON_SECRET;
}

function getDb() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function GET(req: Request): Promise<Response> {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }
  if (!isCalendarSyncConfigured()) {
    return NextResponse.json({ ok: true, skipped: "google calendar not configured" });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: false, error: "supabase env missing" }, { status: 500 });
  }

  const { data: state } = await db.from("calendar_sync_state").select("sync_token").eq("id", 1).maybeSingle();
  const syncToken = (state?.sync_token as string | null) ?? null;

  let result: { changes: GoogleChange[]; nextSyncToken: string | null };
  try {
    result = await listChanges(syncToken);
  } catch (err) {
    console.error("[calendar-sync] list failed:", err);
    return NextResponse.json({ ok: false, error: "google list failed" }, { status: 502 });
  }

  const now = new Date().toISOString();
  let applied = 0;
  let deleted = 0;

  for (const ch of result.changes) {
    if (ch.deleted) {
      const { error } = await db.from("calendar_events").delete().eq("google_event_id", ch.id);
      if (!error) deleted += 1;
      continue;
    }
    if (!ch.eventDate) continue; // no start date → skip malformed entries
    const { data: existing } = await db
      .from("calendar_events")
      .select("id")
      .eq("google_event_id", ch.id)
      .maybeSingle();
    if (existing) {
      // Update only the synced fields — preserve assignee / colour set in the admin.
      await db
        .from("calendar_events")
        .update({
          title: ch.title || "Untitled",
          description: ch.description,
          event_date: ch.eventDate,
          start_time: ch.startTime,
          synced_at: now,
        })
        .eq("id", existing.id);
    } else {
      await db.from("calendar_events").insert({
        title: ch.title || "Untitled",
        description: ch.description,
        event_date: ch.eventDate,
        start_time: ch.startTime,
        color: "default",
        assignee: "",
        google_event_id: ch.id,
        synced_at: now,
      });
    }
    applied += 1;
  }

  if (result.nextSyncToken) {
    await db.from("calendar_sync_state").upsert({ id: 1, sync_token: result.nextSyncToken, updated_at: now });
  }

  if (applied || deleted) {
    revalidatePath("/admin/calendar");
    revalidatePath("/admin");
  }

  return NextResponse.json({ ok: true, applied, deleted, total: result.changes.length });
}
