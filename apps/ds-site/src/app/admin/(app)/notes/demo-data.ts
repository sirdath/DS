/**
 * Demo notes — shown when Supabase is unavailable (paused / keyless dev), so the
 * surface is always reviewable. Mirrors the design mockup's content. Clearly marked
 * isDemo:true; the UI shows a banner and disables writes in this mode.
 */

import type { NotesData } from './types'

export const DEMO_NOTES_DATA: NotesData = {
  isDemo: true,
  folders: [
    { id: 'f-prospects', name: 'Prospects', parentId: null, position: 0 },
    { id: 'f-athens', name: 'Athens', parentId: 'f-prospects', position: 0 },
    { id: 'f-london', name: 'London', parentId: 'f-prospects', position: 1 },
    { id: 'f-clients', name: 'Clients', parentId: null, position: 1 },
    { id: 'f-ideas', name: 'Ideas', parentId: null, position: 2 },
  ],
  projects: [
    { id: 'p-aetheria', name: 'Aetheria Suites', status: 'lead' },
    { id: 'p-kafeneio', name: 'Kafeneio Group', status: 'lead' },
    { id: 'p-plaka', name: 'Plaka Atelier', status: 'lead' },
    { id: 'p-megagym', name: 'MegaGym', status: 'delivered' },
  ],
  notes: [
    {
      id: 'n-aetheria',
      folderId: 'f-athens',
      title: 'Aetheria Suites — boutique hotel',
      pinned: true,
      position: 0,
      updatedAt: '2026-06-17T07:30:00.000Z',
      updatedByName: 'Stel',
      projectIds: ['p-aetheria'],
      body: [
        '## Why them',
        '4.7★ across 600+ reviews but the site is a 2016 template — the direct-booking flow breaks on mobile, so they’re funnelling guests to Booking.com and paying ~18% commission. A clean `Internal Rewiring` story: keep the brand, fix the machine.',
        '',
        '## What we noticed',
        '- Booking widget 404s below the fold on iOS Safari.',
        '- No structured data → invisible for "boutique hotel Plaka".',
        '- Gallery is 4 MB of unoptimised JPEGs; LCP ~6s on 4G.',
        '',
        '## Next steps',
        '- [x] Run Aegis audit on the live site',
        '- [x] Draft the challenge-first intro email',
        '- [ ] Book the 20-min diagnosis call (Stel)',
        '- [ ] Prep a 2-slide before / after of the booking flow',
      ].join('\n'),
    },
    {
      id: 'n-kafeneio',
      folderId: 'f-athens',
      title: 'Kafeneio group (3 locations)',
      pinned: false,
      position: 1,
      updatedAt: '2026-06-16T16:00:00.000Z',
      updatedByName: 'Dath',
      projectIds: ['p-kafeneio'],
      body: 'No website at all — Instagram only. Owner **replied to the cold email**, wants a call next week about a brand upgrade.\n\n- [ ] Send 3 time slots\n- [ ] Pull their Instagram numbers for the deck',
    },
    {
      id: 'n-plaka',
      folderId: 'f-athens',
      title: 'Plaka jewellery atelier',
      pinned: false,
      position: 2,
      updatedAt: '2026-06-14T11:00:00.000Z',
      updatedByName: 'Stel',
      projectIds: ['p-plaka'],
      body: 'Beautiful product, 2014-era Wix. Ugliness score 82. Could be a flagship portfolio piece if we land it.',
    },
    {
      id: 'n-ideas-pricing',
      folderId: 'f-ideas',
      title: 'Idea: a fixed-scope “Internal Rewiring” package',
      pinned: false,
      position: 0,
      updatedAt: '2026-06-12T09:00:00.000Z',
      updatedByName: 'Dath',
      projectIds: [],
      body: '## Thesis\nMost SMBs don’t need a redesign — they need the **machine** fixed (booking, SEO, performance). Package it as a fixed-scope 2-week sprint.\n\n## Open questions\n- Price point?\n- How to scope without a full audit first?',
    },
  ],
}
