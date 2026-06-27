-- Outreach research briefs — append-only history of deep-research briefs per marketing lead.
-- Each research run inserts a row; the newest ready row has is_current = true. A failed run does
-- NOT clear the previous current brief. Admin-only (mirrors marketing_leads). Reuses is_admin()
-- and set_updated_at() from 20260519154207_admin_panel_init.sql.

create type outreach_brief_status as enum ('researching', 'ready', 'failed');

create table public.outreach_briefs (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.marketing_leads (id) on delete cascade,
  is_current    boolean not null default false,    -- the brief shown for this lead (latest ready)
  status        outreach_brief_status not null default 'researching',
  lang          text not null default 'en' check (lang in ('en', 'el')),
  model         text,                              -- claude-opus-4-8 | claude-sonnet-4-6
  profile       text,                              -- lean | deep
  brief_json    jsonb,                             -- CompanyBrief
  brief_md      text,                              -- rendered markdown (renderBriefMarkdown)
  sources       jsonb not null default '[]',       -- BriefSource[]
  confidence    numeric,                           -- 0..1
  gaps          text[] not null default '{}',
  input_tokens  int not null default 0,
  output_tokens int not null default 0,
  search_count  int not null default 0,
  cost_usd      numeric not null default 0,
  error         text,
  created_by    uuid references auth.users (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index outreach_briefs_lead_created_idx on public.outreach_briefs (lead_id, created_at desc);
-- At most one current brief per lead.
create unique index outreach_briefs_current_uniq on public.outreach_briefs (lead_id) where is_current;
create index outreach_briefs_status_idx on public.outreach_briefs (status);

create trigger outreach_briefs_set_updated_at
  before update on public.outreach_briefs
  for each row execute function public.set_updated_at();

alter table public.outreach_briefs enable row level security;

create policy outreach_briefs_admin_all on public.outreach_briefs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.outreach_briefs to authenticated, service_role;

-- Atomically promote a freshly-researched brief to current: demote any prior current
-- for the lead, then mark this row ready + current — in ONE transaction. This avoids
-- both the "two currents" the partial unique index would reject AND the "zero currents"
-- window if a separate demote succeeded but the promote then failed. On any error the
-- whole function rolls back, leaving the prior current brief intact. Admin-gated.
create or replace function public.outreach_mark_brief_current(
  p_brief_id     uuid,
  p_lead_id      uuid,
  p_lang         text,
  p_brief_json   jsonb,
  p_brief_md     text,
  p_sources      jsonb,
  p_confidence   numeric,
  p_gaps         text[],
  p_input_tokens int,
  p_output_tokens int,
  p_search_count int,
  p_cost_usd     numeric
) returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;
  update public.outreach_briefs
    set is_current = false
    where lead_id = p_lead_id and is_current = true and id <> p_brief_id;
  update public.outreach_briefs
    set status = 'ready', is_current = true, lang = p_lang, brief_json = p_brief_json,
        brief_md = p_brief_md, sources = p_sources, confidence = p_confidence, gaps = p_gaps,
        input_tokens = p_input_tokens, output_tokens = p_output_tokens,
        search_count = p_search_count, cost_usd = p_cost_usd
    where id = p_brief_id;
end;
$$;

grant execute on function public.outreach_mark_brief_current(
  uuid, uuid, text, jsonb, text, jsonb, numeric, text[], int, int, int, numeric
) to authenticated, service_role;
