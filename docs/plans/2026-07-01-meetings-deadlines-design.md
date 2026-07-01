# Meetings + Deadlines — implementation plan

Date: 2026-07-01 · Branch: `feat/ds2-upgrades` · Status: proposed (awaiting 4 decisions)

## Goal

Add **Meetings** and **Deadlines** to the DS2 admin, surfaced on the dashboard, editable,
stored in Supabase. Build them as generic **Planning** primitives (no DS-specific naming in
the schema) so the admin panel stays resale-ready.

Storage note: this lives in **Supabase**, not NeuroVault. NeuroVault is local, per-machine
session memory (an MCP), so neither the deployed panel nor Stel's browser can read it.
Supabase is the shared backend the admin already runs on, with RLS.

## What already exists (reuse, do not rebuild)

- **Calendar**: `calendar_events` table already has a `meeting` and a `deadline` color, an
  `assignee` (`'' | dath | stel | both`), `event_date` + `start_time`, and Google two-way sync.
  Actions: `createEvent` / `updateEvent` / `deleteEvent` in
  [calendar-actions.ts](../../apps/ds-site/src/app/admin/calendar-actions.ts). Source with
  graceful column-degrade: `loadEvents()` in
  [calendar-source.ts](../../apps/ds-site/src/app/admin/(app)/calendar/lib/calendar-source.ts).
  UI: [calendar-app.tsx](../../apps/ds-site/src/app/admin/(app)/calendar/calendar-app.tsx) +
  the dashboard `CalendarCard`.
- **Dashboard**: two-column grid; the right column stacks `CalendarCard`, `SiteActivityCard`,
  `TopOpenLeads`. Card vocabulary: `.ds2-card`, `.ds2-list__head`, `.ds2-act`, `.ds2-row` +
  `.ds2-row__bar/__fill`, `.ds2-empty`. Page:
  [(app)/page.tsx](../../apps/ds-site/src/app/admin/(app)/page.tsx).
- **Design kit**: `.ds-card` / `.ds-badge` / `.ds-btn` in
  [ds-kit.css](../../apps/ds-site/src/app/admin/ds-kit.css); an existing `.admin-progress`
  bar in `admin.css`. Semantic tokens `--ds-success #43a47a`, `--ds-warning #c89245`,
  `--ds-danger #c96868`; calendar meeting green `#43a47a`, deadline red `#c96868`.
- **Migration conventions**: `is_admin()` RLS, `set_updated_at()` trigger, idempotent
  (`create table if not exists`, `add column if not exists`, drop-before-create), applied
  by hand in the Supabase SQL editor. Templates: the recent competitors + admin_api_keys
  migrations.

## Data model

### Meetings — extend `calendar_events` (not a new table)

A meeting *is* a dated calendar event with extra metadata. A separate table would duplicate
the grid, source, and Google-sync machinery and force a UNION on the calendar view. So add
three columns (migration `20260701130000_calendar_meeting_fields.sql`), all
`not null default ''` so existing rows and the service-role sync-back never break:

| column | type | meaning |
|---|---|---|
| `meeting_type` | `text not null default ''` | app-validated set: `'' \| cofounders \| shareholders \| client \| internal`. `''` = not a meeting. |
| `meeting_link` | `text not null default ''` | placeholder join URL. |

**"Which team" reuses the existing `assignee`** (`dath / stel / both`) per the locked decision, so
there is **no** new `team` column.

No new trigger/policy/grant: inherited `is_admin()` RLS already covers the table.

### Deadlines — new `planning_deadlines` table

Metric goals (Revenue €320 / €500 → progress bar) have no date, no time, no Google-sync
target, and a numeric current/target shape that does not fit an event row. So a dedicated,
neutral table (migration `20260701140000_planning_deadlines.sql`):

| column | type | notes |
|---|---|---|
| `id` | `uuid pk default gen_random_uuid()` | |
| `kind` | `text not null default 'date'` | app-validated: `date \| metric` (discriminated union) |
| `title` | `text not null default ''` | plain text |
| `due_date` | `date null` | drives the countdown when `kind='date'` |
| `metric_current` | `numeric null` | when `kind='metric'` |
| `metric_target` | `numeric null` | when `kind='metric'` |
| `metric_unit` | `text not null default ''` | e.g. `EUR` |
| `sort_order` | `int not null default 0` | manual ordering |
| `done` | `boolean not null default false` | |
| `created_by` | `uuid references auth.users(id)` | |
| `created_at` / `updated_at` | `timestamptz not null default now()` | |

