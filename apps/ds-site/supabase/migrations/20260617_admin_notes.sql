-- Admin Notes — an internal knowledge space for the two founders.
-- Nested folders, markdown notes, project tags. Internal-only: every table is
-- admin-gated by the existing is_admin() helper (admin_users membership), so
-- there is no per-user ownership — both founders share one space. Reuses the
-- shared set_updated_at() trigger and is_admin() policy from the admin init
-- migration (20260519154207_admin_panel_init.sql).

-- ── admin_note_folders (nested; a folder may contain folders + notes) ──
create table public.admin_note_folders (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  parent_id   uuid references public.admin_note_folders (id) on delete cascade,
  position    int not null default 0,
  created_by  uuid references auth.users (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index admin_note_folders_parent_idx on public.admin_note_folders (parent_id, position);

-- ── admin_notes (markdown body; optionally inside a folder) ──
create table public.admin_notes (
  id          uuid primary key default gen_random_uuid(),
  folder_id   uuid references public.admin_note_folders (id) on delete set null,
  title       text not null default '',
  body        text not null default '',
  pinned      boolean not null default false,
  position    int not null default 0,
  created_by  uuid references auth.users (id),
  updated_by  uuid references auth.users (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index admin_notes_folder_idx on public.admin_notes (folder_id);
create index admin_notes_updated_idx on public.admin_notes (updated_at desc);
create index admin_notes_pinned_idx on public.admin_notes (pinned) where pinned;

-- ── admin_note_projects (M:N tag a note to projects, incl. status='lead' prospects) ──
create table public.admin_note_projects (
  note_id     uuid not null references public.admin_notes (id) on delete cascade,
  project_id  uuid not null references public.projects (id) on delete cascade,
  primary key (note_id, project_id)
);
create index admin_note_projects_project_idx on public.admin_note_projects (project_id);

-- ── updated_at triggers (reuse the shared function) ──
create trigger admin_note_folders_set_updated_at
  before update on public.admin_note_folders
  for each row execute function public.set_updated_at();
create trigger admin_notes_set_updated_at
  before update on public.admin_notes
  for each row execute function public.set_updated_at();

-- ── Row Level Security — admin-only on every table ──
alter table public.admin_note_folders   enable row level security;
alter table public.admin_notes           enable row level security;
alter table public.admin_note_projects   enable row level security;

create policy admin_note_folders_admin_all on public.admin_note_folders
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy admin_notes_admin_all on public.admin_notes
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

create policy admin_note_projects_admin_all on public.admin_note_projects
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
