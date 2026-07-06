-- ════════════════════════════════════════════════════════════════════════
-- DS2 brain — shared semantic memory for the copilot (+ future local agents)
-- ════════════════════════════════════════════════════════════════════════
-- Durable facts the copilot carries across conversations: client preferences,
-- decisions, who-owns-what, rules. Shared across the founders. Recall is keyless
-- to start (full-text + trigram); an embedding column + hnsw index is added in a
-- follow-up migration once the embedding provider (Voyage/OpenAI/gte) is chosen —
-- Anthropic has no embeddings API, so that choice sets the vector dimension.

create extension if not exists vector;   -- ready for the semantic layer
create extension if not exists pg_trgm;  -- trigram similarity for keyless recall

create table if not exists public.ds2_brain (
  id          uuid primary key default gen_random_uuid(),
  content     text not null,
  kind        text not null default 'fact',  -- fact | preference | decision | person | client | rule
  tags        text[] not null default '{}',
  source      text,                           -- 'copilot:<conversation id>' | 'manual' | ...
  created_by  text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  content_tsv tsvector generated always as (to_tsvector('simple', content)) stored
);

create index if not exists ds2_brain_tsv_idx on public.ds2_brain using gin (content_tsv);
create index if not exists ds2_brain_trgm_idx on public.ds2_brain using gin (content gin_trgm_ops);
create index if not exists ds2_brain_updated_idx on public.ds2_brain (updated_at desc);

alter table public.ds2_brain enable row level security;
create policy ds2_brain_admin_all on public.ds2_brain
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Keyless recall: rank by full-text relevance, falling back to trigram similarity
-- so loose/typo'd queries still hit. Replaced by a hybrid (vector + text) version
-- when embeddings land.
create or replace function public.ds2_brain_recall(q text, k int default 6)
returns table (id uuid, content text, kind text, tags text[], score real)
language sql stable as $$
  select b.id, b.content, b.kind, b.tags,
         greatest(
           ts_rank(b.content_tsv, plainto_tsquery('simple', q)),
           similarity(b.content, q)
         ) as score
  from public.ds2_brain b
  where b.content_tsv @@ plainto_tsquery('simple', q)
     or b.content % q
  order by score desc
  limit greatest(1, least(k, 20));
$$;
