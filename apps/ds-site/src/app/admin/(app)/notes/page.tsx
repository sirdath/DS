import type { Metadata } from 'next'
import { assertAdmin } from '../../lib/assert-admin'
import { loadNotesData } from './lib/notes-source'
import { NotesApp } from './notes-app'

export const metadata: Metadata = { title: 'Notes · DS2 Admin' }
// Auth-gated admin data — never statically prerender (assertAdmin throws at build
// time with no session; this route must render per-request anyway).
export const dynamic = 'force-dynamic'

// Full-bleed 3-pane app; loads real data (or the demo when Supabase is paused).
// assertAdmin() gives the read path the same in-process guard the actions have
// (defence-in-depth on top of the middleware gate + RLS).
export default async function NotesPage() {
  await assertAdmin()
  const data = await loadNotesData()
  return <NotesApp data={data} />
}
