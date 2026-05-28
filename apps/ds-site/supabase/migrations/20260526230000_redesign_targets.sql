-- Redesign-target "hunt": existing business websites that look horrendous and need a rebuild.
-- Separate from marketing_leads (which is mostly no-website build leads). Each row has a
-- screenshot + a visual score (judged from the screenshot), per industry, with contact details.
-- Security mirrors the admin schema: RLS ON; only is_admin() may read/write; service_role bypasses
-- (used by the CLI pipeline). Reuses the lead_status enum + set_updated_at() from earlier migrations.

create table public.redesign_targets (
  id                  uuid primary key default gen_random_uuid(),
  industry            text not null default 'business',
  area                text,
  name                text not null,
  website             text not null,
  phone               text,
  email               text,
  address             text,
  lat                 numeric,
  lon                 numeric,
  source              text not null default 'osm',   -- osm | directory | manual
  screenshot_path     text,                            -- key in the redesign-shots storage bucket
  heuristic_score     int,                             -- technical ugliness (0-100)
  tags                text[] not null default '{}',
  tech                text[] not null default '{}',
  vision_score        int,                             -- 1-10 horrendousness (judged from screenshot)
  vision_tier         text,                            -- disaster | rough | dated | ok
  vision_notes        text,
  vision_status       text not null default 'pending', -- pending | done | failed
  status              lead_status not null default 'new',
  verified            boolean not null default false,
  contacted           boolean not null default false,
  notes               text not null default '',
  promoted_project_id uuid references public.projects (id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create unique index redesign_targets_site_uniq on public.redesign_targets (source, website);
create index redesign_targets_industry_idx on public.redesign_targets (industry);
create index redesign_targets_vision_idx   on public.redesign_targets (vision_score desc);
create index redesign_targets_pending_idx  on public.redesign_targets (vision_status) where vision_status = 'pending';

create trigger redesign_targets_set_updated_at
  before update on public.redesign_targets
  for each row execute function public.set_updated_at();

alter table public.redesign_targets enable row level security;
create policy redesign_targets_admin_all on public.redesign_targets
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.redesign_targets to authenticated, service_role;

-- Public-read storage bucket for screenshots (idempotent).
insert into storage.buckets (id, name, public)
values ('redesign-shots', 'redesign-shots', true)
on conflict (id) do nothing;
