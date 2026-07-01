/**
 * Practice run for the Competitors scan: scrape + analyze the two example competitors
 * with the official Anthropic SDK, using YOUR own key (your billing). It calls the same
 * shared module the deployed "Scan" button uses, so a green run here means the live scan
 * works too. Prints the structured analysis + token usage; writes nothing to the DB.
 *
 * Run from apps/ds-site with your key:
 *   ANTHROPIC_API_KEY=sk-ant-... npx tsx scripts/competitor-practice.ts
 */

/* eslint-disable no-console */
import { analyzeUrl } from '../src/app/admin/(app)/competitors/lib/analyze'

const TARGETS = [
  { name: 'Digital Applied', url: 'https://www.digitalapplied.com/' },
  { name: 'Textura', url: 'https://textura.agency/#services' },
]

async function main(): Promise<void> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.error('Set ANTHROPIC_API_KEY to your own Anthropic key and re-run.')
    process.exit(1)
  }
  for (const target of TARGETS) {
    console.log(`\n══ ${target.name} — ${target.url} ══`)
    try {
      const { analysis, usage } = await analyzeUrl({ credential: apiKey, name: target.name, url: target.url })
      console.log(JSON.stringify(analysis, null, 2))
      console.log(`tokens: in ${usage.input_tokens} · out ${usage.output_tokens}`)
    } catch (err) {
      console.error('FAILED:', err instanceof Error ? err.message : err)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
