-- Per-founder Anthropic credential, stored against the admin's own Supabase account.
-- The Competitors scan reads the LOGGED-IN founder's row (RLS returns only your own),
-- so Dath scans with Dath's credential and Stel with Stel's. One row per user.
--
-- Holds either a metered API key (sk-ant-api…) or a Claude subscription OAuth token
-- (sk-ant-oat…); the scan picks the right auth scheme from the prefix.
--
-- NOTE: stored as plaintext, protected by owner-only RLS. It never leaves the server
-- except masked. A future hardening could encrypt at rest (pgsodium / Supabase Vault).

create table if not exists public.admin_api_keys (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  credential  text not null,
  updated_at  timestamptz not null default now()
);

alter table public.admin_api_keys enable row level security;

-- Each admin manages only their own row.
drop policy if exists admin_api_keys_own on public.admin_api_keys;
create policy admin_api_keys_own on public.admin_api_keys
  for all to authenticated
  using (user_id = auth.uid() and public.is_admin())
  with check (user_id = auth.uid() and public.is_admin());

grant all on public.admin_api_keys to authenticated, service_role;

drop trigger if exists admin_api_keys_set_updated_at on public.admin_api_keys;
create trigger admin_api_keys_set_updated_at before update on public.admin_api_keys
  for each row execute function public.set_updated_at();
