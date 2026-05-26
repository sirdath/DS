/** Parse CLI flags into a Config. Greece-first defaults. */
import type { Config } from "./types.js";
import { DEFAULT_CATEGORIES } from "./presets.js";

const HELP = `
DS2 Lead Finder — find SMEs with no/ugly websites and export an Excel of leads.

Usage:
  npm run find -- [options]

Options:
  --area <name|places>   Preset (athens | greece-major | cyprus | greece-cyprus)
                         or place(s) separated by ";". Default: athens
  --categories <list>    Comma-separated (restaurant,cafe,lawyer,…). Default: broad SME set
  --radius <m>           Search radius per area in metres. Default: 4000
  --limit <n>            Max websites to analyse. Default: 200
  --concurrency <n>      Parallel site fetches. Default: 6
  --timeout <ms>         Per-site timeout. Default: 12000
  --min-score <0-100>    Drop leads below this lead score. Default: 0
  --per-industry <n>     Keep at most N leads per industry (0 = all). Default: 0
                         (e.g. --per-industry 8 → ~8 best companies per category)
  --no-domain-age        Skip RDAP domain-creation lookups (default: do them)
  --no-robots            Don't check robots.txt before fetching (default: do check)
  --no-google            Ignore GOOGLE_PLACES_API_KEY even if set
  --out <path>           Output .xlsx. Default: ./out/ds2-leads-<area>-<date>.xlsx
  -h, --help             Show this help

Google Places (optional, richer data incl. ratings): set GOOGLE_PLACES_API_KEY.
Default discovery is OpenStreetMap (free, no key).
`;

export function parseArgs(argv: string[]): Config | "help" {
  const args = argv.slice(2);
  const get = (flag: string): string | undefined => {
    const i = args.indexOf(flag);
    return i >= 0 && i + 1 < args.length ? args[i + 1] : undefined;
  };
  const has = (flag: string): boolean => args.includes(flag);

  if (has("-h") || has("--help")) return "help";

  const area = get("--area") ?? "athens";
  const date = new Date().toISOString().slice(0, 10);
  const slug = area.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40);

  return {
    area,
    categories: (get("--categories")?.split(",").map((c) => c.trim()).filter(Boolean)) ?? DEFAULT_CATEGORIES,
    radiusM: Number(get("--radius") ?? 4000),
    limit: Number(get("--limit") ?? 200),
    concurrency: Number(get("--concurrency") ?? 6),
    timeoutMs: Number(get("--timeout") ?? 12000),
    respectRobots: !has("--no-robots"),
    out: get("--out") ?? `./out/ds2-leads-${slug}-${date}.xlsx`,
    useGoogle: !has("--no-google"),
    minScore: Number(get("--min-score") ?? 0),
    perIndustry: Number(get("--per-industry") ?? 0),
    domainAge: !has("--no-domain-age"),
  };
}

export { HELP };
