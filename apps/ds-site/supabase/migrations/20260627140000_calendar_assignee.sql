-- Tag who's responsible for a calendar event. '' = unassigned; otherwise one of
-- 'dath' | 'stel' | 'both' (the two founders). Additive — safe to run on the live table.

alter table public.calendar_events
  add column if not exists assignee text not null default '';
