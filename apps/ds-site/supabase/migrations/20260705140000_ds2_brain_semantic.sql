-- ════════════════════════════════════════════════════════════════════════
-- DS2 brain — semantic layer (gte-small, 384-dim, in-stack)
-- ════════════════════════════════════════════════════════════════════════
-- Upgrades the keyless brain to hybrid retrieval per NeuroVault's blueprint:
-- vector (gte-small via a Supabase Edge Function) fused with the existing
-- full-text + trigram via Reciprocal Rank Fusion. Adds supersede pointers
-- (soft, reversible) filtered out of recall, and a nearest-neighbour helper for
-- dedup-on-write. Embedding is passed in as text and cast to vector(384) so it
-- rides PostgREST rpc cleanly. Content is canonical; the vector is a rebuildable
-- index (embedding_model/dim recorded per row for fearless model swaps later).

alter table public.ds2_brain add column if not exists embedding vector(384);
alter table public.ds2_brain add column if not exists superseded_by uuid references public.ds2_brain (id) on delete set null;
alter table public.ds2_brain add column if not exists embedding_model text;
alter table public.ds2_brain add column if not exists embedding_dim int;

create index if not exists ds2_brain_hnsw_idx on public.ds2_brain using hnsw (embedding vector_cosine_ops);
create index if not exists ds2_brain_superseded_idx on public.ds2_brain (superseded_by);

-- Nearest live fact to an embedding, for dedup-on-write (cosine distance).
create or replace function public.ds2_brain_nearest(q_embedding text)
returns table (id uuid, content text, distance real)
language sql stable as $$
  select b.id, b.content, (b.embedding <=> q_embedding::vector(384))::real as distance
  from public.ds2_brain b
  where b.embedding is not null and b.superseded_by is null
  order by b.embedding <=> q_embedding::vector(384)
  limit 1;
$$;

-- Hybrid recall: vector + full-text + trigram, fused with RRF (scale-free rank
-- combination). Superseded facts are excluded.
create or replace function public.ds2_brain_recall_hybrid(
  q text, q_embedding text, match_count int default 8, rrf_k int default 60
)
returns table (id uuid, content text, kind text, tags text[], score real)
language sql stable as $$
  with
  vec as (
    select b.id, row_number() over (order by b.embedding <=> q_embedding::vector(384)) as rnk
    from public.ds2_brain b
    where b.embedding is not null and b.superseded_by is null
    order by b.embedding <=> q_embedding::vector(384)
    limit match_count * 3
  ),
  fts as (
    select b.id, row_number() over (order by ts_rank(b.content_tsv, websearch_to_tsquery('simple', q)) desc) as rnk
    from public.ds2_brain b
    where b.content_tsv @@ websearch_to_tsquery('simple', q) and b.superseded_by is null
    limit match_count * 3
  ),
  trgm as (
    select b.id, row_number() over (order by similarity(b.content, q) desc) as rnk
    from public.ds2_brain b
    where b.content % q and b.superseded_by is null
    order by similarity(b.content, q) desc
    limit match_count * 3
  ),
  fused as (
    select id, sum(1.0 / (rrf_k + rnk))::real as score
    from (select id, rnk from vec union all select id, rnk from fts union all select id, rnk from trgm) u
    group by id
  )
  select b.id, b.content, b.kind, b.tags, f.score
  from fused f join public.ds2_brain b on b.id = f.id
  order by f.score desc
  limit greatest(1, least(match_count, 20));
$$;

-- Keep superseded facts out of the keyless recall too.
create or replace function public.ds2_brain_recall(q text, k int default 6)
returns table (id uuid, content text, kind text, tags text[], score real)
language sql stable as $$
  select b.id, b.content, b.kind, b.tags,
         greatest(ts_rank(b.content_tsv, plainto_tsquery('simple', q)), similarity(b.content, q)) as score
  from public.ds2_brain b
  where (b.content_tsv @@ plainto_tsquery('simple', q) or b.content % q)
    and b.superseded_by is null
  order by score desc
  limit greatest(1, least(k, 20));
$$;
