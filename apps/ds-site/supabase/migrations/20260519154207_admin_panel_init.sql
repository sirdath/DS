-- Admin panel — initial schema
-- Mirrors the TypeScript Project contract in
-- apps/ds-site/src/app/admin/types.ts (camelCase ↔ snake_case).
-- Security: RLS ON everywhere; only authenticated users registered in
-- admin_users may read/write projects + activity. The browser uses the
-- anon key (RLS-enforced); the service-role key is server-only and is
-- used solely for the username→account login resolution.

-- ── Enums ────────────────────────────────────────────────────────────
create type project_status as enum ('lead', 'in_progress', 'delivered', 'retainer');
create type outreach_stage as enum ('identified', 'demo_built', 'pitched', 'won', 'lost');
create type project_type   as enum ('website', 'application', 'datascience', 'aichatbot', 'agent', 'consulting');

-- ── projects ─────────────────────────────────────────────────────────
create table public.projects (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  url                 text not null default '',
  status              project_status not null default 'lead',
  completion_pct      int not null default 0 check (completion_pct between 0 and 100),
  lead                text not null default 'Dimitris',
  contract_value      numeric not null default 0,
  amount_paid         numeric not null default 0,
  retainer_monthly    numeric,
  start_date          date,
  target_date         date,
  delivered_date      date,
  client_company      text,
  client_contact      text,
  client_email        text,
  client_phone        text,
  notes               text not null default '',
  outreach_stage      outreach_stage,
  proposal_url        text,
  estimated_value     numeric,
  why_them            text,
  source              text,
  repo_url            text,
  current_website_url text,
  project_type        project_type not null default 'website',
  archived            boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create index projects_status_idx   on public.projects (status);
create index projects_archived_idx on public.projects (archived);

-- ── project_activity (timestamped, authored update feed) ─────────────
create table public.project_activity (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects (id) on delete cascade,
  body        text not null,
  author      text not null,
  created_at  timestamptz not null default now()
);

create index project_activity_project_idx on public.project_activity (project_id, created_at desc);

-- ── admin_users (username → Supabase auth account) ───────────────────
create table public.admin_users (
  id            uuid primary key default gen_random_uuid(),
  username      text unique not null,
  auth_user_id  uuid not null references auth.users (id) on delete cascade
);

-- ── updated_at trigger ───────────────────────────────────────────────
-- security definer + set search_path = public mirrors is_admin() so the
-- function runs with a fixed search_path and cannot be subverted by a
-- malicious schema placed earlier in the search path (Fix 6).
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────
alter table public.projects         enable row level security;
alter table public.project_activity enable row level security;
alter table public.admin_users      enable row level security;

-- Helper: is the current authenticated user a registered admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users a where a.auth_user_id = auth.uid()
  );
$$;

-- projects: full access only for registered admins
create policy projects_admin_all on public.projects
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- project_activity: same
create policy activity_admin_all on public.project_activity
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- admin_users: an authenticated user may read only their own mapping.
-- (Username→account resolution at login uses the service-role key, which
-- bypasses RLS; seeding admin_users is done via SQL/service-role.)
create policy admin_users_read_self on public.admin_users
  for select to authenticated
  using (auth_user_id = auth.uid());

-- Explicit write-deny policies — authenticated users (including admins
-- acting via the anon/session client) cannot insert, update, or delete
-- admin_users rows via the application layer (Fix 13).
-- Seeding and management must go through the service-role key (SQL/migration).
create policy admin_users_no_insert on public.admin_users
  for insert to authenticated
  with check (false);

create policy admin_users_no_update on public.admin_users
  for update to authenticated
  using (false);

create policy admin_users_no_delete on public.admin_users
  for delete to authenticated
  using (false);

-- ── Seed note (manual, NOT in this migration — secrets) ──────────────
-- After this migration:
--   1. Disable public sign-ups (Auth settings).
--   2. Create the two founder users in Auth → Users (email + password).
--   3. insert into public.admin_users (username, auth_user_id) values
--        ('dimitris', '<dimitris auth uuid>'),
--        ('stelios',  '<stelios  auth uuid>');
