/**
 * PLACEHOLDER / PREVIEW DATA — safe to delete.
 *
 * An example Argus weekly competitor-intelligence briefing for the demo business
 * (Aetheria Suites — the same hotel used across Fama and Xenia, so the portal reads
 * as one client's command centre). Argus has no engine yet; this is a faithful
 * preview of how the tool will look once the scraper is wired. Rendered behind a
 * clear "Example" banner — never presented as real data.
 */

export type MovementType = 'pricing' | 'offer' | 'content' | 'seo' | 'social' | 'reviews' | 'hiring'
export type Impact = 'high' | 'medium' | 'low'

export interface ArgusMovement {
  competitor: string
  type: MovementType
  headline: string
  detail: string
  date: string // "9 Jun"
  impact: Impact
}

export interface ArgusCompetitor {
  name: string
  url: string
  avgRate: string
  rateDelta: number // % change wk/wk
  rating: number
  reviews: number
  velocity: number // new reviews this week
  instagram: string
  followerDelta: number
  note?: string
}

export interface ArgusBriefing {
  business: string
  location: string
  week_of: string
  competitor_count: number
  summary: string
  movements: ArgusMovement[]
  competitors: ArgusCompetitor[]
  recommendations: Array<{ action: string; rationale: string }>
}

export const DEMO_ARGUS: ArgusBriefing = {
  business: 'Aetheria Suites',
  location: 'Plaka, Athens',
  week_of: 'week of 9 June 2026',
  competitor_count: 4,
  summary:
    'Two competitors moved aggressively this week. Plaka Central Suites cut weeknight rates 12% and has overtaken you for "boutique hotel Plaka" — a direct pull on your midweek bookings. Acropolis View paired a free-airport-transfer offer with a 19-review surge, which reads as a coordinated direct-booking push. Your weekend position is safe; the pressure is squarely on Tue–Thu pricing and your core search ranking.',
  movements: [
    {
      competitor: 'Plaka Central Suites',
      type: 'pricing',
      headline: 'Cut weeknight rates 12%',
      detail: '€142 → €125 for Tue–Thu stays through June. Weekend rates unchanged.',
      date: '11 Jun',
      impact: 'high',
    },
    {
      competitor: 'Plaka Central Suites',
      type: 'seo',
      headline: 'Now ranks #1 for "boutique hotel Plaka"',
      detail: 'Up from #4 last month after publishing three neighbourhood guides. You slipped to #2.',
      date: '10 Jun',
      impact: 'high',
    },
    {
      competitor: 'Acropolis View Boutique',
      type: 'offer',
      headline: 'Launched free airport transfer',
      detail: 'On 3+ night stays booked direct — promoted on the homepage and Booking.com.',
      date: '12 Jun',
      impact: 'high',
    },
    {
      competitor: 'Acropolis View Boutique',
      type: 'reviews',
      headline: 'Review velocity spiked — 19 new reviews',
      detail: 'Averaging 4.7★ this week, roughly 3× their usual pace. Likely a post-stay email campaign.',
      date: '13 Jun',
      impact: 'medium',
    },
    {
      competitor: 'Athens Heritage Rooms',
      type: 'content',
      headline: 'Refreshed gallery — 24 new photos + a rooftop video',
      detail: 'Updated their Booking.com and Google Business Profile media for the summer season.',
      date: '9 Jun',
      impact: 'medium',
    },
    {
      competitor: 'Athens Heritage Rooms',
      type: 'pricing',
      headline: 'Raised weekend rates 6%',
      detail: '€168 → €178 for Fri–Sat — testing summer demand.',
      date: '9 Jun',
      impact: 'low',
    },
    {
      competitor: 'Monastiraki Loft Hotel',
      type: 'social',
      headline: 'Instagram up ~1,400 followers in a week',
      detail: 'A rooftop reel reached ≈80k views. Their fastest growth this year.',
      date: '12 Jun',
      impact: 'low',
    },
    {
      competitor: 'Monastiraki Loft Hotel',
      type: 'hiring',
      headline: 'Hiring a "guest experience manager"',
      detail: 'Posted on LinkedIn — signals a service-quality push.',
      date: '14 Jun',
      impact: 'low',
    },
  ],
  competitors: [
    {
      name: 'Plaka Central Suites',
      url: 'plakacentralsuites.gr',
      avgRate: '€125',
      rateDelta: -12,
      rating: 4.5,
      reviews: 481,
      velocity: 8,
      instagram: '6.2k',
      followerDelta: 1.2,
      note: 'Now #1 for "boutique hotel Plaka"',
    },
    {
      name: 'Acropolis View Boutique',
      url: 'acropolisviewathens.com',
      avgRate: '€165',
      rateDelta: 0,
      rating: 4.7,
      reviews: 612,
      velocity: 19,
      instagram: '9.1k',
      followerDelta: 2.4,
      note: 'Free-transfer offer live',
    },
    {
      name: 'Athens Heritage Rooms',
      url: 'athensheritagerooms.gr',
      avgRate: '€178',
      rateDelta: 6,
      rating: 4.4,
      reviews: 350,
      velocity: 5,
      instagram: '4.0k',
      followerDelta: 0.3,
    },
    {
      name: 'Monastiraki Loft Hotel',
      url: 'monastirakiloft.com',
      avgRate: '€148',
      rateDelta: 0,
      rating: 4.6,
      reviews: 291,
      velocity: 6,
      instagram: '11.3k',
      followerDelta: 14.1,
    },
  ],
  recommendations: [
    {
      action: 'Defend midweek without a price war — add a perk to Tue–Thu direct bookings instead of matching the 12% cut',
      rationale:
        'Matching on price erodes your ADR. You win where Plaka Central can’t: the breakfast guests already rave about (per Fama). Bundle breakfast + late checkout for midweek direct stays.',
    },
    {
      action: 'Reclaim the "boutique hotel Plaka" search ranking',
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
