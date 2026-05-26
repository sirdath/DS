/** Polite homepage fetch: robots.txt check, timeout, redirect follow, size cap, timing. */
import { USER_AGENT } from "./util.js";

const MAX_BYTES = 2_500_000; // 2.5MB cap — we only need the homepage HTML

export interface FetchedSite {
  ok: boolean;
  finalUrl: string | null;
  status: number | null;
  headers: Headers | null;
  html: string;
  ttfbMs: number | null;
  bytes: number;
  blockedByRobots: boolean;
  error: string | null;
}

/** Minimal robots.txt check: is the homepage path "/" disallowed for everyone? */
async function isAllowed(origin: string, timeoutMs: number): Promise<boolean> {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), Math.min(timeoutMs, 8000));
    const res = await fetch(`${origin}/robots.txt`, {
      headers: { "User-Agent": USER_AGENT },
      signal: ctrl.signal,
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) return true; // no robots.txt → allowed
    const text = (await res.text()).slice(0, 100_000);
    // Walk the file tracking the active user-agent group; honour `*` and our UA.
    let appliesToUs = false;
    let disallowRoot = false;
    for (const lineRaw of text.split(/\r?\n/)) {
      const line = lineRaw.replace(/#.*$/, "").trim();
      if (!line) continue;
      const [field, ...rest] = line.split(":");
      const key = field?.toLowerCase().trim();
      const value = rest.join(":").trim();
      if (key === "user-agent") {
        appliesToUs = value === "*" || /ds2-leadfinder/i.test(value);
      } else if (key === "disallow" && appliesToUs) {
        if (value === "/") disallowRoot = true;
      } else if (key === "allow" && appliesToUs && value === "/") {
        disallowRoot = false;
      }
    }
    return !disallowRoot;
  } catch {
    return true; // robots fetch failed → don't block
  }
}

export async function fetchSite(rawUrl: string, timeoutMs: number, respectRobots: boolean): Promise<FetchedSite> {
  const base: FetchedSite = {
    ok: false, finalUrl: null, status: null, headers: null, html: "",
    ttfbMs: null, bytes: 0, blockedByRobots: false, error: null,
  };

  let origin: string;
  try {
    origin = new URL(rawUrl).origin;
  } catch {
    return { ...base, error: "invalid URL" };
  }

  if (respectRobots && !(await isAllowed(origin, timeoutMs))) {
    return { ...base, blockedByRobots: true, error: "blocked by robots.txt" };
  }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  const started = Date.now();
  try {
    const res = await fetch(rawUrl, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/xhtml+xml" },
      redirect: "follow",
      signal: ctrl.signal,
    });
    const ttfbMs = Date.now() - started;

    // Stream the body but stop at the size cap.
    const reader = res.body?.getReader();
    let received = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          received += value.length;
          if (received >= MAX_BYTES) {
            void reader.cancel();
            break;
          }
        }
      }
    }
    clearTimeout(timer);
    const html = Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
    return {
      ok: res.ok,
      finalUrl: res.url || rawUrl,
      status: res.status,
      headers: res.headers,
      html,
      ttfbMs,
      bytes: received,
      blockedByRobots: false,
      error: res.ok ? null : `HTTP ${res.status}`,
    };
  } catch (err) {
    clearTimeout(timer);
    const msg = err instanceof Error ? (err.name === "AbortError" ? "timeout" : err.message) : "fetch error";
    return { ...base, error: msg };
  }
}
