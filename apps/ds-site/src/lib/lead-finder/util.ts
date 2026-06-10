/** Small zero-dependency helpers: logging, concurrency, polite delays. */

const COLORS = { dim: "\x1b[2m", cyan: "\x1b[36m", green: "\x1b[32m", yellow: "\x1b[33m", red: "\x1b[31m", reset: "\x1b[0m" };

export const log = {
  info: (m: string) => console.log(`${COLORS.cyan}›${COLORS.reset} ${m}`),
  step: (m: string) => console.log(`\n${COLORS.cyan}■${COLORS.reset} ${m}`),
  ok: (m: string) => console.log(`${COLORS.green}✓${COLORS.reset} ${m}`),
  warn: (m: string) => console.log(`${COLORS.yellow}!${COLORS.reset} ${m}`),
  err: (m: string) => console.log(`${COLORS.red}✗${COLORS.reset} ${m}`),
  dim: (m: string) => console.log(`${COLORS.dim}${m}${COLORS.reset}`),
};

export const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

/**
 * Run an async task over items with a fixed concurrency cap and a per-task
 * delay floor, so we never hammer a host. Returns results in input order.
 */
export async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>,
  onProgress?: (done: number, total: number) => void,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  let done = 0;
  const total = items.length;

  async function runner(): Promise<void> {
    while (true) {
      const i = next++;
      if (i >= total) return;
      try {
        results[i] = await worker(items[i] as T, i);
      } catch {
        // Worker is expected to handle its own errors; this is a last resort.
        results[i] = undefined as unknown as R;
      }
      done++;
      onProgress?.(done, total);
    }
  }

  const runners = Array.from({ length: Math.max(1, Math.min(concurrency, total)) }, runner);
  await Promise.all(runners);
  return results;
}

/** A tiny single-line progress indicator. */
export function progressBar(done: number, total: number, label = ""): void {
  const width = 24;
  const filled = total === 0 ? width : Math.round((done / total) * width);
  const bar = "█".repeat(filled) + "░".repeat(width - filled);
  process.stdout.write(`\r  ${bar} ${done}/${total} ${label}   `);
  if (done === total) process.stdout.write("\n");
}

/** Normalise a URL for fetching; returns null if clearly not a URL. */
export function normaliseUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  let u = raw.trim();
  if (!u || u.length < 4) return null;
  if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
  try {
    const parsed = new URL(u);
    if (!parsed.hostname.includes(".")) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

/** Stable key to dedupe leads across sources. */
export function leadKey(name: string, area: string | null, website: string | null): string {
  const host = website ? safeHost(website) : "";
  return `${name.trim().toLowerCase()}|${(area ?? "").trim().toLowerCase()}|${host}`;
}

/**
 * The key written into the workbook so a re-run can re-attach a lead's saved
 * Verified/Done/Status/Notes. `source:sourceId` is stable across runs; callers
 * fall back to leadKey() when matching older files that predate this column.
 */
export function leadStableKey(source: string, sourceId: string): string {
  return `${source}:${sourceId}`;
}

export function safeHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "").toLowerCase();
  } catch {
    return "";
  }
}

export const USER_AGENT =
  "DS2-LeadFinder/0.1 (+https://ds2-consulting.com; market research; contact dimo.atheneos@gmail.com)";
