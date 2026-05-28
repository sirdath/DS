-- Add an "in progress" stage to the lead funnel — the active call queue:
--   new → in_progress → contacted → replied → meeting → won / lost / not_a_fit
-- Run once (Supabase SQL editor or `supabase db push`). ADD VALUE can't run inside
-- a transaction, so keep it as its own statement.
alter type lead_status add value if not exists 'in_progress' before 'contacted';
