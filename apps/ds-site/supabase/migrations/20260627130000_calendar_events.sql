-- Shared admin calendar — "events we have to do", visible/editable by both founders.
-- Mirrors the admin_notes RLS: is_admin() with NO per-user filter → every admin sees
-- every event (shared). Reuses set_updated_at() (20260519214659 / notes migration).

create table if not exists public.calendar_events (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default '',
  description text not null default '',
  event_date  date not null,                 -- the day it's due
  start_time  time,                           -- optional; null = all-day
  end_time    time,
  color       text not null default 'default',-- default | meeting | deadline | personal
  done        boolean not null default false,
  created_by  uuid references auth.users (id) on delete set null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists calendar_events_date_idx on public.calendar_events (event_date);

drop trigger if exists calendar_events_set_updated_at on public.calendar_events;
create trigger calendar_events_set_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

alter table public.calendar_events enable row level security;

drop policy if exists calendar_events_admin_all on public.calendar_events;
create policy calendar_events_admin_all on public.calendar_events
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

grant select, insert, update, delete on public.calendar_events to authenticated, service_role;
