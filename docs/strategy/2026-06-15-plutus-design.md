# Plutus — design (AR collections engine)

*Synthesised from five research streams (dunning workflow, late-payment scoring, accounting integrations, compliance/deliverability, production architecture). This is the build spec for `@ds/plutus`. Plutus is the council's #1 product — see [2026-06-15-council-decision.md](2026-06-15-council-decision.md).*

## What it is
Watches a business's unpaid invoices, computes the AR state + a **risk × value** chase list ("who to chase first"), and uses Claude **only to draft** bilingual (Greek/English) escalating reminders that a human **approves before sending**. Managed-service-first; the moat is the bilingual tone + the approval screen + honest prediction, not "another ledger."

## The one principle everything hangs on
**Code owns every number and the schedule; Claude only writes prose.** Amounts, days overdue, due dates, statutory interest, which step we're on — all computed deterministically and passed to the draft as *fixed facts*. A **fact-check guard** rejects any draft that misstates a fact. This makes the engine auditable, testable without a key, and safe to trust.

## Scoring — rules first, ML later (honest by design)
At SMB scale (a customer may have 3–20 invoices) an ML model overfits. Ship a transparent **0–100 rules score**:
- `recent_late_streak` (last 3 invoices late — *the* highest-signal feature) · `avg_days_late` · `pct_late` · `ageing_factor(days_overdue)` · `terms_risk`.
- Bands: low / medium / high / severe, always with the **2–3 drivers shown** ("paid the last 3 late; 40 days overdue; €4,000 outstanding").
- **Cold-start:** new client → ageing-only; new customer → shrink toward a portfolio/terms prior (`w = depth/(depth+3)`). Never show a crisp number on thin data — show a confidence chip.
- **Priority = risk × value × urgency:** `(score/100) × log1p(chaseableDue) × (1 + min(daysOverdue,90)/90)`. This reprioritises off "biggest invoice first" onto "most-likely-to-stiff-you × most money × most overdue" — *that reprioritisation is the product.*
- Per-client only (no pooled data) until ~15–20 clients + a DPA. Claude never predicts — scoring is deterministic.

## Dunning — default cadence + tone ladder
Offsets from due date: **−3, 0, +3, +7, +14, +30, +45, +60** (8 steps). Tone escalates friendly → neutral → firm → (at +14, *softer*: offer a payment plan — the relationship-saver) → formal → final. **Native bilingual template sets**, EL locked to the formal register (εσείς, "Αξιότιμε κύριε"), never machine-translated. **Consolidate** multiple overdue invoices per customer into one reminder. Stop the automated sequence after the final notice → human decision.

## Compliance & safety (build requirements)
- A reminder is a **transactional service message, not marketing** — but the product must make it structurally impossible to inject marketing (content-lint invariant). Lawful basis = legitimate interest (+ contract); a DPA gates ingest (app concern).
- **Human approval gate:** draft → pending → approved/edited → queued → sent. Authenticated approver sees the exact rendered bytes; edit = new version; kill switch per client.
- **Append-only audit** of every step: exact content + `bodyHash`, who approved + when, the invoice referenced, lawful basis, delivery status. 6-year retention.
- **Content guardrails:** no threats, no third-party contact, no implied legal powers, frequency caps, send-time windows. UK statutory interest (8% + BoE base) + fixed compensation (£40/£70/£100) and the EU/Greek equivalent (ECB+8, €40) may be cited *factually* at the formal stage — owner approves, never auto-inserted.
- **Idempotency:** key = `sha256(tenant:invoice:step:scheduledFor)` + an outbox unique index → never double-send. **Stop-on-payment:** a payment event cancels pending steps, *and* a dispatch-time balance re-check aborts a send if cash landed in the meantime.

## Data seam
`AccountingSource` interface (pull + push/poll change-detection + capability flags). MVP adapters (app-side, later): **CSV import + manual** first (works for any SMB, both markets), then **Xero** (cleanest UK data + invoice webhooks), then **Elorus** (the one clean Greek API; myDATA is invoice-discovery only — no payment status). The engine package ships the interface + an in-memory stub.

## Package shape (mirrors fama/xenia/aegis, higher bar)
Pure deterministic core + one quarantined Claude call. Modules:
`types · client · terms · calendar · ageing · scoring · cadence · idempotency · facts · factcheck · draft(the only model call) · source(seam) · channels(seam) · engine(orchestrator) · report · samples · index`.
Determinism: inject `today`, inject the Claude client, inject source/channel → the whole daily cycle runs in a test with no clock/network/key. **The two load-bearing tests:** run the daily cycle twice → **exactly one** send per step; inject a payment → the pending step is **cancelled**.

## Multi-tenancy (app-side)
The engine is pure/stateless. The app persists to Supabase with RLS (owner-or-`is_admin()`, the existing portal pattern): `plutus_customers/invoices/payments/sequences`, an **outbox** with a `unique(user_id, idempotency_key)`, and an **append-only** `plutus_audit_events` (select+insert policies only — no update/delete).

## Build order
`types → terms/calendar → ageing → scoring → cadence/idempotency → facts/factcheck → client/draft → source/channels → engine → report/samples`, each with its test. Engine ships first (fully testable + demoable with zero deps); the Supabase migration + `/workspace/plutus` surface follow.

## Flagged decisions (validate before locking)
- Greek formal-register templates + dual UK/EU statutory engine = the actual moat; **validate templates with a native Greek bookkeeper**.
- Greek tax-retention floor vs GDPR erasure (retain per-category with a `legalHold`); confirm the exact year count + Greek contact-hour limits with an advisor.
- CEI has two formulas in the wild — we compute single-snapshot KPIs (DSO/BPDSO/ADD/buckets/avg-days-to-pay) and omit CEI rather than show a number we can't compute honestly from one snapshot.
