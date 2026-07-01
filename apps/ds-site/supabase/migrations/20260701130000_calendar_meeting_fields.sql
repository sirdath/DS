-- Meetings ride on calendar_events: a meeting is a dated event with a type + a join link.
-- "Which team" reuses the existing assignee (dath/stel/both), so there is no team column.
-- Both default '' so existing rows and the Google sync-back never break; inherited
-- is_admin() RLS already covers the table.

alter table public.calendar_events add column if not exists meeting_type text not null default '';
alter table public.calendar_events add column if not exists meeting_link text not null default '';
