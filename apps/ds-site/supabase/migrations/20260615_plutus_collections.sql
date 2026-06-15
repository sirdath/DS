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
