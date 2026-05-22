-- Links an admin project to a tracked live site (see src/app/admin/lib/sites.ts).
-- Nullable text; values are site slugs like 'megagym' or 'samioglou'.
-- Powers the "Open site" admin auto-login button + per-project visit analytics.

alter table public.projects
  add column if not exists site_slug text;
