-- Marketing leads — backend store for the lead-finder + manual paste.
-- Separate from `projects` so hundreds of raw/auto-discovered leads never
-- pollute the CRM/money pipeline. A lead can be "promoted" into a project.
-- Security mirrors the admin schema: RLS ON; only registered admins (is_admin())
-- may read/write; service_role bypasses RLS (server-only, used by the CLI sink).

-- ── Enum ─────────────────────────────────────────────────────────────
create type lead_status as enum ('new', 'contacted', 'replied', 'meeting', 'won', 'lost', 'not_a_fit');

-- ── marketing_leads ──────────────────────────────────────────────────
create table public.marketing_leads (
  id                  uuid primary key default gen_random_uuid(),
  source              text not null default 'manual',   -- osm | google | manual
  source_id           text,                              -- e.g. "osm:node/123" (null for manual)
  name                text not null,
  category            text,
  area                text,
  website             text,
  has_website         boolean not null default false,
  phone               text,
  email               text,
  address             text,
  lat                 numeric,
  lon                 numeric,
  rating              numeric,
  reviews             int,
  lead_score          int not null default 0,
  ugliness            int,
  priority            text,                              -- High | Medium | Low
  tags                text[] not null default '{}',
  tech                text[] not null default '{}',
  pitch_angle         text,
  maps_url            text,
  analysis_status     text not null default 'pending',   -- pending | done | na | failed
  verified            boolean not null default false,
  contacted           boolean not null default false,
  status              lead_status not null default 'new',
  notes               text not null default '',
  promoted_project_id uuid references public.projects (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- Dedupe auto-discovered leads. NULLs are distinct in Postgres unique indexes,
-- so manual leads (source_id null) never collide; this also lets upsert use
-- ON CONFLICT (source, source_id) to ignore re-discovered duplicates.
create unique index marketing_leads_source_uniq
  on public.marketing_leads (source, source_id);
create index marketing_leads_priority_idx on public.marketing_leads (priority);
create index marketing_leads_status_idx   on public.marketing_leads (status);
create index marketing_leads_area_idx     on public.marketing_leads (area);
create index marketing_leads_pending_idx  on public.marketing_leads (analysis_status) where analysis_status = 'pending';

-- ── lead_areas (one row per area searched — unique key blocks re-runs) ─
create table public.lead_areas (
  id          uuid primary key default gen_random_uuid(),
  area_key    text unique not null,        -- normalized lowercase area string
  area_label  text not null,
  status      text not null default 'done', -- running | done | failed
  lead_count  int not null default 0,
  error       text,
  run_at      timestamptz not null default now()
);

-- ── updated_at trigger (reuses public.set_updated_at from the init migration) ──
create trigger marketing_leads_set_updated_at
  before update on public.marketing_leads
  for each row execute function public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────
alter table public.marketing_leads enable row level security;
alter table public.lead_areas      enable row level security;

create policy marketing_leads_admin_all on public.marketing_leads
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy lead_areas_admin_all on public.lead_areas
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ── Table grants (RLS still gates per-row; see admin_grants migration) ──
grant select, insert, update, delete on public.marketing_leads, public.lead_areas
  to authenticated, service_role;
