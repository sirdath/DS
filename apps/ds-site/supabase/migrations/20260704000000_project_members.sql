-- ════════════════════════════════════════════════════════════════════════
-- Employee access — project assignment
-- ════════════════════════════════════════════════════════════════════════
-- Roles are two-tier and email-based:
--   • Owners (the founders): emails in ADMIN_ALLOWED_EMAILS. See everything.
--   • Employees: emails in STAFF_EMAILS. Least-privilege scoped view.
-- This table scopes what an employee sees: an employee is shown only the
-- projects they are a member of here (name/status/progress — never money),
-- and the notes tagged to those projects.
-- Owners manage membership; employees never write to this table.

create table if not exists public.admin_project_members (
  project_id   uuid not null references public.projects (id) on delete cascade,
  member_email text not null,
  created_at   timestamptz not null default now(),
  primary key (project_id, member_email)
);

create index if not exists admin_project_members_email_idx
  on public.admin_project_members (member_email);

alter table public.admin_project_members enable row level security;

-- Only registered admins can touch it via the client; the server reads it with
-- the service-role key (bypasses RLS) to build the scoped employee dashboard.
create policy admin_project_members_admin_all on public.admin_project_members
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
