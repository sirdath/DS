/**
 * PLACEHOLDER / PREVIEW PROSE — safe to delete.
 *
 * The Argus surface now renders REAL engine output: the movements and competitor
 * board are computed live by @ds/argus (detect + board) from the sample tenant's
 * two-week metrics. Only the briefing *prose* (summary + recommendations) is bundled
 * here as an example — with an ANTHROPIC_API_KEY and a wired observer the engine
 * writes these live (briefing.ts) and fact-checks them. Shown behind a clear
 * "Preview" banner; never presented as a real client's live data.
 */

import type { Recommendation } from '@ds/argus'

export const DEMO_BRIEFING_PROSE: { summary: string; recommendations: Recommendation[] } = {
  summary:
    'Two competitors moved aggressively this week. Plaka Central Suites cut rates 12% and overtook you for “boutique hotel Plaka” — a direct pull on midweek bookings. Acropolis View paired a free-airport-transfer offer with a 19-review surge, which reads as a coordinated direct-booking push. Your weekend position looks safe; the pressure is squarely on Tue–Thu pricing and your core search ranking.',
  recommendations: [
    {
      action: 'Defend midweek without a price war — add a perk to Tue–Thu direct bookings instead of matching the 12% cut',
      rationale:
        'Matching on price erodes your ADR. You win where Plaka Central can’t: the breakfast guests already rave about. Bundle breakfast + late checkout for midweek direct stays.',
    },
    {
      action: 'Reclaim the “boutique hotel Plaka” search ranking',
      rationale:
        'Plaka Central took #1 with neighbourhood content; a focused content + Google Business Profile refresh can win back your highest-intent term, where #1 vs #2 is a large share of clicks.',
    },
    {
      action: 'Answer the free-transfer offer with your own direct-booking incentive',
      rationale:
        'Acropolis View is actively pulling direct demand and stacking reviews. A matched or better perk keeps the momentum from compounding against you.',
    },
  ],
}
