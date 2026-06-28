import { NextResponse } from "next/server";
import { loadSiteActivity, type SiteActivity } from "@/app/admin/lib/site-activity";

// Node runtime: outbound fetch to Telegram + reads the service-role Supabase key.
// Path is /api/admin/* so the /admin/* auth middleware does NOT gate it — the route
// guards itself with CRON_SECRET instead (so only the scheduled job can trigger it).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.ADMIN_TELEGRAM_CHAT_ID;
const CRON_SECRET = process.env.CRON_SECRET;

function authorized(req: Request): boolean {
  if (!CRON_SECRET) return false; // never run unguarded
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const token = bearer || new URL(req.url).searchParams.get("token");
  return token === CRON_SECRET;
}

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatDigest(activity: SiteActivity[]): string {
  const date = new Date().toLocaleDateString("en-GB", {
    timeZone: "Europe/Athens",
    weekday: "short",
    day: "numeric",
    month: "short",
  });
  const lines: string[] = [`<b>DS2 daily digest</b> · ${date}`, ""];
  for (const a of activity) {
    const delta = a.today - a.yesterday;
    const arrow = delta > 0 ? `▲ ${delta}` : delta < 0 ? `▼ ${Math.abs(delta)}` : "±0";
    lines.push(`<b>${esc(a.site.name)}</b>: ${a.today} today (${arrow} vs yesterday)`);
    lines.push(`   ${a.last7} views · ${a.uniqueVisitors7} visitors in 7d`);
  }
  lines.push("");
  lines.push("https://www.ds2-consulting.com/admin");
  return lines.join("\n");
}

async function send(text: string): Promise<void> {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      chat_id: CHAT_ID,
      text,
      parse_mode: "HTML",
      disable_web_page_preview: true,
    }),
  });
  const json = (await res.json()) as { ok: boolean; description?: string };
  if (!json.ok) throw new Error(`telegram: ${json.description ?? res.status}`);
}

export async function GET(req: Request): Promise<Response> {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const activity = await loadSiteActivity();
  const text = formatDigest(activity);

  // Dev / unconfigured: log instead of sending so the flow is testable end-to-end
  // before the Telegram chat + token are wired.
  if (!BOT_TOKEN || !CHAT_ID) {
    console.info("[digest:dev]\n" + text);
    return NextResponse.json({ ok: true, delivered: false, devMode: true });
  }

  try {
    await send(text);
    return NextResponse.json({ ok: true, delivered: true });
  } catch (err) {
    console.error("[digest] send failed:", err);
    return NextResponse.json({ ok: false, error: "send failed" }, { status: 502 });
  }
}
