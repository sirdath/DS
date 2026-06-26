/**
 * Loads the Notes workspace for the page (server-only). Reads folders, notes,
 * their project tags, the project list (for the tag picker), and an admin_users
 * name map (to show who last edited) — all through the RLS-scoped client, so a
 * non-admin sees nothing. Any failure (Supabase paused/unreachable/keyless dev)
 * degrades to the demo dataset rather than throwing, so the surface always renders.
 */

import 'server-only'

import { getSupabaseServerClient } from '../../../lib/supabase-server'
import { DEMO_NOTES_DATA } from '../demo-data'
import type { Note, NoteFolder, NoteProjectRef, NotesData } from '../types'

type Row = Record<string, unknown>
const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d)
const num = (v: unknown, d = 0): number => (typeof v === 'number' ? v : Number.isFinite(Number(v)) ? Number(v) : d)

function hasSupabaseEnv(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

function prettyName(username: string): string {
  return username ? username.charAt(0).toUpperCase() + username.slice(1) : ''
}

export async function loadNotesData(): Promise<NotesData> {
  if (!hasSupabaseEnv()) return DEMO_NOTES_DATA

  try {
    const db = await getSupabaseServerClient()
    const [foldersRes, notesRes, tagsRes, projectsRes, usersRes] = await Promise.all([
      db.from('admin_note_folders').select('*').order('position', { ascending: true }),
      db.from('admin_notes').select('*').order('updated_at', { ascending: false }),
      db.from('admin_note_projects').select('note_id, project_id'),
      db.from('projects').select('id, name, status').eq('archived', false).order('name', { ascending: true }),
      db.from('admin_users').select('auth_user_id, username'),
    ])

    // Folders/notes are the load-bearing reads; if either failed, fall back.
    if (foldersRes.error || notesRes.error) return DEMO_NOTES_DATA

    const nameById = new Map<string, string>()
    for (const u of (usersRes.data ?? []) as Row[]) {
      nameById.set(str(u.auth_user_id), prettyName(str(u.username)))
    }

    const tagsByNote = new Map<string, string[]>()
    for (const t of (tagsRes.data ?? []) as Row[]) {
      const nid = str(t.note_id)
      const arr = tagsByNote.get(nid) ?? []
      arr.push(str(t.project_id))
      tagsByNote.set(nid, arr)
    }

    const folders: NoteFolder[] = ((foldersRes.data ?? []) as Row[]).map((r) => ({
      id: str(r.id),
      name: str(r.name),
      parentId: typeof r.parent_id === 'string' ? r.parent_id : null,
      position: num(r.position),
    }))

    const notes: Note[] = ((notesRes.data ?? []) as Row[]).map((r) => {
      const id = str(r.id)
      return {
        id,
        folderId: typeof r.folder_id === 'string' ? r.folder_id : null,
        title: str(r.title),
        body: str(r.body),
        pinned: Boolean(r.pinned),
        position: num(r.position),
        updatedAt: str(r.updated_at),
        updatedByName: nameById.get(str(r.updated_by)) ?? null,
        projectIds: tagsByNote.get(id) ?? [],
      }
    })

    const projects: NoteProjectRef[] = ((projectsRes.data ?? []) as Row[]).map((r) => ({
      id: str(r.id),
      name: str(r.name),
      status: str(r.status),
    }))

    return { folders, notes, projects, isDemo: false }
  } catch {
    return DEMO_NOTES_DATA
  }
}
