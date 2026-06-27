# Lead Outreach System — research & design (PARKED)

**Status:** Research only — **not approved for build.** Captured 2026-06-17 from a brainstorming
session, then parked to work on the DS2 website. Resume by re-reading this + confirming the two
open questions at the bottom, then go to `writing-plans`.

## Goal
A system to reach out to the leads we discover (Hunt / `marketing_leads`) — **email-first**,
**personalised**, **human-approved**. Not a cold-spray machine; on-brand (challenge-first).

## Locked decisions (from the user)
1. **Shape** = personalised + approval-gated. DS picks leads → Claude drafts a bespoke email per
   lead from the pitch-angle + site analysis → human approve/edit → send via Resend → lead status
   auto-updates. Follow-ups by hand. (Not a multi-step sequence engine; not template mail-merge.)
2. **Post-send tracking** = sends + bounces only. Log every send to per-lead history; flip lead to
   `contacted`; a Resend webhook catches hard bounces → suppression list. Replies land in a real
   inbox; mark `replied`/`meeting` by hand. (No open/click pixels; no inbound reply parsing.)
3. **Draft language** = bilingual, auto-picked (el for `.gr`/Greek area, en otherwise; per-lead override).

## What already exists (reuse — verified against the code)
- **`marketing_leads`** (`20260526190000_marketing_leads.sql`): has `email`, `pitch_angle`,
  `lead_score`, `priority`, `tags[]`, `tech[]`, `ugliness`, `contacted` bool, and a `lead_status`
  pipeline `new|in_progress|contacted|replied|meeting|won|lost|not_a_fit`. Admin-only RLS via `is_admin()`.
- **Admin leads UI** (`admin/(app)/leads/page.tsx`) + actions (`leads-actions.ts`): filters, per-row
  status/contacted/notes edits, bulk status, `promoteLeadToProject`.
- **Hunt** (`/api/admin/leads/find-area`, `analyze-batch`, `parse`): discovers (OSM/Overpass) + scores.
- **Plutus pipeline = ~80% of an outreach engine already:**
  - `plutus/lib/email-channel.ts` → Resend REST send (`RESEND_API_KEY`, idempotency header, Stub fallback).
  - `plutus_outbox` → draft→approve→send→bounced lifecycle + atomic CAS claim (no double-send).
  - `packages/plutus/src/client.ts` → `getClient`/`costUsd`/model routing; `draft.ts` → one-Claude-call
    + `factcheck.ts` guard. Mirror these.
- **Auth**: `/admin` gate (`assertAdmin`, `ADMIN_ALLOWED_EMAILS`), `getServiceRoleClient` / RLS client.

## Gaps (what we'd build)
No outreach draft engine, no send/outbox for leads, no per-lead contact history, no suppression /
unsubscribe, no bounce webhook.

## Proposed design
- **Architecture:** thin **`@ds/outreach`** package (pure: `buildFacts(lead)`, `draftOutreach(facts)`
  one Sonnet 4.6 call, `factCheck`, eligibility/suppression rules, `costUsd`) + app-side wiring
  (Supabase tables, routes, Resend send, `/admin` surface). Mirrors the Plutus split.
- **Data model (new migration, admin-only RLS):**
  - `outreach_messages` — `id`, `lead_id → marketing_leads`, `lang`, `subject`, `body`, `body_hash`,
    `status (draft|approved|sent|bounced|rejected|failed)`, `from_addr`, `reply_to`,
    `provider_message_id`, `decided_by`, `sent_at`, `bounce_reason`, `cost_usd`,
    `idempotency_key UNIQUE`, timestamps.
  - `outreach_suppressions` — `email PK`, `reason (bounce|unsubscribe|manual)`, `lead_id?`, `created_at`.
  - Reuse `marketing_leads.contacted`/`status` for pipeline state.
- **Draft engine:** `buildFacts` derives business name, category, area, the ONE honest site
  observation (from `tags`/`tech`/`ugliness`), `pitch_angle`, auto-picked language → one Claude call
  writes a challenge-first email `{subject, body}` → `factCheck` blocks fabrication / missing business
  name / missing unsubscribe footer.
- **Flow:** filter leads → "Draft outreach" → approval queue (Plutus-style: review/edit/approve&send/
  reject) → send via Resend with atomic claim + suppression re-check → `sent` + lead `contacted` +
  audit → bounce webhook → suppress → unsubscribe link (signed token) → suppress + confirmation.
- **Surface:** `/admin` only — "Draft outreach" action on the leads table + a dedicated
  `/admin/outreach` review queue + per-lead send history.
- **Compliance & deliverability (baked in):** legitimate-interest B2B basis; every email carries a
  sender-identity footer + one-click unsubscribe (`List-Unsubscribe` header + visible link);
  suppression enforced at draft AND send; daily send cap; **recommend a sending subdomain**
  (`outreach.ds2-consulting.com`) to isolate reputation. No tracking pixels. New env:
  `OUTREACH_FROM`, `OUTREACH_REPLY_TO`, `OUTREACH_UNSUB_SECRET` (+ shared `RESEND_API_KEY`).
- **Testing:** engine units (language pick, eligibility, fact-check catches fabrication + missing
  unsubscribe, draft via fake client); app (send CAS = no double-send, suppression gate).

## Open questions (resolve on resume)
1. Compliance footer + one-click unsubscribe in every email — confirm OK (makes it visibly "outreach").
2. Bulk "draft outreach for selected" on the leads table, or strictly one-at-a-time for v1?
