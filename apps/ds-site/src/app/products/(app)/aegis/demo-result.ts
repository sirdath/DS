/**
 * PLACEHOLDER / EXAMPLE DATA — safe to delete.
 *
 * A sample Aegis audit (the demo hotel's site) so the surface shows a populated
 * scorecard before anyone runs a real audit — useful when no PAGESPEED_API_KEY /
 * ANTHROPIC_API_KEY is set. Shown behind an "Example" banner; replaced the moment
 * a real audit runs.
 */

import type { AegisReport } from '@ds/aegis'

export const DEMO_AEGIS_REPORT: AegisReport = {
  generated_by: 'Aegis (example)',
  url: 'aetheria-suites.gr',
  final_url: 'https://aetheria-suites.gr/',
  strategy: 'mobile',
  scores: [
    { key: 'performance', score: 38 },
    { key: 'accessibility', score: 71 },
    { key: 'seo', score: 84 },
    { key: 'best-practices', score: 75 },
  ],
  vitals: [
    { id: 'largest-contentful-paint', label: 'Largest Contentful Paint', numericValue: 4600, displayValue: '4.6 s', rating: 'poor' },
    { id: 'cumulative-layout-shift', label: 'Cumulative Layout Shift', numericValue: 0.02, displayValue: '0.02', rating: 'good' },
    { id: 'total-blocking-time', label: 'Total Blocking Time', numericValue: 720, displayValue: '720 ms', rating: 'poor' },
    { id: 'first-contentful-paint', label: 'First Contentful Paint', numericValue: 2400, displayValue: '2.4 s', rating: 'needs-improvement' },
    { id: 'speed-index', label: 'Speed Index', numericValue: 5100, displayValue: '5.1 s', rating: 'poor' },
  ],
  severity_counts: { critical: 1, serious: 3, moderate: 2, minor: 5 },
  accessibility_issue_count: 4,
  overall_verdict:
    'The site looks the part but is slow on a phone, the hero image alone is pushing the largest paint to 4.6 seconds, and over half of mobile visitors abandon a load over three. Content and SEO are in good shape; the real exposure is accessibility, where four failures put you on the wrong side of the EU Accessibility Act.',
  headline_risks: [
    {
      area: 'performance',
      risk: 'The page is slow to load on mobile',
      why_it_matters: 'Largest paint is 4.6s; roughly 53% of mobile visitors abandon a load over 3 seconds, that is bookings lost before the page even appears.',
    },
    {
      area: 'accessibility',
      risk: 'Four accessibility failures, including images without alt text and low contrast',
      why_it_matters: 'Under the EU Accessibility Act (in force since June 2025) these are a legal liability; Greek fines reach €100,000 and new builds must comply at launch.',
    },
    {
      area: 'performance',
      risk: 'Render-blocking scripts delay the first paint',
      why_it_matters: 'The page waits on non-critical CSS/JS before showing anything, which compounds the slow-load problem on weaker mobile connections.',
    },
  ],
  priorities: [
    {
      rank: 1,
      area: 'accessibility',
      action: 'Add alt text to every image and fix the low-contrast text',
      rationale: '4 accessibility audits fail; these are the most-litigated WCAG issues and the fastest to close.',
      effort: 'quick',
    },
    {
      rank: 2,
      area: 'performance',
      action: 'Compress and lazy-load the hero and gallery images',
      rationale: 'The hero is the largest paint at 4.6s; right-sizing it is the single biggest speed win.',
      effort: 'moderate',
    },
    {
      rank: 3,
      area: 'performance',
      action: 'Defer non-critical CSS and JavaScript',
      rationale: 'Render-blocking resources delay first paint; deferring them lets content appear sooner.',
      effort: 'moderate',
    },
    {
      rank: 4,
      area: 'accessibility',
      action: 'Publish an accessibility statement',
      rationale: 'Required under the EU Accessibility Act; a clear statement also reduces complaint risk.',
      effort: 'quick',
    },
  ],
  accessibility_statement:
    'Aetheria Suites is working towards WCAG 2.1 AA conformance for this website. We are aware of the following limitations, which we are actively addressing: some images lack text alternatives, and some text does not yet meet the minimum colour-contrast ratio. If you encounter a barrier using this site, please contact us at access@aetheria-suites.gr and we will help and prioritise a fix. (Draft, review before publishing.)',
  eaa_exposure_note:
    'Moderate exposure, there are real accessibility gaps. Under the EU Accessibility Act (in force since June 2025) these are a legal liability, not just a UX nicety; Greek penalties reach €100,000 and new builds must comply at launch.',
  findings: [
    { id: 'image-alt', category: 'accessibility', title: 'Image elements do not have [alt] attributes', description: '', severity: 'critical', displayValue: '6 elements' },
    { id: 'color-contrast', category: 'accessibility', title: 'Background and foreground colours do not have sufficient contrast', description: '', severity: 'serious' },
    { id: 'link-name', category: 'accessibility', title: 'Links do not have a discernible name', description: '', severity: 'serious' },
    { id: 'render-blocking-resources', category: 'performance', title: 'Eliminate render-blocking resources', description: '', severity: 'serious', displayValue: 'Potential savings of 1,540 ms' },
    { id: 'uses-optimized-images', category: 'performance', title: 'Efficiently encode images', description: '', severity: 'moderate', displayValue: 'Potential savings of 820 KiB' },
    { id: 'unused-javascript', category: 'performance', title: 'Reduce unused JavaScript', description: '', severity: 'moderate', displayValue: 'Potential savings of 210 KiB' },
    { id: 'heading-order', category: 'accessibility', title: 'Heading elements are not in a sequentially-descending order', description: '', severity: 'minor' },
    { id: 'meta-description', category: 'seo', title: 'Document does not have a meta description', description: '', severity: 'minor' },
  ],
  usage: { input_tokens: 6200, output_tokens: 1100, cache_read_tokens: 0, cache_write_tokens: 0, usd: 0.035 },
}
