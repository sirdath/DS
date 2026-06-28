-- ============================================================================
-- DS2: migrations that were never applied in production (run in the SQL editor)
-- Confirmed missing via direct REST checks 2026-06-28. Run top-to-bottom.
-- If a statement errors that an object 'already exists', that piece was applied
-- earlier — safe to ignore and continue. (admin_notes was already fixed.)
-- ============================================================================

-- ─────────────────────────────────────────────────────────────────────────
-- 20260610_portal_base.sql
-- ─────────────────────────────────────────────────────────────────────────
-- DS2 Portal base schema: profiles, tool subscriptions, deliverables.
-- Run once in Supabase Studio (SQL editor) on the project the site points to.
-- Auth: Supabase Auth (magic link). RLS: users see only their own rows;
-- the service role (used by /admin and the founders) bypasses RLS.

create table if not exists public.portal_profiles (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  full_name  text not null default '',
  company    text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.portal_subscriptions (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users (id) on delete cascade,
  tool_slug  text not null check (tool_slug in ('competitor-watch','review-intelligence','site-selection','ai-receptionist')),
  status     text not null default 'requested' check (status in ('requested','active','paused','ended')),
  note       text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tool_slug)
);

create table if not exists public.portal_deliverables (
  id              uuid primary key default gen_random_uuid(),
  subscription_id uuid not null references public.portal_subscriptions (id) on delete cascade,
  title           text not null,
  summary         text not null default '',
  file_path       text not null default '',  -- path inside the 'portal-deliverables' storage bucket
  published_at    timestamptz not null default now()
);

alter table public.portal_profiles      enable row level security;
alter table public.portal_subscriptions enable row level security;
alter table public.portal_deliverables  enable row level security;

create policy "own profile read"   on public.portal_profiles      for select using (auth.uid() = user_id);
create policy "own profile upsert" on public.portal_profiles      for insert with check (auth.uid() = user_id);
create policy "own profile update" on public.portal_profiles      for update using (auth.uid() = user_id);

create policy "own subs read"      on public.portal_subscriptions for select using (auth.uid() = user_id);
create policy "own subs request"   on public.portal_subscriptions for insert with check (auth.uid() = user_id and status = 'requested');

create policy "own deliverables read" on public.portal_deliverables for select
  using (exists (select 1 from public.portal_subscriptions s where s.id = subscription_id and s.user_id = auth.uid()));

-- Private bucket for report files; clients read only files under their own subscription paths.
insert into storage.buckets (id, name, public) values ('portal-deliverables', 'portal-deliverables', false)
  on conflict (id) do nothing;