RLS: shared-admin shape (`for all to authenticated using (is_admin()) with check (is_admin())`).
`set_updated_at` trigger, `grant all to authenticated, service_role`, indexes on `due_date`
and `sort_order`. Seed the two spec examples idempotently (`insert … where not exists`):
a date deadline ("Find first client before August", `due_date 2026-08-01`) and a metric goal
("Revenue this month", `320 / 500 EUR`).

## Build order

1. **Migrations** — the two idempotent files above.
2. **Types + sources** — extend `CalendarEvent` (`meetingType/team/meetingLink`) + a
   `MEETING_TYPES` export in `calendar.ts`; append the columns to the `WITH_ASSIGNEE` select
   in `calendar-source.ts` (keep the base-cols fallback). New `planning/lib/planning.ts`: a
   `Deadline` discriminated type + `loadDeadlines()` (same graceful-degrade shape) + countdown
   and progress helpers.
3. **Server actions** — in `calendar-actions.ts` add a `MEETING_TYPES` set, extend
   `createEvent`/`updateEvent` (Set-validate `meeting_type`, `clean()` the team,
   **URL-validate `meeting_link`** and store `''` on failure). New `planning-actions.ts`
   mirroring the calendar shape: `createDeadline` / `updateDeadline` / `deleteDeadline` /
   `reorderDeadline`.
4. **Dashboard cards** — add `loadDeadlines()` to the page's `Promise.all` and derive upcoming
   meetings from the already-loaded `events`. Insert two `.ds2-card` sections in the right
   column, after `SiteActivityCard`, before `TopOpenLeads`:
   - **Upcoming meetings**: events where `meetingType !== '' && eventDate >= today && !done`,
     each with a relative "when" chip and a **Join** link.
   - **Deadlines**: date rows → countdown chip; metric rows → progress bar.
   Cap each to ~3 rows with a "View all →" link.
5. **Kit CSS** — add generic `.ds-progress` / `.ds-chip` / `.ds-chip--countdown` to
   `ds-kit.css` (`--ds-*` tokens only, 999px pill radius, reuse the meeting-green / deadline-red).
6. **Calendar editor + Planning UI** — reveal the three meeting fields in `calendar-app.tsx`
   when `color==='meeting'`; render a `meeting_type` chip + Join link on the calendar. Add a
   minimal Planning list (add/edit/delete/reorder) for deadlines. (Rail tab: decision 3 below.)
7. **Verify + deploy** — typecheck + lint + build; apply both migrations; smoke-test a meeting
   (chip + Join on the card, green tag on the calendar), the seeded deadlines (countdown +
   progress bar), and the chips in light + dark; promote `feat/ds2-upgrades → main`, poll the
   `ds2-consulting` Vercel deploy.

## Google Calendar sync stance (MVP)

Meeting fields are **admin-panel-authoritative**. We do **not** add `meeting_type/team/meeting_link`
to `mirrorToGoogle`, so there is no sync-back loop (sync-back only writes
title/description/date/time/synced_at, the same guarantee that already protects color/assignee).
Consequence: a meeting created on the phone in Google shows in the admin without meeting
metadata. If join links must reach Google later, map `meeting_link → event.location` and extract
it in `normalize()`, keeping type/team out of the Google path.

## Risks + mitigations

- **`meeting_link` injection** — validate server-side with the `URL` constructor (reject
  non-http(s)), store `''` on failure, render only through Next `<a>`.
- **Dashboard overflow** — the right column already stacks 3 cards; cap each new card to ~3
  rows + "View all →", and re-check the 920px / 560px media queries.
- **RLS granularity** — `is_admin()` is blanket (both founders see all). Fine for two founders;
  per-team visibility would be a future policy change, not a schema change (YAGNI).
- **Sellability** — keep `meeting_type` an app-side Set (a buyer swaps labels without a
  migration) and `team` free-text; no DS-specific labels in the DB.
- **Idempotency** — both migrations use `add column if not exists` / `create table if not
  exists` / drop-before-create / `insert … where not exists`, since they are applied by hand.

## Decisions (locked 2026-07-01)

1. **Meeting types** = `{Cofounders team, Top shareholders, Client, Internal}`. `client` is a
   **flat tag** for v1 (no `project_id` link yet).
2. **Team** = reuse the existing `assignee` (`dath / stel / both`). **No new `team` column.**
3. **Editing** = **inline** on the dashboard Deadlines card + meetings in the Calendar tab.
   No Planning rail tab for v1.
4. **Metric goals** = edited **manually** in v1 (auto-pull from pipeline is a later wiring).
