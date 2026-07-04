// Shared helpers for the inspo CLI — filesystem, download, slug, manifest.
import { mkdir, writeFile } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { join, extname } from "node:path";

/** kebab-case a query/title into a safe folder or file segment. */
export function slugify(input, fallback = "untitled") {
  const s = String(input)
    .toLowerCase()
    .replace(/https?:\/\//, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return s || fallback;
}

/** Best-effort file extension from a URL, defaulting to .jpg. */
export function extFromUrl(url, fallback = ".jpg") {
  try {
    const clean = new URL(url).pathname;
    const ext = extname(clean).toLowerCase();
    return /^\.(jpe?g|png|webp|gif|avif)$/.test(ext) ? ext : fallback;
  } catch {
    return fallback;
  }
}

/** Download one URL to disk. Returns { ok, path, status, bytes }. Never throws. */
export async function download(url, destPath, { referer } = {}) {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36",
        accept: "image/avif,image/webp,image/*,*/*;q=0.8",
        ...(referer ? { referer } : {}),
      },
    });
    if (!res.ok || !res.body) return { ok: false, status: res.status, path: destPath };
    await pipeline(Readable.fromWeb(res.body), createWriteStream(destPath));
    return { ok: true, status: res.status, path: destPath };
  } catch (err) {
    return { ok: false, status: 0, path: destPath, error: String(err?.message || err) };
  }
}

/** Ensure a directory exists. */
export async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
  return dir;
}

/**
 * Download a list of {url, ...meta} items into destDir with an index-based name,
 * write a manifest.json alongside, and (optionally) a notice file. Concurrency-capped.
 */
export async function downloadAll(items, destDir, { referer, concurrency = 4, notice } = {}) {
  await ensureDir(destDir);
  const results = [];
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length || 1) }, async () => {
    while (i < items.length) {
      const idx = i++;
      const item = items[idx];
      const name = `${String(idx + 1).padStart(3, "0")}-${slugify(item.title || item.author || "img")}${extFromUrl(item.url)}`;
      const r = await download(item.url, join(destDir, name), { referer });
      results.push({ ...item, file: r.ok ? name : null, ok: r.ok, status: r.status });
      process.stdout.write(r.ok ? "." : "x");
    }
  });
  await Promise.all(workers);
  process.stdout.write("\n");

  const okCount = results.filter((r) => r.ok).length;
  await writeFile(
    join(destDir, "sources.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), count: okCount, items: results }, null, 2)
  );
  if (notice) await writeFile(join(destDir, "READ-ME.txt"), notice);
  return { destDir, total: items.length, ok: okCount };
}

/** Parse `--flag value` / `--flag=value` / `--bool` into an object, plus positionals. */
export function parseArgs(argv) {
  const flags = {};
  const positional = [];
  for (let a = 0; a < argv.length; a++) {
    const tok = argv[a];
    if (tok.startsWith("--")) {
      const eq = tok.indexOf("=");
      if (eq !== -1) {
        flags[tok.slice(2, eq)] = tok.slice(eq + 1);
      } else {
        const next = argv[a + 1];
        if (next && !next.startsWith("--")) {
          flags[tok.slice(2)] = next;
          a++;
        } else {
          flags[tok.slice(2)] = true;
        }
      }
    } else {
      positional.push(tok);
    }
  }
  return { flags, positional };
}
