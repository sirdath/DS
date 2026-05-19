# Admin Panel — Design

**Date:** 2026-05-19
**Status:** Approved (design phase)
**Owners:** Dimitris, Stelios
**App:** `apps/ds-site` → route `/admin`

## 1. Purpose

A private internal portal for the two DS2 founders to track every client/website
engagement in one place: pipeline status, completion progress, ownership, money,
and an activity log. Becomes the single secured front door — the existing
`$ecretAnalytics` page (currently protected only by an obscure URL) moves behind
this same auth gate, making it actually safe.

Not a client-facing feature. Not multi-tenant. Exactly two users, ever.

## 2. Build approach — Contract-first, frontend-first, then wire backend

Chosen approach (Approach A):

1. Lock the data contract on paper first: the `projects` schema + a shared
   TypeScript `Project` type.
2. Build the entire frontend (dashboard, detail, edit) against a **typed
   in-memory mock** using `frontendmaxxing-reference` (ported on demand) + GSAP.
3. Swap the data layer to Supabase (Server Actions + RLS + Auth) with component
   code unchanged, because components already code against the final type.

Rationale: honors the "frontend first" preference while eliminating the one
expensive failure mode — rebuilding UI when the data model shifts.

## 3. Architecture, routing & security

### Routes (App Router, in `apps/ds-site`)

- `/admin/login` — username + password form (the only unguarded admin route)
- `/admin` — dashboard grid of all projects
- `/admin/project/[id]` — single project detail + inline edit
- `/admin/analytics` — relocated from `$ecretAnalytics` (code preserved, gated)

### Auth — username on the surface, Supabase Auth underneath

Supabase Auth is email-based internally; we expose **username + password**.
Server-side resolves username → linked Supabase account via a small
`admin_users` table, then completes sign-in. Supabase session management + RLS
are retained (we do NOT hand-roll auth — that would create risk for
client/revenue data).

### Defence in depth (four layers)

1. **Supabase Auth** email+password; public signup disabled at project level.
   The two users are seeded manually once in the Supabase dashboard.
2. **Username → account resolution** via `admin_users` (username, auth_user_id).
3. **Email/account allowlist** — a valid session is still rejected unless the
   underlying account is in a hardcoded server-side allowlist.
4. **Middleware** — `src/middleware.ts` matcher extended to
   `/admin/:path*` and the analytics route; no valid session → redirect to
   `/admin/login`. Runs at the edge before any page renders.
5. **Postgres RLS** — `projects` / `project_activity` have RLS ON, policies
   allow only authenticated allowlisted accounts. Browser uses the **anon** key
   only; the **service-role** key is never shipped client-side.

### Risk explicitly addressed

The existing `$ecretAnalytics` page is protected by nothing but a weird URL and
reads Supabase via the service-role pattern, outside the middleware matcher.
This design retires that model: analytics is relocated under `/admin/analytics`
and gated by the same auth. Existing analytics code is preserved, only moved.

## 4. Data model

### `projects`

| Field | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | Client / project name |
| `url` | text | Live or staging URL |
| `status` | enum | `lead` / `in_progress` / `delivered` / `retainer` |
| `completion_pct` | int 0–100 | Progress bar |
| `lead` | text | Owner (Dimitris / Stelios) |
| `contract_value` | numeric | |
| `amount_paid` | numeric | derives "outstanding" |
| `retainer_monthly` | numeric (nullable) | only when on retainer |
| `start_date` | date (nullable) | |
| `target_date` | date (nullable) | drives "overdue" flag |
| `delivered_date` | date (nullable) | |
| `client_company` | text | PII — RLS-protected |
| `client_contact` | text | PII |
| `client_email` | text | PII |
| `client_phone` | text | PII |
| `notes` | text | Freeform |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | |

### `project_activity` (timestamped update feed)

`id`, `project_id` FK, `body` text, `author` text, `created_at` timestamptz.

### `admin_users`

`id`, `username` text unique, `auth_user_id` uuid (FK to Supabase auth user).
Seeded with the two founder accounts.

### Contract

A shared TypeScript `Project` type (`apps/ds-site/src/app/admin/types.ts`) is
the single source of truth. Frontend codes against it from day one; the Supabase
swap touches zero components.

## 5. Frontend (frontendmaxxing + GSAP)

- **Visual language:** dark, matte, pure-neutral grays (R=G=B, no blue
  undertone — per palette preference), consistent with existing analytics so
  admin + analytics feel like one product.
- **Dashboard (`/admin`):** GSAP-staggered card grid. Card = name, color-coded
  status pill, animated completion bar, lead, money summary (paid / outstanding),
  overdue badge. Top bar: portfolio totals (total contract value, collected,
  MRR from retainers), status filter, link to Analytics.
- **Project detail (`/admin/project/[id]`):** full record, inline edit, activity
  feed with "add update", GSAP transitions.
- **Components:** ported on demand from `packages/frontendmaxxing-reference/`
  into the admin app (never import the reference package directly, per
  CLAUDE.md). GSAP for stagger / scroll / number-count.
- Respects `prefers-reduced-motion`.

## 6. Data flow, errors, testing

- **Data flow:** Server Components read via Supabase server client (anon key +
  user session, RLS-enforced). Mutations via Server Actions (`'use server'`):
  create/update project, add activity. Phase-A implementations read/write a
  typed in-memory mock; Phase-B swaps implementations to Supabase with
  signatures unchanged.
- **Errors:** auth failure → redirect to `/admin/login` with message; DB/network
  error → non-blocking inline banner (same pattern as existing analytics page),
  never a white screen; form validation at the Server Action boundary.
- **Testing:** unit tests for status/money derivations (outstanding, MRR,
  overdue) and the username→account resolver; smoke test that middleware
  redirects an unauthenticated `/admin` request. 80% target on the pure logic
  modules, not visual components.

## 7. Out of scope (YAGNI)

- Public signup / password reset UI (two manually-seeded users only).
- Roles/permissions (both users are full admins).
- Real-time collaboration / websockets.
- Multi-tenant / client-facing views.
