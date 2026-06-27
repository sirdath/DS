/**
 * The tools shown on the workspace launcher. `slug` matches portal_subscriptions.tool_slug
 * (20260610_portal_base.sql), so a real per-client status can be joined later; for now the
 * status reflects what's actually openable in the workspace today.
 */

export interface ToolCard {
  slug:
    | 'review-intelligence'
    | 'site-selection'
    | 'ai-receptionist'
    | 'competitor-watch'
    | 'site-audit'
    | 'collections'
  name: string
  tagline: string
  href: string | null // null → not yet openable
  status: 'ready' | 'preview' | 'soon'
  accent: string // card hue
}

export const TOOLS: ToolCard[] = [
  {
    slug: 'ai-receptionist',
    name: 'Xenia',
    tagline: 'AI receptionist — books appointments and answers enquiries, by chat or phone, in Greek & English.',
    href: '/products/xenia',
    status: 'ready',
    accent: '#60C4A8',
  },
  {
    slug: 'collections',
    name: 'Plutus',
    tagline: 'Collections — predicts which invoices pay late, ranks who to chase, drafts the reminder (you approve).',
    href: '/products/plutus',
    status: 'ready',
    accent: '#2ec5a8',
  },
  {
    slug: 'review-intelligence',
    name: 'Fama',
    tagline: 'Review intelligence — sentiment, themes, reply drafts and the few things to fix next.',
    href: '/products/fama',
    status: 'ready',
    accent: '#6D5DD3',
  },
  {
    slug: 'site-selection',
    name: 'Panoptes',
    tagline: 'Site selection — demand, competition and access scored across a city, on a map.',
    href: '/products/panoptes',
    status: 'ready',
    accent: '#22d3ee',
  },
  {
    slug: 'site-audit',
    name: 'Aegis',
    tagline: 'Site audit — speed, accessibility (EU Accessibility Act) and SEO, with the fixes that matter.',
    href: '/products/aegis',
    status: 'ready',
    accent: '#f5c451',
  },
  {
    slug: 'competitor-watch',
    name: 'Argus',
    tagline: 'Competitor watch — weekly intelligence on the moves your market is making.',
    href: '/products/argus',
    status: 'preview',
    accent: '#E896C4',
  },
]
