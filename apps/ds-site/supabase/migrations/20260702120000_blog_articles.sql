-- Blog / SEO content engine (Phase 1): articles written in the admin panel
-- (AI-drafted, founder-approved) + newsletter subscribers captured on the
-- public blog. Admin-gated via is_admin(); published articles are readable
-- by anyone (the public /blog pages read as anon).

-- ── articles ──
create table if not exists public.articles (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique,
  lang           text not null default 'en',     -- el | en
  hreflang_group text not null default '',       -- pairs an EL article with its EN sibling
  title          text not null default '',
  description    text not null default '',       -- meta description
  body_md        text not null default '',
  topic          text not null default '',
  status         text not null default 'draft',  -- draft | review | published
  published_at   timestamptz,
  created_by     uuid references auth.users (id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index if not exists articles_status_published_idx
  on public.articles (status, published_at desc);

drop trigger if exists articles_set_updated_at on public.articles;
create trigger articles_set_updated_at before update on public.articles
  for each row execute function public.set_updated_at();

alter table public.articles enable row level security;
drop policy if exists articles_admin_all on public.articles;
create policy articles_admin_all on public.articles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());
-- Public blog reads: anyone can read published articles (and only those).
drop policy if exists articles_public_read on public.articles;
create policy articles_public_read on public.articles
  for select to anon, authenticated using (status = 'published');
grant select on public.articles to anon;
grant all on public.articles to authenticated, service_role;

-- ── blog_subscribers (newsletter capture) ──
create table if not exists public.blog_subscribers (
  id         uuid primary key default gen_random_uuid(),
  email      text not null unique,
  lang       text not null default 'en',  -- el | en
  created_at timestamptz not null default now()
);

alter table public.blog_subscribers enable row level security;
-- Founders read/prune the list; the public may only insert (newsletter signups).
drop policy if exists blog_subscribers_admin_select on public.blog_subscribers;
create policy blog_subscribers_admin_select on public.blog_subscribers
  for select to authenticated using (public.is_admin());
drop policy if exists blog_subscribers_admin_delete on public.blog_subscribers;
create policy blog_subscribers_admin_delete on public.blog_subscribers
  for delete to authenticated using (public.is_admin());
drop policy if exists blog_subscribers_public_insert on public.blog_subscribers;
create policy blog_subscribers_public_insert on public.blog_subscribers
  for insert to anon, authenticated with check (true);
grant insert on public.blog_subscribers to anon;
grant all on public.blog_subscribers to authenticated, service_role;
