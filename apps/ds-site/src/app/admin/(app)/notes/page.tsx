import type { Metadata } from 'next'
import { loadNotesData } from './lib/notes-source'
import { NotesApp } from './notes-app'

export const metadata: Metadata = { title: 'Notes · DS2 Admin' }
// Auth-gated admin data — never statically prerender; renders per-request.
export const dynamic = 'force-dynamic'

// Full-bleed 3-pane app; loads real data (or the demo when Supabase is paused).
// The middleware gate + RLS already enforce admin — no extra per-page auth round-trip
// (loadNotesData reads through the RLS-scoped client, which returns nothing to non-admins).
export default async function NotesPage() {
  const data = await loadNotesData()
  return <NotesApp data={data} />
}
