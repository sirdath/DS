# Admin Notes, design (APPROVED, building)

**Status:** Approved 2026-06-17, building this session. Internal admin feature for the two founders.

## Goal
A notes/knowledge space in the admin panel where Dath + Stel write notes, organise them in
**nested folders**, **tag them to projects**, and track **prospects**, brand-grade, using the v2
brand materials. "Incredibly well made," aesthetic.

## Locked decisions
- **Where:** new `/admin/notes` tab (between Hunt and Workspace), admin-gated (ADMIN_ALLOWED_EMAILS).
  Shared space, both founders see all notes; each note records `updated_by` + timestamp.
- **Editor:** markdown + live preview (no heavy WYSIWYG dep; portable, durable).
- **Folders:** nested tree (parent_id self-ref); move notes/folders between them.
- **Look:** full **v2 brand**, space-grey (`#050607`/`#111419`), translucent glass panels
  (`rgba(255,255,255,.07)` + `.22` borders), ice-blue accent (`#8DCBFF`), Inter + IBM Plex Mono,
  fluid `clamp()` type. A v2 pilot, visibly distinct from the amber admin shell. Honour
  `prefers-reduced-transparency` + `prefers-reduced-motion`.
- **Prospects:** no new model, a note in a "Prospects" folder and/or tagged to a project with
  status `lead`.
- **Collab:** shared, last-write-wins, no realtime in v1 (revalidate on save).
- **Search:** title + body. **Pin** to top. Works offline via the mock data source in keyless dev.

## Data model (new migration, admin-only RLS, reuse `is_admin()` + `set_updated_at()`)
- `admin_note_folders`, `id uuid pk`, `name text`, `parent_id uuid? → self`, `position int`,
  `created_by uuid → auth.users`, `created_at`, `updated_at`. (Nesting; cascade delete children.)
- `admin_notes`, `id uuid pk`, `folder_id uuid? → admin_note_folders (on delete set null)`,
  `title text`, `body text` (markdown), `pinned bool`, `position int`, `created_by uuid`,
  `updated_by uuid`, `created_at`, `updated_at`.
- `admin_note_projects`, `note_id → admin_notes (cascade)`, `project_id → projects (cascade)`,
  pk `(note_id, project_id)`. M:N tags.
- RLS: `for all to authenticated using (public.is_admin()) with check (public.is_admin())` on all
  three. `set_updated_at()` triggers on folders + notes.

## Surface (mirrors admin patterns)
- `admin/(app)/notes/page.tsx`, server component, loads folders + notes + projects (real or mock).
- `admin/notes-actions.ts`, `'use server'` + `assertAdmin()` + `getSupabaseServerClient()` +
  `revalidatePath('/admin/notes')`: createFolder/rename/move/delete, createNote/update/move/
  togglePin/delete, setNoteProjects.
- Client components: folder **tree** (sidebar), **note list** (search/pin), **editor**
  (markdown + live preview), **project tag** picker. `notes.css` scoped, v2 tokens.
- Markdown → HTML via a small, escaped, dependency-free renderer (trusted-admin content).

## Build sequence
1. DesignBook aesthetic pass against the v2 palette (compose → critique → refine → high taste score)
   as the visual reference, then implement in Next (DesignBook output is a static mock, not the app).
2. Migration → page + components + actions → `notes.css`.
3. Adversarial review (RLS/security, correctness, a11y) → typecheck + build → commit.

## Ops note
The DS2 Supabase project was **paused** again (NXDOMAIN). User restores it in the dashboard; the
migration is applied once live. Keep-alive only prevents pausing while active, durable fix is Pro.
