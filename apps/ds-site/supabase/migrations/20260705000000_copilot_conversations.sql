-- ════════════════════════════════════════════════════════════════════════
-- Copilot conversations — episodic memory
-- ════════════════════════════════════════════════════════════════════════
-- Persists copilot chats so they survive reloads, are listable, and can be
-- resumed from either the full page or the floating widget. Shared across the
-- founders (both owners see every conversation); created_by records who started
-- it. Two JSONB blobs per conversation:
--   items   — the rendered UI turns (ChatItem[]), for display on load
--   history — the Anthropic message array (with tool_use/tool_result/thinking),
--             replayed verbatim to continue the thread
-- One row per conversation, rewritten after each turn (conversations are small).

create table if not exists public.copilot_conversations (
  id          uuid primary key default gen_random_uuid(),
  title       text not null default 'New chat',
  created_by  text not null default '',
  items       jsonb not null default '[]'::jsonb,
  history     jsonb not null default '[]'::jsonb,
  usage       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists copilot_conversations_updated_idx
  on public.copilot_conversations (updated_at desc);

alter table public.copilot_conversations enable row level security;

-- Client access is admin-only; the server reads/writes with the service-role
-- key (bypasses RLS) and gates on owner role in the action layer.
create policy copilot_conversations_admin_all on public.copilot_conversations
  for all to authenticated
  using (public.is_admin()) with check (public.is_admin());
