'use server'

/**
 * Server actions for the admin Notes feature. Every action asserts admin, then
 * mutates through the RLS-scoped client (RLS independently enforces is_admin, so
 * this is defence-in-depth). Writes stamp updated_by with the acting user so the
 * UI can show who last edited. revalidatePath refreshes the server-rendered page.
 */

import { revalidatePath } from 'next/cache'
import { assertAdmin } from './lib/assert-admin'
import { getSessionUser, getSupabaseServerClient } from './lib/supabase-server'

const PATH = '/admin/notes'
const TITLE_MAX = 300
const NAME_MAX = 120
const BODY_MAX = 200_000

async function db() {
  await assertAdmin()
  return getSupabaseServerClient()
}

async function currentUserId(): Promise<string | null> {
  const u = await getSessionUser()
  return u?.id ?? null
}

function clean(v: unknown, max: number): string {
  return typeof v === 'string' ? v.slice(0, max).trim() : ''
}

// ── Folders ──────────────────────────────────────────────────────────────
export async function createFolder(name: string, parentId: string | null): Promise<string> {
  const supabase = await db()
  const n = clean(name, NAME_MAX) || 'New folder'
  const { data, error } = await supabase
    .from('admin_note_folders')
    .insert({ name: n, parent_id: parentId ?? null, created_by: await currentUserId() })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
  return String(data?.id ?? '')
}

export async function renameFolder(id: string, name: string): Promise<void> {
  if (!id) throw new Error('Missing folder id')
  const supabase = await db()
  const { error } = await supabase.from('admin_note_folders').update({ name: clean(name, NAME_MAX) || 'Untitled' }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

export async function deleteFolder(id: string): Promise<void> {
  if (!id) throw new Error('Missing folder id')
  const supabase = await db()
  // FK: child folders cascade; notes' folder_id is set null (notes are preserved).
  const { error } = await supabase.from('admin_note_folders').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

// ── Notes ────────────────────────────────────────────────────────────────
export async function createNote(folderId: string | null): Promise<string> {
  const supabase = await db()
  const uid = await currentUserId()
  const { data, error } = await supabase
    .from('admin_notes')
    .insert({ folder_id: folderId ?? null, title: '', body: '', created_by: uid, updated_by: uid })
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
  return String(data?.id ?? '')
}

export async function updateNote(id: string, patch: { title?: string; body?: string }): Promise<void> {
  if (!id) throw new Error('Missing note id')
  const supabase = await db()
  const row: Record<string, unknown> = { updated_by: await currentUserId() }
  if (patch.title !== undefined) row.title = clean(patch.title, TITLE_MAX)
  if (patch.body !== undefined) row.body = typeof patch.body === 'string' ? patch.body.slice(0, BODY_MAX) : ''
  const { error } = await supabase.from('admin_notes').update(row).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

export async function moveNote(id: string, folderId: string | null): Promise<void> {
  if (!id) throw new Error('Missing note id')
  const supabase = await db()
  const { error } = await supabase.from('admin_notes').update({ folder_id: folderId ?? null }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

export async function togglePin(id: string, pinned: boolean): Promise<void> {
  if (!id) throw new Error('Missing note id')
  const supabase = await db()
  const { error } = await supabase.from('admin_notes').update({ pinned: Boolean(pinned) }).eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

export async function deleteNote(id: string): Promise<void> {
  if (!id) throw new Error('Missing note id')
  const supabase = await db()
  const { error } = await supabase.from('admin_notes').delete().eq('id', id)
  if (error) throw new Error(error.message)
  revalidatePath(PATH)
}

/** Replace a note's project tags with the given set (idempotent). */
export async function setNoteProjects(noteId: string, projectIds: string[]): Promise<void> {
  if (!noteId) throw new Error('Missing note id')
  const supabase = await db()
  const ids = Array.from(new Set((projectIds ?? []).filter((p) => typeof p === 'string' && p)))
  const { error: delErr } = await supabase.from('admin_note_projects').delete().eq('note_id', noteId)
  if (delErr) throw new Error(delErr.message)
  if (ids.length) {
    const { error: insErr } = await supabase.from('admin_note_projects').insert(ids.map((project_id) => ({ note_id: noteId, project_id })))
    if (insErr) throw new Error(insErr.message)
  }
  revalidatePath(PATH)
}
