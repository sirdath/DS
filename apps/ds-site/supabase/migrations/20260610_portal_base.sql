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
