/**
 * Registry of live client sites that DS2 hosts/proxies and tracks visits for.
 * Single source of truth used by:
 *  - the admin "Live site" project field + Overview "Open site" button
 *  - the Projects → Analytics tab (visit filtering by pathPrefix)
 *  - the admin auto-login route (openPath + admin labelling)
 * No server-only deps, so it's safe to import from client components too.
 */

export interface TrackedSite {
  slug: string
  name: string
  description: string
  /** Prefix visits are filtered by, e.g. "/samioglou". */
  pathPrefix: string
  /** Where the admin auto-login redirects after setting the gate cookie. */
  openPath: string
  /** Display URL. */
  url: string
}

export const TRACKED_SITES: TrackedSite[] = [
  {
    slug: 'megagym',
    name: 'MegaGym',
    description: 'Fitness centre, Athens',
    pathPrefix: '/MegaGym-Website',
    openPath: '/MegaGym-Website/',
    url: 'ds2-consulting.com/MegaGym-Website',
  },
  {
    slug: 'samioglou',
    name: 'Samioglou',
    description: 'Moving & removals, Athens',
    pathPrefix: '/samioglou',
    openPath: '/samioglou/',
    url: 'ds2-consulting.com/samioglou',
  },
]

export function getSite(slug: string | null | undefined): TrackedSite | undefined {
  if (!slug) return undefined
  return TRACKED_SITES.find(s => s.slug === slug)
}

/**
 * Resolve the tracked site for an admin project. Uses the explicit siteSlug if
 * set, otherwise auto-matches by name (e.g. project "MegaGym" → site "megagym")
 * so projects link to their analytics + Open-site link with no manual step.
 */
export function siteForProject(
  project: { name?: string | null; siteSlug?: string | null },
): TrackedSite | undefined {
  if (project.siteSlug) {
    const explicit = getSite(project.siteSlug)
    if (explicit) return explicit
  }
  const normalized = (project.name ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '')
  if (!normalized) return undefined
  // Match when the project name contains the site slug, so variants like
  // "MegaGym Website" or "Samioglou Removals" still resolve to their site.
  return TRACKED_SITES.find(s => normalized.includes(s.slug))
}

/** Map an admin's email to a short label used as the visit client_id (`<label>-admin`). */
const ADMIN_LABELS: Record<string, string> = {
  'dimo.atheneos@gmail.com': 'dimitris',
  'steliosgavrielides@gmail.com': 'stelios',
}

export function adminLabel(email: string | null | undefined): string {
  if (!email) return 'admin'
  const key = email.trim().toLowerCase()
  if (ADMIN_LABELS[key]) return ADMIN_LABELS[key]
  return key.split('@')[0]?.replace(/[^a-z0-9]+/g, '-') || 'admin'
}
