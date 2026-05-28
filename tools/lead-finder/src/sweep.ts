/**
 * Athens sweep: discover leads for many areas, one at a time, writing to Supabase.
 * Skips areas already searched (lead_areas unique key). Discovery only — run
 * "Analyze pending" in the admin afterwards to score the websites.
 *
 * Run:  SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… npx tsx src/sweep.ts
 */
import { geocodeArea } from "./sources/geocode.js";
import { discoverOverpass } from "./sources/overpass.js";
import { buildLead } from "./score.js";
import { DEFAULT_CATEGORIES } from "./presets.js";
import { log, sleep } from "./util.js";
import { makeClient, claimArea, finishArea, upsertLeads } from "./sink-supabase.js";

// Around Kifissia first (North Athens), then the wider Athens basin.
const AREAS = [
  // North — the Kifissia cluster
  "Nea Erythraia, Greece", "Ekali, Greece", "Drosia, Attica, Greece", "Dionysos, Attica, Greece",
  "Anoixi, Attica, Greece", "Stamata, Greece", "Nea Penteli, Greece", "Penteli, Greece",
  "Melissia, Greece", "Pefki, Attica, Greece", "Marousi, Greece", "Lykovrysi, Greece",
  "Metamorfosi, Attica, Greece", "Nea Ionia, Attica, Greece", "Irakleio, Attica, Greece",
  "Chalandri, Greece", "Vrilissia, Greece", "Agia Paraskevi, Attica, Greece", "Cholargos, Greece",
  "Papagou, Greece", "Filothei, Greece", "Psychiko, Greece", "Neo Psychiko, Greece",
  "Gerakas, Attica, Greece", "Pallini, Greece", "Anthousa, Attica, Greece", "Glyka Nera, Greece",
  "Nea Filadelfeia, Greece", "Galatsi, Greece",
  // Central
  "Kolonaki, Athens, Greece", "Ampelokipoi, Athens, Greece", "Pagrati, Athens, Greece",
  "Exarchia, Athens, Greece", "Zografou, Greece", "Kaisariani, Greece", "Vyronas, Greece",
  "Ilioupoli, Greece", "Dafni, Attica, Greece", "Nea Smyrni, Greece",
  // South coast
  "Palaio Faliro, Greece", "Alimos, Greece", "Elliniko, Greece", "Argyroupoli, Greece",
  "Glyfada, Greece", "Voula, Greece", "Vouliagmeni, Greece", "Kallithea, Attica, Greece", "Moschato, Greece",
  // West / Piraeus
  "Piraeus, Greece", "Nikaia, Attica, Greece", "Korydallos, Greece", "Keratsini, Greece",
  "Peristeri, Greece", "Aigaleo, Greece", "Chaidari, Greece", "Petroupoli, Greece",
  "Ilion, Attica, Greece", "Agioi Anargyroi, Greece", "Acharnes, Greece",
];

const RADIUS = 3000;
const DELAY_BETWEEN = 12000; // courtesy gap for Overpass/Nominatim

async function main(): Promise<void> {
  const sb = makeClient();
  log.step(`Athens sweep — ${AREAS.length} areas, discovery only`);
  let totalLeads = 0;
  let doneAreas = 0;
  let skipped = 0;

  for (const [i, area] of AREAS.entries()) {
    const claimed = await claimArea(sb, area).catch((e) => {
      log.err(`claim "${area}" failed: ${e instanceof Error ? e.message : e}`);
      return false;
    });
    if (!claimed) {
      log.dim(`(${i + 1}/${AREAS.length}) skip "${area}" — already searched`);
      skipped++;
      continue;
    }
    try {
      const point = await geocodeArea(area);
      await sleep(1500); // Nominatim courtesy
      const raw = await discoverOverpass(point, DEFAULT_CATEGORIES, RADIUS);
      const leads = raw.map((r) => buildLead(r, null));
      const inserted = await upsertLeads(sb, leads, area);
      await finishArea(sb, area, leads.length, true);
      totalLeads += inserted;
      doneAreas++;
      log.ok(`(${i + 1}/${AREAS.length}) ${area} → ${leads.length} found, ${inserted} new (running total ${totalLeads})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await finishArea(sb, area, 0, false);
      log.err(`(${i + 1}/${AREAS.length}) ${area} failed: ${msg}`);
    }
    if (i < AREAS.length - 1) await sleep(DELAY_BETWEEN);
  }

  log.step(`Sweep complete — ${doneAreas} areas done, ${skipped} skipped, ${totalLeads} leads inserted.`);
  log.dim("Next: open /admin → Leads → 'Analyze pending' to score the websites.");
}

main().catch((err) => {
  log.err(err instanceof Error ? err.stack ?? err.message : String(err));
  process.exit(1);
});
