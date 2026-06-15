/**
 * Fama demo — analyse one sample review set end to end and print the report.
 *
 *   ANTHROPIC_API_KEY=sk-… pnpm --filter @ds/fama demo            # hotel (default)
 *   ANTHROPIC_API_KEY=sk-… pnpm --filter @ds/fama demo taverna    # or dental / cafe
 *
 * Makes live Claude calls (one Sonnet call per review + one Opus synthesis), so it
 * needs a key. Writes the JSON report and Markdown digest to packages/fama/out/.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { analyzeReviews, renderReport, type BusinessContext, type Review } from "../src/index.js";

const HERE = dirname(fileURLToPath(import.meta.url));
const SAMPLES_DIR = resolve(HERE, "..", "samples");
const OUT_DIR = resolve(HERE, "..", "out");

const SAMPLES = ["hotel", "taverna", "dental", "cafe"] as const;
type SampleKey = (typeof SAMPLES)[number];

interface SampleFile {
  business: BusinessContext;
  reviews: Review[];
}

function parseSampleArg(): SampleKey {
  const arg = process.argv[2];
  if (!arg) return "hotel";
  if ((SAMPLES as readonly string[]).includes(arg)) return arg as SampleKey;
  console.error(`Unknown sample "${arg}". Choose one of: ${SAMPLES.join(", ")}`);
  process.exit(1);
}

function loadSample(key: SampleKey): SampleFile {
  const raw = readFileSync(join(SAMPLES_DIR, `${key}.json`), "utf8");
  return JSON.parse(raw) as SampleFile;
}

async function main(): Promise<void> {
  if (!process.env["ANTHROPIC_API_KEY"]) {
    console.error(
      "ANTHROPIC_API_KEY is not set.\n" +
        "  ANTHROPIC_API_KEY=sk-… pnpm --filter @ds/fama demo hotel",
    );
    process.exit(1);
  }

  const key = parseSampleArg();
  const { business, reviews } = loadSample(key);
  console.log(`Analysing ${reviews.length} reviews for ${business.name} — ${business.type}…\n`);

  const report = await analyzeReviews(reviews, business, {
    onProgress: (done, total) => process.stdout.write(`\r  ${done}/${total} reviews analysed`),
  });
  process.stdout.write("\n\n");

  const markdown = renderReport(report);
  console.log(markdown);

  mkdirSync(OUT_DIR, { recursive: true });
  const jsonPath = join(OUT_DIR, `${key}.report.json`);
  const mdPath = join(OUT_DIR, `${key}.report.md`);
  writeFileSync(jsonPath, JSON.stringify(report, null, 2), "utf8");
  writeFileSync(mdPath, markdown, "utf8");

  console.log(`\nSaved:\n  ${jsonPath}\n  ${mdPath}`);
  console.log(
    `Cost: $${report.usage.usd.toFixed(4)} · ${report.usage.input_tokens} in / ${report.usage.output_tokens} out tokens` +
      ` · ${report.usage.cache_read_tokens} cache-read`,
  );
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
