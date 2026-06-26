// Domain types for the admin Notes feature. snake_case DB rows map to these via
// the notes source; the client components speak only camelCase.

export interface NoteFolder {
  id: string
  name: string
  parentId: string | null
  position: number
}

/** A project a note can be tagged to (incl. status='lead' prospects). */
export interface NoteProjectRef {
  id: string
  name: string
  status: string
}

export interface Note {
  id: string
  folderId: string | null
  title: string
  body: string
  pinned: boolean
  position: number
  updatedAt: string
  updatedByName: string | null
  projectIds: string[]
}

export interface NotesData {
  folders: NoteFolder[]
  notes: Note[]
  /** All projects, for the tag picker. */
  projects: NoteProjectRef[]
  /** True when served from demo data (Supabase unavailable/paused). */
  isDemo: boolean
}
