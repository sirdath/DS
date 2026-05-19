-- Admin panel — explicit table grants
--
-- The initial schema migration (20260519154207_admin_panel_init.sql) relied on
-- Supabase's default privileges for new tables in `public`, but in practice
-- `supabase db push` from the CLI does not always grant the `service_role` /
-- `authenticated` roles SELECT/INSERT/UPDATE/DELETE on freshly created tables.
-- Result: `service_role` got `42501 permission denied for table admin_users`
-- on its username→auth_user_id lookup at login. RLS isn't enough — Postgres
-- table-level grants must also allow access.
--
-- These grants are idempotent: re-running has no effect. RLS policies still
-- gate per-row access for `authenticated`; `service_role` bypasses RLS by
-- design (and is server-only).

grant usage on schema public to anon, authenticated, service_role;

grant select, insert, update, delete on public.projects, public.project_activity, public.admin_users
  to service_role;

grant select on public.admin_users to authenticated;
grant select, insert, update, delete on public.projects, public.project_activity to authenticated;
