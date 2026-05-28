/**
 * Seed redesign_targets from the marketing_leads we already discovered: every
 * business WITH a real website, deduped by registrable domain, socials excluded.
 * Instant volume across all Athens industries — no new scraping.
 *
 * Run: SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npx tsx src/seed-from-leads.ts
 */
import { makeClient } from "./sink-supabase.js";
import { normaliseUrl, isRealWebsite, homepageUrl, safeHost, log } from "./util.js";

interface LeadRow {
  category: string | null; area: string | null; name: string; website: string | null;
  phone: string | null; email: string | null; address: string | null;
  lat: number | null; lon: number | null; ugliness: number | null; tags: string[] | null; tech: string[] | null;
}

async function main(): Promise<void> {
  const sb = makeClient();
  // Page through all leads with a website.
  const PAGE = 1000;
  let from = 0;
  const byHost = new Map<string, Record<string, unknown>>();

  for (;;) {
    const { data, error } = await sb
      .from("marketing_leads")
      .select("category, area, name, website, phone, email, address, lat, lon, ugliness, tags, tech")
      .eq("has_website", true)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as LeadRow[];
    if (rows.length === 0) break;
    for (const r of rows) {
      const url = normaliseUrl(r.website);
      if (!url || !isRealWebsite(url)) continue;
      const home = homepageUrl(url);
      const host = safeHost(home);
      if (!host || byHost.has(host)) continue;
      byHost.set(host, {
        industry: r.category ?? "business",
        area: r.area,
        name: r.name,
        website: home,
        phone: r.phone,
        email: r.email,
        address: r.address,
        lat: r.lat,
        lon: r.lon,
        source: "osm",
        heuristic_score: r.ugliness,
        tags: r.tags ?? [],
        tech: r.tech ?? [],
        vision_status: "pending",
      });
    }
    from += PAGE;
  }

  const rows = [...byHost.values()];
  log.ok(`${rows.length} distinct real-website domains to seed`);
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 500) {
    const chunk = rows.slice(i, i + 500);
    const { error, count } = await sb
      .from("redesign_targets")
      .upsert(chunk, { onConflict: "source,website", ignoreDuplicates: true, count: "exact" });
    if (error) throw new Error(error.message);
    inserted += count ?? chunk.length;
  }
  log.step(`Seeded ${inserted} redesign_targets. Next: screenshot pass (shoot-pending.ts).`);
}

main().catch((err) => {
  log.err(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
});
