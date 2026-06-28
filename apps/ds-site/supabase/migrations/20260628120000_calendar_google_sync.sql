-- Two-way Google Calendar sync. Links each admin event to its Google counterpart
-- and stores the incremental sync token. Additive, safe to run on the live table.

alter table public.calendar_events
  add column if not exists google_event_id text,
  add column if not exists synced_at timestamptz;

-- One Supabase row per Google event (the sync-back matches on this).
create unique index if not exists calendar_events_google_event_id_key
  on public.calendar_events (google_event_id)
  where google_event_id is not null;

-- Single-row store for the Google Calendar incremental sync token.
create table if not exists public.calendar_sync_state (
  id int primary key default 1,
  sync_token text,
  updated_at timestamptz not null default now(),
  constraint calendar_sync_state_singleton check (id = 1)
);

alter table public.calendar_sync_state enable row level security;

-- Admin-only for authenticated clients (mirrors calendar_events). The sync route
-- runs under the service-role key, which bypasses RLS.
drop policy if exists calendar_sync_state_admin on public.calendar_sync_state;
create policy calendar_sync_state_admin on public.calendar_sync_state
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

grant all on public.calendar_sync_state to authenticated, service_role;
