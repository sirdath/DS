#!/usr/bin/env node
// DS2 inspiration-fetch CLI — one tool, two lanes.
//   stock      licensed, publishable imagery (Openverse / Unsplash / Pexels)
//   pinterest  private reference moodboards via your logged-in browser
//
// Usage:
//   node scripts/inspo/inspo.mjs stock "blue hour architecture" --count 12 --source openverse
//   node scripts/inspo/inspo.mjs pinterest "https://pinterest.com/you/board/" --count 40
//   node scripts/inspo/inspo.mjs pinterest "cinematic dark ui" --count 30
//
// Run `node scripts/inspo/inspo.mjs --help` for the full reference.
import { fileURLToPath } from "node:url";
import { dirname, join, resolve } from "node:path";
import { parseArgs, slugify, downloadAll } from "./lib/util.mjs";
import { searchStock, STOCK_SOURCES } from "./lib/stock.mjs";
import { collectPins } from "./lib/pinterest.mjs";

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");

const HELP = `
DS2 inspiration-fetch — find and download reference imagery.

  stock "<query>"      Licensed, safe-to-ship. Sources: ${STOCK_SOURCES.join(", ")}.
                       → assets/inspiration/stock/<query>/  (+ sources.json)
    --source <name>    openverse (default, no key) | unsplash | pexels
    --count <n>        how many (default 12)
    --orientation      landscape | portrait | square

  pinterest "<url|query>"   Private REFERENCE ONLY via your logged-in browser.
                       → assets/motion-inspiration/pinterest/<slug>/ (git-ignored)
    --count <n>        how many (default 30)
    --headless         run without a visible window (only after first login)

Keys (stock, optional): UNSPLASH_ACCESS_KEY, PEXELS_API_KEY in your shell/.env.
Rights: stock lane captures licence + author in sources.json and is publishable.
        pinterest lane is other people's copyrighted work — moodboards only.
`;

async function runStock(positional, flags) {
  const query = positional.join(" ").trim();
  if (!query) throw new Error('stock needs a query, e.g. inspo stock "blue hour architecture"');
  const source = flags.source || "openverse";
  const count = Number(flags.count) || 12;
  const orientation = flags.orientation || undefined;

  console.log(`\n▸ stock · ${source} · "${query}" · ${count} images`);
  const items = await searchStock(query, { source, count, orientation });
  if (!items.length) {
    console.log("  No results. Try a broader query or a different --source.");
    return;
  }
  const destDir = join(REPO_ROOT, "assets", "inspiration", "stock", `${slugify(query)}-${source}`);
  const notice =
    `Licensed reference from ${source}. See sources.json for author + licence per file.\n` +
    `Publishable, but always credit per the source's licence terms.\n`;
  const r = await downloadAll(items, destDir, { concurrency: 5, notice });
  console.log(`  ✓ ${r.ok}/${r.total} saved → ${r.destDir.replace(REPO_ROOT + "/", "")}`);
}

async function runPinterest(positional, flags) {
  const target = positional.join(" ").trim();
  if (!target) throw new Error('pinterest needs a board URL or query, e.g. inspo pinterest "dark ui"');
  const count = Number(flags.count) || 30;
  const headless = Boolean(flags.headless);

  console.log(`\n▸ pinterest · REFERENCE ONLY · "${target}" · ${count} images`);
  const items = await collectPins(target, { count, headless });
  if (!items.length) {
    console.log("  No pins collected (login needed, or the board is empty/private).");
    return;
  }
  const destDir = join(REPO_ROOT, "assets", "motion-inspiration", "pinterest", slugify(target));
  const notice =
    "REFERENCE ONLY — do not publish.\n" +
    "These are third-party copyrighted images collected from Pinterest for private\n" +
    "moodboarding. Never ship them on a DS2 or client page. See sources.json for pin links.\n";
  const r = await downloadAll(items, destDir, {
    referer: "https://www.pinterest.com/",
    concurrency: 4,
    notice,
  });
  console.log(`  ✓ ${r.ok}/${r.total} saved → ${r.destDir.replace(REPO_ROOT + "/", "")}  (git-ignored)`);
}

async function main() {
  const argv = process.argv.slice(2);
  if (!argv.length || argv[0] === "--help" || argv[0] === "-h") {
    console.log(HELP);
    process.exit(argv.length ? 0 : 1);
  }
  const [cmd, ...rest] = argv;
  const { flags, positional } = parseArgs(rest);

  try {
    if (cmd === "stock") await runStock(positional, flags);
    else if (cmd === "pinterest") await runPinterest(positional, flags);
    else {
      console.error(`Unknown command "${cmd}".`);
      console.log(HELP);
      process.exit(1);
    }
  } catch (err) {
    const cause = err?.cause?.code || err?.cause?.message;
    console.error(`\n✗ ${err.message || err}${cause ? `\n  cause: ${cause}` : ""}\n`);
    process.exit(1);
  }
}

main();
