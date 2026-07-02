// Pinterest lane — REFERENCE ONLY. Drives a real Chromium with YOUR persistent
// login (Pinterest has no usable search API and gates browsing behind auth).
// Output is private moodboard material: never ship these images on a page.
import { homedir } from "node:os";
import { join } from "node:path";

const PROFILE_DIR = join(homedir(), ".ds2-inspo-chrome");

/**
 * Turn a Pinterest thumbnail URL into candidate full-res URLs, largest first.
 * `originals/` holds the true source but may be a different extension than the
 * .jpg thumbnail (png/webp/gif), so we try each; then step down through the
 * fixed grid sizes before falling back to the thumbnail itself.
 */
function upscaleCandidates(url) {
  const sizeRe = /(i\.pinimg\.com\/)(\d+x\d*|\d+x|originals)(\/)/;
  if (!sizeRe.test(url)) return [url];
  const swap = (size) => url.replace(sizeRe, `$1${size}$3`);
  const origBase = swap("originals").replace(/\.(jpe?g|png|webp|gif|avif)$/i, "");
  return [
    `${origBase}.jpg`,
    `${origBase}.png`,
    `${origBase}.webp`,
    `${origBase}.gif`,
    swap("736x"),
    swap("564x"),
    swap("474x"),
    url,
  ];
}

/** Resolve to the first candidate URL that actually exists (200 + image body). */
async function firstLive(candidates) {
  for (const c of candidates) {
    try {
      const res = await fetch(c, { method: "HEAD", headers: { referer: "https://www.pinterest.com/" } });
      if (res.ok && (res.headers.get("content-type") || "").startsWith("image/")) return c;
    } catch {
      /* try next */
    }
  }
  return candidates[candidates.length - 1];
}

/**
 * Collect up to `count` pin image URLs for a board URL or search query.
 * Returns normalized {url, title, source} items (full-res resolved).
 */
export async function collectPins(target, { count = 30, headless = false } = {}) {
  let chromium;
  try {
    ({ chromium } = await import("playwright"));
  } catch {
    throw new Error(
      "Pinterest lane needs Playwright. Install it once:\n" +
        "  pnpm add -D playwright && pnpm exec playwright install chromium"
    );
  }

  const isUrl = /^https?:\/\//i.test(target);
  const startUrl = isUrl
    ? target
    : `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(target)}`;

  const ctx = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless,
    viewport: { width: 1400, height: 1000 },
    args: ["--disable-blink-features=AutomationControlled"],
  });
  const page = ctx.pages()[0] || (await ctx.newPage());

  try {
    await page.goto(startUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });

    // Login gate: if Pinterest shows the auth wall, pause for a manual sign-in
    // (persisted to the profile, so this only happens the first time).
    if (/\/login\/?|\/business\//.test(page.url()) || (await page.$('[data-test-id="registerForm"]'))) {
      console.log(
        "\n  Pinterest wants you to sign in. A browser window is open —\n" +
          "  log in there, then come back. Waiting up to 3 minutes…\n"
      );
      await page
        .waitForSelector('img[src*="i.pinimg.com"]', { timeout: 180_000 })
        .catch(() => {
          throw new Error("Timed out waiting for login. Run again after signing in.");
        });
    }

    // Scroll-collect until we have enough unique pins (or the page stops growing).
    const found = new Map(); // thumbnailUrl -> {title, source}
    let stale = 0;
    for (let round = 0; round < 60 && found.size < count && stale < 6; round++) {
      const batch = await page.$$eval('img[src*="i.pinimg.com"]', (imgs) =>
        imgs.map((img) => {
          const a = img.closest("a[href]");
          return {
            src: img.getAttribute("src") || "",
            alt: img.getAttribute("alt") || "",
            href: a ? a.getAttribute("href") : "",
          };
        })
      );
      const before = found.size;
      for (const b of batch) {
        if (!b.src || found.has(b.src)) continue;
        found.set(b.src, {
          title: b.alt,
          source: b.href ? new URL(b.href, "https://www.pinterest.com").href : startUrl,
        });
      }
      stale = found.size === before ? stale + 1 : 0;
      await page.mouse.wheel(0, 2400);
      await page.waitForTimeout(900);
    }

    const entries = [...found.entries()].slice(0, count);
    process.stdout.write(`  resolving ${entries.length} full-res images`);
    const items = [];
    for (const [thumb, meta] of entries) {
      const url = await firstLive(upscaleCandidates(thumb));
      items.push({ url, title: meta.title, author: "Pinterest (reference)", license: "reference-only", source: meta.source });
      process.stdout.write(".");
    }
    process.stdout.write("\n");
    return items;
  } finally {
    await ctx.close();
  }
}
