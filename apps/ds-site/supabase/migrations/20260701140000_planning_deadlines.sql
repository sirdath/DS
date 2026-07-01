-- Planning deadlines: generic date-or-metric goals shown on the dashboard. Kept as a
-- neutral "planning" primitive (no DS-specific naming) so the admin panel is resale-ready.
-- kind='date' uses due_date (countdown); kind='metric' uses metric_current/target (progress bar).

create table if not exists public.planning_deadlines (
  id             uuid primary key default gen_random_uuid(),
  kind           text not null default 'date',   -- date | metric
  title          text not null default '',
  due_date       date,                            -- kind='date'
  metric_current numeric,                         -- kind='metric'
  metric_target  numeric,
  metric_unit    text not null default '',        -- e.g. EUR
  sort_order     int not null default 0,
  done           boolean not null default false,
  created_by     uuid references auth.users (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists planning_deadlines_due_idx on public.planning_deadlines (due_date);
create index if not exists planning_deadlines_sort_idx on public.planning_deadlines (sort_order);

drop trigger if exists planning_deadlines_set_updated_at on public.planning_deadlines;
create trigger planning_deadlines_set_updated_at before update on public.planning_deadlines
  for each row execute function public.set_updated_at();

alter table public.planning_deadlines enable row level security;
drop policy if exists planning_deadlines_admin_all on public.planning_deadlines;
create policy planning_deadlines_admin_all on public.planning_deadlines
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
grant all on public.planning_deadlines to authenticated, service_role;

-- ── Seed: the two starter goals (idempotent) ──
insert into public.planning_deadlines (kind, title, due_date, sort_order)
select 'date', 'Find first client before August', date '2026-08-01', 0
where not exists (select 1 from public.planning_deadlines where title = 'Find first client before August');

insert into public.planning_deadlines (kind, title, metric_current, metric_target, metric_unit, sort_order)
select 'metric', 'Revenue this month', 320, 500, 'EUR', 1
where not exists (select 1 from public.planning_deadlines where title = 'Revenue this month');
