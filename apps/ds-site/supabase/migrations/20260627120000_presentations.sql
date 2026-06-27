-- Presentations — shareable, public-token "decks" that showcase selected products
-- in a chosen order. The builder is internal-only (is_admin RLS). Public viewing
-- happens ONLY through a SECURITY DEFINER rpc keyed by the unguessable token, so the
-- table's RLS stays fully closed to anon (no enumeration, owner never exposed).
-- Reuses is_admin() (20260519154207_admin_panel_init) and set_updated_at().

create table if not exists public.presentations (
  id          uuid primary key default gen_random_uuid(),
  token       uuid not null default gen_random_uuid(),   -- unguessable public key
  owner       uuid references auth.users (id) on delete set null,
  title       text not null default '',
  client_name text,                                       -- nullable
  items       jsonb not null default '[]'::jsonb,         -- ordered tool slugs: ["review-intelligence", ...]
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  expires_at  timestamptz                                 -- null = never expires
);

create unique index if not exists presentations_token_uniq on public.presentations (token);
create index if not exists presentations_owner_idx on public.presentations (owner);

drop trigger if exists presentations_set_updated_at on public.presentations;
create trigger presentations_set_updated_at
  before update on public.presentations
  for each row execute function public.set_updated_at();

alter table public.presentations enable row level security;

-- Builder/owner management: internal admins only. NO anon/public select policy.
drop policy if exists presentations_admin_all on public.presentations;
create policy presentations_admin_all on public.presentations
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.presentations to authenticated, service_role;

-- PUBLIC READ PATH — the only way anon reaches a row. SECURITY DEFINER so it bypasses
-- the closed RLS, but returns at most ONE row, only when the token matches AND the deck
-- is active AND not expired. Never returns owner. A caller must already hold the exact
-- uuid token (122 bits) — no listing, no enumeration.
create or replace function public.get_presentation_by_token(p_token uuid)
returns table (id uuid, title text, client_name text, items jsonb, created_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select p.id, p.title, p.client_name, p.items, p.created_at
  from public.presentations p
  where p.token = p_token
    and p.is_active = true
    and (p.expires_at is null or p.expires_at > now());
$$;

grant execute on function public.get_presentation_by_token(uuid) to anon, authenticated;
