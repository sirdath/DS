import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

// Node runtime: needs node:crypto + outbound fetch to the Telegram Bot API.
export const runtime = "nodejs";

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const CHAT_ID = process.env.TELEGRAM_CHAT_ID;
const SIGNING_SECRET = process.env.CONTACT_SIGNING_SECRET ?? "dev-only-insecure-secret";
const DEV_MODE = !BOT_TOKEN || !CHAT_ID;

const NAME_MAX = 80;
const EMAIL_MAX = 160;
const COMPANY_MAX = 100;
const COUNTRY_MAX = 64;
const MESSAGE_MAX = 2000;

// Best-effort per-instance rate limit. Honest limitation: serverless instances
// don't share this map — a hard global limit would need Upstash/Supabase.
const RATE_WINDOW_MS = 30_000;
const RATE_MAX = 6;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < RATE_WINDOW_MS);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > RATE_MAX;
}

// Drop C0/C1 control chars (keep tab=9, newline=10), trim, cap length.
function clean(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  let out = "";
  for (const ch of value) {
    const c = ch.codePointAt(0) ?? 0;
    if ((c < 32 && c !== 9 && c !== 10) || (c >= 127 && c <= 159)) continue;
    out += ch;
  }
  return out.trim().slice(0, max);
}

function signThread(id: number): string {
  return createHmac("sha256", SIGNING_SECRET).update(String(id)).digest("hex");
}

function verifyThread(id: unknown, sig: unknown): number | null {
  if (typeof id !== "number" || !Number.isFinite(id) || typeof sig !== "string") return null;
  const expected = signThread(id);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length) return null;
  return timingSafeEqual(a, b) ? id : null;
}

async function tg(method: string, body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const json = (await res.json()) as { ok: boolean; result?: unknown; description?: string };
  if (!json.ok) throw new Error(`telegram ${method} failed: ${json.description ?? res.status}`);
  return (json.result ?? {}) as Record<string, unknown>;
}

export async function POST(request: Request): Promise<Response> {
  // Same-origin guard for a state-changing endpoint.
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host && new URL(origin).host !== host) {
    return NextResponse.json({ ok: false, error: "bad origin" }, { status: 403 });
  }

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";
  if (rateLimited(ip)) {
    return NextResponse.json({ ok: false, error: "Too many messages, give it a moment." }, { status: 429 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ ok: false, error: "bad request" }, { status: 400 });
  }

  // Honeypot — bots fill hidden fields; humans never see it.
  if (clean(payload.website, 1)) {
    return NextResponse.json({ ok: true, delivered: false });
  }

  const name = clean(payload.name, NAME_MAX);
  const email = clean(payload.email, EMAIL_MAX);
  const company = clean(payload.company, COMPANY_MAX);
  const country = clean(payload.country, COUNTRY_MAX);
  const message = clean(payload.message, MESSAGE_MAX);
  const firstMessage = payload.first === true;

  if (!name) return NextResponse.json({ ok: false, error: "Please add your name." }, { status: 400 });
  if (!message) return NextResponse.json({ ok: false, error: "Write a message first." }, { status: 400 });
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ ok: false, error: "That email doesn't look right." }, { status: 400 });
  }

  const validThread = verifyThread(payload.threadId, payload.threadSig);
  const stamp = new Date().toLocaleString("en-GB", { timeZone: "Europe/London" });

  // ── Dev mode: no bot configured. Log + return a signed fake thread so the
  //    whole UX is testable locally before Telegram is wired. ──
  if (DEV_MODE) {
    const id = validThread ?? Math.floor(Math.random() * 1e6);
    console.info(
      `[contact:dev] ${validThread ? "msg" : "NEW"} from ${name}` +
        `${company ? ` @ ${company}` : ""}${country ? ` (${country})` : ""} ` +
        `<${email || "no email"}> (thread ${id}): ${message}`
    );
    return NextResponse.json({ ok: true, delivered: false, devMode: true, threadId: id, threadSig: signThread(id) });
  }

  try {
    let threadId = validThread;

    if (threadId === null && firstMessage) {
      try {
        const topic = await tg("createForumTopic", {
          chat_id: CHAT_ID,
          name: `🌐 ${name}${company ? ` · ${company}` : ""} · ${stamp}`.slice(0, 128),
        });
        if (typeof topic.message_thread_id === "number") threadId = topic.message_thread_id;
      } catch {
        threadId = null; // group has no Topics → graceful fallback to plain messages
      }
    }

    const header =
      firstMessage || threadId === null
        ? `👤 ${name}\n` +
          `🏢 ${company || "no company given"}\n` +
          `📍 ${country || "location not given"}\n` +
          `✉️ ${email || "no email given"}\n🕒 ${stamp}\n\n`
        : "";
    const text = (threadId === null && !firstMessage ? `[${name}] ` : header) + message;

    await tg("sendMessage", {
      chat_id: CHAT_ID,
      text,
      disable_web_page_preview: true,
      ...(threadId !== null ? { message_thread_id: threadId } : {}),
    });

    return NextResponse.json({
      ok: true,
      delivered: true,
      ...(threadId !== null ? { threadId, threadSig: signThread(threadId) } : {}),
    });
  } catch (err) {
    console.error("[contact] delivery failed:", err);
    return NextResponse.json(
      { ok: false, error: "Couldn't send that just now. Email hello@ds2-consulting.com and we'll pick it up." },
      { status: 502 }
    );
  }
}
