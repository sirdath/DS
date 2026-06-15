/**
 * Aegis demo — audit any URL from the terminal.
 *
 *   pnpm --filter @ds/aegis demo example.com                 # scan-only (no key)
 *   ANTHROPIC_API_KEY=sk-… pnpm --filter @ds/aegis demo example.com desktop
 *
 * The scan (PageSpeed Insights) always runs and needs no key. The narrated read
 * (verdict, prioritised fixes, accessibility statement) needs ANTHROPIC_API_KEY;
 * without it the tool prints the technical scorecard in scan-only mode.
 */

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { auditSite, renderReport, type Strategy } from "../src/index";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = resolve(HERE, "..", "out");

function slugify(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/[^a-z0-9]+/gi, "-").replace(/-+$/, "").slice(0, 60) || "site";
}

async function main(): Promise<void> {
  const arg = process.argv[2];
  if (!arg) {
    console.error("Usage: pnpm --filter @ds/aegis demo <url> [mobile|desktop]");
    process.exit(1);
  }
  const url = arg.startsWith("http") ? arg : `https://${arg}`;
  const strategy: Strategy = process.argv[3] === "desktop" ? "desktop" : "mobile";
  const scanOnly = !process.env["ANTHROPIC_API_KEY"];
  if (scanOnly) {
    console.error("(no ANTHROPIC_API_KEY — scan-only mode; set it for the full narrated read)\n");
  }

  console.log(`Auditing ${url} (${strategy})…\n`);
  const report = await auditSite(url, { strategy, scanOnly });
  const markdown = renderReport(report);
  console.log(markdown);

  mkdirSync(OUT_DIR, { recursive: true });
  const slug = slugify(url);
  const jsonPath = join(OUT_DIR, `${slug}.json`);
  const mdPath = join(OUT_DIR, `${slug}.md`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  writeFileSync(mdPath, markdown, "utf8");
  console.log(`\nSaved:\n  ${jsonPath}\n  ${mdPath}`);
  if (!scanOnly) console.log(`Cost: $${report.usage.usd.toFixed(4)}`);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
