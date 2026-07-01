-- A metric deadline can auto-track a live dashboard figure instead of a hand-typed number.
-- '' = manual; otherwise one of: collected | mrr | pipeline | outstanding | contract.
alter table public.planning_deadlines add column if not exists metric_source text not null default '';

-- Bind the seeded "Revenue this month" goal to monthly recurring revenue (the one genuinely
-- per-month figure we track). Changeable in the UI; only sets it if still unbound.
update public.planning_deadlines set metric_source = 'mrr'
where title = 'Revenue this month' and metric_source = '';