create policy "own files read" on storage.objects for select
  using (
    bucket_id = 'portal-deliverables'
    and exists (
      select 1 from public.portal_subscriptions s
      where s.user_id = auth.uid() and (storage.foldername(name))[1] = s.id::text
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- 20260614_xenia_workspace.sql
-- ─────────────────────────────────────────────────────────────────────────
-- Xenia (AI receptionist) — workspace schema.
-- A client = a Supabase auth user (the existing portal model, see
-- 20260610_portal_base.sql). Each client owns their receptionist config, their
-- conversations, and the appointments those produce. RLS scopes every row to its
-- owner; internal founders (registered in admin_users, see is_admin() from
-- 20260519154207_admin_panel_init.sql) can read across clients without the
-- service-role key on the request path.

-- ── xenia_configs (one receptionist setup per client) ─────────────────
create table public.xenia_configs (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  config      jsonb not null default '{}'::jsonb,  -- BusinessConfig: services, hours, persona, policy
  updated_at  timestamptz not null default now()
);

-- ── xenia_conversations ──────────────────────────────────────────────
create table public.xenia_conversations (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  status      text not null default 'collecting'
                check (status in ('collecting', 'proposing', 'confirmed', 'handoff')),
  lang        text not null default 'el' check (lang in ('el', 'en')),
  slots       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index xenia_conversations_user_idx on public.xenia_conversations (user_id, created_at desc);

-- ── xenia_messages (human-facing turns) ──────────────────────────────
create table public.xenia_messages (
  id               uuid primary key default gen_random_uuid(),
  conversation_id  uuid not null references public.xenia_conversations (id) on delete cascade,
  role             text not null check (role in ('user', 'assistant')),
  text             text not null,
  created_at       timestamptz not null default now()
);

create index xenia_messages_conversation_idx on public.xenia_messages (conversation_id, created_at);

-- ── xenia_appointments ───────────────────────────────────────────────
create table public.xenia_appointments (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  conversation_id  uuid references public.xenia_conversations (id) on delete set null,
  service_id       text not null,
  appt_date        date not null,
  appt_time        text not null,
  party_size       int not null,
  name             text not null,
  contact          text not null,
  created_at       timestamptz not null default now()
);

create index xenia_appointments_user_idx on public.xenia_appointments (user_id, appt_date);

-- ── updated_at trigger on configs (reuses set_updated_at from admin init) ──
create trigger xenia_configs_set_updated_at
  before update on public.xenia_configs
  for each row execute function public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────
alter table public.xenia_configs        enable row level security;
alter table public.xenia_conversations  enable row level security;
alter table public.xenia_messages       enable row level security;
alter table public.xenia_appointments   enable row level security;

-- A client touches only their own rows; an internal founder (is_admin) sees all.
create policy xenia_configs_owner on public.xenia_configs
  for all to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy xenia_conversations_owner on public.xenia_conversations
  for all to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy xenia_appointments_owner on public.xenia_appointments
  for all to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Messages inherit their conversation's owner.
create policy xenia_messages_owner on public.xenia_messages
  for all to authenticated
  using (
    exists (
      select 1 from public.xenia_conversations c
      where c.id = conversation_id and (c.user_id = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.xenia_conversations c
      where c.id = conversation_id and (c.user_id = auth.uid() or public.is_admin())
    )
  );

-- ─────────────────────────────────────────────────────────────────────────
-- 20260615_plutus_collections.sql
-- ─────────────────────────────────────────────────────────────────────────
-- Plutus (collections) — workspace schema.
-- A client = a Supabase auth user (the existing portal model, see
-- 20260610_portal_base.sql). Each client owns their receivables: business
-- profile, customers, invoices, payments, chase sequences, the send outbox, and
-- an append-only audit log. RLS scopes every row to its owner; internal founders
-- (is_admin(), from 20260519154207_admin_panel_init.sql) read across clients
-- without the service-role key on the request path.
--
-- Money is integer minor units (cents) stored as bigint — never a float, and
-- wide enough for any realistic AR balance. Engine string IDs (customer/invoice/
-- payment) are the natural keys, scoped by user_id, so the SupabaseAccountingSource
-- maps rows straight onto the @ds/plutus domain types.

-- ── plutus_business (one creditor profile per client) ────────────────
create table public.plutus_business (
  user_id              uuid primary key references auth.users (id) on delete cascade,
  name                 text not null default '',
  lang                 text not null default 'el' check (lang in ('el', 'en')),
  calendar             text not null default 'GR',
  pay_to_instructions  text,
  updated_at           timestamptz not null default now()
);

-- ── plutus_customers ─────────────────────────────────────────────────
create table public.plutus_customers (
  user_id         uuid not null references auth.users (id) on delete cascade,
  customer_id     text not null,                       -- engine Customer.id (slug)
  name            text not null,
  contacts        jsonb not null default '[]'::jsonb,  -- Contact[]
  lang            text not null default 'el' check (lang in ('el', 'en')),
  calendar        text not null default 'GR',
  sequence_id     text not null default 'standard',
  do_not_contact  boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  primary key (user_id, customer_id)
);

-- ── plutus_invoices ──────────────────────────────────────────────────
create table public.plutus_invoices (
  user_id             uuid not null references auth.users (id) on delete cascade,
  invoice_id          text not null,                   -- engine Invoice.id
  number              text not null,                   -- human/legal reference
  customer_id         text not null,
  currency            text not null default 'EUR' check (currency in ('EUR', 'GBP', 'USD')),
  issue_date          date not null,
  due_date            date not null,
  terms               jsonb not null,                  -- PaymentTerms
  amount              bigint not null,                 -- minor units
  status              text not null default 'open'
                        check (status in ('open', 'partially_paid', 'paid', 'written_off', 'in_collections')),
  paid_date           date,
  dispute             jsonb,
  amount_written_off  bigint,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  primary key (user_id, invoice_id),
  -- Intra-tenant integrity: an invoice's customer must exist (same tenant).
  -- on delete cascade keeps the existing user-level cascade clean (RESTRICT would
  -- fail mid-cascade when an auth.users row is deleted).
  foreign key (user_id, customer_id) references public.plutus_customers (user_id, customer_id) on delete cascade
);

create index plutus_invoices_customer_idx on public.plutus_invoices (user_id, customer_id);

-- ── plutus_payments (applied-cash ledger; an invoice's paid = Σ these) ─
create table public.plutus_payments (
  user_id      uuid not null references auth.users (id) on delete cascade,
  payment_id   text not null,
  invoice_id   text not null,
  customer_id  text not null,
  amount       bigint not null,                        -- + cash in, − reversal
  date         date not null,
  method       text check (method in ('transfer', 'card', 'cash', 'cheque', 'other')),
  reference    text,
  created_at   timestamptz not null default now(),
  primary key (user_id, payment_id),
  foreign key (user_id, invoice_id) references public.plutus_invoices (user_id, invoice_id) on delete cascade,
  foreign key (user_id, customer_id) references public.plutus_customers (user_id, customer_id) on delete cascade
);

create index plutus_payments_invoice_idx on public.plutus_payments (user_id, invoice_id);

-- ── plutus_sequences (chase cadence per segment) ─────────────────────
create table public.plutus_sequences (
  user_id       uuid not null references auth.users (id) on delete cascade,
  sequence_id   text not null,
  name          text not null default '',
  steps         jsonb not null default '[]'::jsonb,    -- ChaseStep[]
  cooldown_days int not null default 5,
  updated_at    timestamptz not null default now(),
  primary key (user_id, sequence_id)
);

-- ── plutus_outbox (one row per scheduled send; exactly-once) ─────────
-- The idempotency key = sha256(tenant:invoice:step:scheduledFor). A UNIQUE on it
-- makes the daily cycle exactly-once: a re-run upserts the same row, never a
-- duplicate send. status drives the approval→send lifecycle.
create table public.plutus_outbox (
  user_id          uuid not null references auth.users (id) on delete cascade,
  idempotency_key  text not null unique,
  customer_id      text not null,
  invoice_id       text not null,
  step_id          text not null,
  channel          text not null check (channel in ('email', 'sms', 'letter')),
  tone             text not null,
  lang             text not null default 'el' check (lang in ('el', 'en')),
  subject          text not null default '',
  body             text not null default '',
  body_hash        text not null default '',
  status           text not null default 'pending'
                     check (status in ('pending', 'approved', 'rejected', 'edited', 'sent', 'bounced', 'cancelled')),
  scheduled_for    date not null,
  decided_by       uuid references auth.users (id),
  sent_at          timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  foreign key (user_id, invoice_id) references public.plutus_invoices (user_id, invoice_id) on delete cascade,
  foreign key (user_id, customer_id) references public.plutus_customers (user_id, customer_id) on delete cascade
);

create index plutus_outbox_user_status_idx on public.plutus_outbox (user_id, status, scheduled_for);

-- ── plutus_audit (append-only source of truth) ───────────────────────
-- Append-only is enforced by RLS: authenticated rows get SELECT + INSERT
-- policies only — no UPDATE/DELETE policy exists, so PostgREST denies both.
create table public.plutus_audit (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users (id) on delete cascade,
  type             text not null,
  customer_id      text,
  invoice_id       text,
  step_id          text,
  idempotency_key  text,
  actor            jsonb not null default '{}'::jsonb,  -- { kind, id }
  reason           text,
  data             jsonb not null default '{}'::jsonb,
  occurred_at      timestamptz not null default now()
);

create index plutus_audit_user_idx on public.plutus_audit (user_id, occurred_at desc);
-- Idempotent keyed events: a given (key, type) is recorded once even if the cycle
-- re-runs. NULL idempotency_key rows stay distinct (Postgres NULLS DISTINCT), so
-- un-keyed events (e.g. payment_applied) are never collapsed.
create unique index plutus_audit_dedup_idx on public.plutus_audit (user_id, idempotency_key, type);

-- ── updated_at triggers (reuse set_updated_at from admin init) ───────
create trigger plutus_business_set_updated_at
  before update on public.plutus_business
  for each row execute function public.set_updated_at();
create trigger plutus_customers_set_updated_at
  before update on public.plutus_customers
  for each row execute function public.set_updated_at();
create trigger plutus_invoices_set_updated_at
  before update on public.plutus_invoices
  for each row execute function public.set_updated_at();
create trigger plutus_sequences_set_updated_at
  before update on public.plutus_sequences
  for each row execute function public.set_updated_at();
create trigger plutus_outbox_set_updated_at
  before update on public.plutus_outbox
  for each row execute function public.set_updated_at();

-- ── Row Level Security ───────────────────────────────────────────────
alter table public.plutus_business   enable row level security;
alter table public.plutus_customers  enable row level security;
alter table public.plutus_invoices   enable row level security;
alter table public.plutus_payments   enable row level security;
alter table public.plutus_sequences  enable row level security;
alter table public.plutus_outbox     enable row level security;
alter table public.plutus_audit      enable row level security;

-- Owner-or-admin, full access — for every table except the append-only audit.
create policy plutus_business_owner on public.plutus_business
  for all to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy plutus_customers_owner on public.plutus_customers
  for all to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy plutus_invoices_owner on public.plutus_invoices
  for all to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy plutus_payments_owner on public.plutus_payments
  for all to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy plutus_sequences_owner on public.plutus_sequences
  for all to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

create policy plutus_outbox_owner on public.plutus_outbox
  for all to authenticated
  using (auth.uid() = user_id or public.is_admin())
  with check (auth.uid() = user_id or public.is_admin());

-- Audit: read your own (or all, if admin) and insert your own. No update/delete
-- policy → append-only for everyone on the request path.
create policy plutus_audit_read on public.plutus_audit
  for select to authenticated
  using (auth.uid() = user_id or public.is_admin());
create policy plutus_audit_insert on public.plutus_audit
  for insert to authenticated
  with check (auth.uid() = user_id or public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────
-- 20260626120000_outreach_briefs.sql
-- ─────────────────────────────────────────────────────────────────────────
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
