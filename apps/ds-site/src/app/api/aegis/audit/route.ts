/**
 * Aegis audit backend. Runs the engine server-side (PageSpeed Insights fetch +
 * Claude synthesis; keys never reach the browser). Auth: a Supabase session is
 * required when Supabase is configured; keyless local dev is allowed. Rate-limited
 * (audits are expensive) and same-origin-guarded. No SSRF surface — PageSpeed
 * fetches the target URL on Google's infra, not ours.
 */

import { auditSite, type Strategy } from "@ds/aegis";
import { NextResponse } from "next/server";
import { getSessionUser } from "../../../admin/lib/supabase-server";

export const runtime = "nodejs";
export const maxDuration = 120; // PSI + synthesis can take a while

const IP_WINDOW_MS = 60_000;
const IP_MAX = 8; // audits / minute / IP / instance
const ipHits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  if (ipHits.size > 5000) ipHits.clear();
  const arr = (ipHits.get(ip) ?? []).filter((t) => now - t < IP_WINDOW_MS);
  arr.push(now);
  ipHits.set(ip, arr);
  return arr.length > IP_MAX;
}

function clientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  return xff ? (xff.split(",")[0]?.trim() ?? "unknown") : "unknown";
}

function sameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.headers.get("host");
  } catch {
    return false;
  }
}

function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

/** Normalise + validate the input into a public http(s) URL, or null. */
function normaliseUrl(input: unknown): string | null {
  if (typeof input !== "string" || input.trim() === "") return null;
  const raw = input.trim();
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withScheme);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    if (!u.hostname.includes(".")) return null; // needs a real public host
    return u.toString();
  } catch {
    return null;
  }
}

interface RequestBody {
  url?: unknown;
  strategy?: unknown;
}

export async function POST(request: Request): Promise<Response> {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Bad origin." }, { status: 403 });
  if (rateLimited(clientIp(request))) {
    return NextResponse.json({ error: "Too many audits — give it a minute." }, { status: 429 });
  }

  if (hasSupabaseEnv()) {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  } else if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Workspace is not configured." }, { status: 503 });
  }

  let body: RequestBody;
  try {
    body = (await request.json()) as RequestBody;
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }

  const url = normaliseUrl(body.url);
  if (!url) return NextResponse.json({ error: "Enter a valid website address." }, { status: 400 });
  const strategy: Strategy = body.strategy === "desktop" ? "desktop" : "mobile";
  const scanOnly = !process.env.ANTHROPIC_API_KEY;

  try {
    const report = await auditSite(url, { strategy, scanOnly });
    return NextResponse.json({ report });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("429")) {
      return NextResponse.json(
        { error: "The scan service is over its quota right now. Set PAGESPEED_API_KEY for reliable scans." },
        { status: 503 },
      );
    }
    return NextResponse.json({ error: "Couldn't complete the audit — check the address and try again." }, { status: 502 });
  }
}
