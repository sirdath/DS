/**
 * PLACEHOLDER / TEMPLATE DATA — safe to delete.
 *
 * A hand-authored example Fama report (Aetheria Suites) so the workspace shows
 * what review intelligence looks like before a live review source is connected.
 * It is rendered with a clear "Example" badge — never presented as real client
 * data. Remove this file (and its import in page.tsx) once a real report lands.
 */

import type { FamaReport } from '@ds/fama'

export const DEMO_FAMA_REPORT: FamaReport = {
  generated_by: 'Fama (example)',
  business: { name: 'Aetheria Suites', type: 'boutique hotel', location: 'Plaka, Athens' },
  review_count: 24,
  date_range: { from: '2025-08-26', to: '2026-06-02' },
  analyses: [
    {
      id: 'r11',
      language: 'en',
      sentiment: 'negative',
      sentiment_score: -0.8,
      themes: [
        { topic: 'room_quality', polarity: 'negative' },
        { topic: 'staff', polarity: 'positive' },
      ],
      summary: 'AC broken on arrival, not fixed across a two-night June stay',
      reply_draft:
        "James, I'm so sorry the air conditioning failed during your stay, in an Athens June that is simply not good enough, and an apology can't cool a room. We've since serviced every unit. If you'll give us another chance I'd like to make it right personally.",
      reply_priority: 'high',
    },
    {
      id: 'r7',
      language: 'el',
      sentiment: 'negative',
      sentiment_score: -0.55,
      themes: [
        { topic: 'value_for_money', polarity: 'negative' },
        { topic: 'room_quality', polarity: 'negative' },
      ],
      summary: 'Felt the small room did not justify the price',
      reply_draft:
        'Νίκο, ευχαριστούμε για την ειλικρίνεια. Καταλαβαίνουμε ότι το δωμάτιο σάς φάνηκε μικρό για την τιμή, θα φροντίσουμε να είμαστε πιο ξεκάθαροι για τα μεγέθη κατά την κράτηση και θα χαρούμε να σας προτείνουμε μεγαλύτερο δωμάτιο την επόμενη φορά.',
      reply_priority: 'high',
    },
    {
      id: 'r6',
      language: 'en',
      sentiment: 'positive',
      sentiment_score: 0.5,
      themes: [
        { topic: 'wifi', polarity: 'negative' },
        { topic: 'breakfast', polarity: 'positive' },
      ],
      summary: 'Loved breakfast; third-floor wifi kept dropping during work calls',
      reply_draft:
        "Thank you Thomas, so glad the breakfast was a highlight. You're right about the third-floor wifi; we're installing a new access point on that floor this month so calls hold steady. Hope to host you again.",
      reply_priority: 'normal',
    },
  ],
  aggregate: {
    overall_summary:
      'Guests love Aetheria for its unbeatable Plaka location, warm staff and a genuinely special breakfast, those three themes drive almost every five-star review. The rating is slipping slightly, and the cause is concentrated: small rooms, an unreliable air-conditioning unit, and patchy third-floor wifi account for nearly every low score.',
    rating_average: 4.08,
    rating_distribution: { '1': 1, '2': 2, '3': 3, '4': 6, '5': 12 },
    rating_trend: -0.2,
    sentiment_breakdown: { positive: 18, neutral: 3, negative: 3 },
    language_breakdown: { el: 14, en: 10, other: 0 },
    themes: [
      { topic: 'staff', mentions: 20, positive: 19, negative: 1 },
      { topic: 'location', mentions: 16, positive: 16, negative: 0 },
      { topic: 'breakfast', mentions: 14, positive: 13, negative: 1 },
      { topic: 'cleanliness', mentions: 11, positive: 11, negative: 0 },
      { topic: 'room_quality', mentions: 10, positive: 2, negative: 8 },
      { topic: 'value_for_money', mentions: 8, positive: 5, negative: 3 },
      { topic: 'noise', mentions: 7, positive: 0, negative: 7 },
      { topic: 'wifi', mentions: 5, positive: 1, negative: 4 },
    ],
    strengths: [
      { theme: 'staff', mentions: 20, example: 'Giorgos remembered our names from day one.' },
      {
        theme: 'location',
        mentions: 16,
        example: 'We walked to the Acropolis in 8 minutes, never took a taxi once.',
      },
      {
        theme: 'breakfast',
        mentions: 14,
        example: 'Not a generic buffet: Greek yogurt with thyme honey, spanakopita made that morning.',
      },
    ],
    issues: [
      {
        theme: 'room_quality',
        mentions: 10,
        impact: 'The two lowest reviews cite a failing AC unit and cramped rooms, the single biggest drag on the rating.',
        recommendation: 'Service every AC unit on a schedule and set room-size expectations clearly at booking.',
      },
      {
        theme: 'noise',
        mentions: 7,
        impact: 'Street-facing rooms are noisy until 2am on weekends, costing otherwise-five-star stays a star.',
        recommendation: 'Offer light sleepers a quiet courtyard room by default, and note it on the booking page.',
      },
      {
        theme: 'wifi',
        mentions: 5,
        impact: 'Third-floor wifi drops during work calls, a real issue for the business travellers who book midweek.',
        recommendation: 'Add an access point on the third floor; mention reliable wifi in the listing.',
      },
    ],
    priorities: [
      {
        rank: 1,
        action: 'Service the air-conditioning units and put them on a maintenance schedule',
        rationale: 'Named in both 1–2★ reviews; the clearest cause of the slipping rating.',
      },
      {
        rank: 2,
        action: 'Default light sleepers to courtyard rooms and set size expectations at booking',
        rationale: 'Noise and room-size complaints turn 5★ experiences into 3–4★ ones.',
      },
      {
        rank: 3,
        action: 'Add a third-floor wifi access point',
        rationale: 'The recurring gripe from midweek business guests who would otherwise rate five stars.',
      },
    ],
  },
  usage: { input_tokens: 28400, output_tokens: 4200, cache_read_tokens: 19800, cache_write_tokens: 1100, usd: 0.18 },
}
