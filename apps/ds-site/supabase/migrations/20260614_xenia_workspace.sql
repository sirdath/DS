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
