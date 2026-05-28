/**
 * Best-effort domain registration date via RDAP (the modern, JSON replacement for
 * WHOIS). Tells us roughly "when the site/domain was made". Works for most gTLDs
 * (.com/.net/.eu/…); some ccTLDs (incl. .gr) don't expose RDAP, so this returns
 * null for them — that's fine, the column just stays blank.
 */
import { safeHost } from "./util";

const cache = new Map<string, string | null>();

export async function domainCreated(url: string, timeoutMs = 7000): Promise<string | null> {
  const host = safeHost(url);
  if (!host) return null;
  // RDAP works on the registrable domain; strip subdomains to last two labels
  // (good enough for the common case; multi-part ccTLDs like .co.uk may miss).
  const parts = host.split(".");
  const domain = parts.length > 2 ? parts.slice(-2).join(".") : host;
  if (cache.has(domain)) return cache.get(domain)!;

  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    const res = await fetch(`https://rdap.org/domain/${domain}`, {
      headers: { Accept: "application/rdap+json" },
      signal: ctrl.signal,
      redirect: "follow",
    });
    clearTimeout(t);
    if (!res.ok) {
      cache.set(domain, null);
      return null;
    }
    const data = (await res.json()) as { events?: Array<{ eventAction: string; eventDate: string }> };
    const reg = data.events?.find((e) => e.eventAction === "registration");
    const iso = reg?.eventDate ? reg.eventDate.slice(0, 10) : null;
    cache.set(domain, iso);
    return iso;
  } catch {
    cache.set(domain, null);
    return null;
  }
}
