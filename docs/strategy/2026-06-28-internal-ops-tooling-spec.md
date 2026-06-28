# DS2, Internal operating system: spec for the eight back-office tools

*Date: 2026-06-28. Companion to [2026-06-15-tool-opportunities.md](2026-06-15-tool-opportunities.md). That doc specs the products we sell clients (Phylax, Nostos, Hermes, Themis…). This one specs the tools we need to run DS2 itself: the back half of the engagement our admin currently leaves open. Grounded in the standard PSA / agency-ops feature set (BigTime, Rocketlane, Productive) and filtered through our stack (Next.js · Supabase/Postgres · Claude) and our positioning.*

---

## The thesis

Our admin covers the **front** of an engagement: find leads (Hunt), research them (Outreach/Peitho), pitch, and a project register. Everything after "they said yes", proposal, contract, delivery, client visibility, billing, stewardship, is still manual or absent.

Two things make filling that gap worth doing now:

1. **It is brand proof, not just plumbing.** A transparent client portal, a tracked stewardship phase, and an enforced delivery gate are literal expressions of our three signature promises, *"we work best when we can be honest early"*, *"projects end; responsibility doesn't"*, and *"we don't certify your organisation, we take responsibility for what we build."* Competitors can describe how they work. We could let a prospect **watch** it.
2. **For two senior people, time is the product.** At fixed-fee pricing (our model), a 5 to 10% utilisation swing moves operating margin 15 to 25% (Rocketlane). Without capacity and per-engagement margin visibility we will, sooner or later, quietly lose money on a fixed-fee build and not know which one.

## The spine all eight share: the engagement record

These are not eight apps. They are eight surfaces over **one** Postgres data model, the same way Nostos/Phylax/Hermes were specced to read a shared customer spine. Build the spine once and each tool is a view or a workflow on top of it.

```
client            (org, contacts, sector, GR/UK, relationship owner)
  └─ engagement   (phase: prospect → proposed → signed → delivering → stewardship → closed,
                   category: Brand Upgrade | Internal Rewiring | Custom Solution,
                   pricing: fixed | T&M | retainer, fee, start/end)
       ├─ proposal      (versions, scope, options, accepted_at, signature)
       ├─ deliverable   (title, owner, due, state, checklist results)
       ├─ time_entry    (engagement, who, minutes, date, billable)
       ├─ invoice       (engagement, amount, model, status, due, paid_at)
       ├─ document      (research reports, decks, contracts, handover)
       └─ steward_item  (recurring deliverable, cadence, last_done, next_due)
```

Most of this already exists in fragments: the **projects** table is a thin `engagement`; **portal_subscriptions** + the products client-auth is the portal's gate; the **presentation token-link** is the share mechanism; **Plutus' email-channel** is the send rail; **Aegis** already runs Lighthouse/accessibility scans. The build is mostly **assembling existing parts onto a shared spine**, which is why these score "easy/medium", not "greenfield".

---

## Scored shortlist

Axes 1 to 5 (5 is best). **Pain** = how much the gap costs us today · **Build** = buildability on our stack (5 = easy) · **Brand** = how much it proves the DS2 promise to a client · **Leverage** = how much it compounds (feeds other tools/data) · **Urgency** = how soon it bites.

| # | Tool | One-liner | Pain | Build | Brand | Leverage | Urgency | Seq |
|---|------|-----------|:---:|:---:|:---:|:---:|:---:|:---:|
| 4 | **Eunomia** | Delivery-checklist as an enforced gate | 4 | 5 | 5 | 3 | 3 | **1** |
| 1 | **Logos** | Lead → branded, challenge-first proposal + e-sign | 5 | 3 | 5 | 4 | 4 | **2** |
| 2 | **Agora** | Per-client portal: status, deliverables, decisions | 4 | 3 | 5 | 4 | 3 | **3** |
| 8 | **Mnemosyne** | The engagement record + pipeline (the spine, surfaced) | 4 | 4 | 3 | 5 | 3 | **2*** |
| 3 | **Kedemonia** | Stewardship / retainer console | 3 | 3 | 5 | 3 | 2 | **4** |
| 7 | **Drachma** | Our own invoicing + receivables | 4 | 3 | 2 | 3 | 3 | **5** |
| 5 | **Horai** | Capacity + time tracking | 4 | 4 | 1 | 4 | 3 | **5** |
| 6 | **Ophelos** | Per-engagement profitability | 3 | 4 | 1 | 3 | 2 | **6** |

*\*Mnemosyne is the spine; build the minimum of it alongside Logos, then thicken it as the others need it.*

---

## The specs

### 4. Eunomia, "Nothing ships until it's earned the right to."
- **Gap today:** [docs/DELIVERY-CHECKLIST.md](../DELIVERY-CHECKLIST.md) is a document people are trusted to remember. It should be a gate.
- **What it does:** Every engagement gets a live checklist instance (Lighthouse ≥90 on all four axes, keyboard a11y path, `prefers-reduced-motion`, chatbot grounding/cost if present, deploy preview URL). Items are checked off with evidence attached; the engagement cannot move to `stewardship`/`closed` until the gate passes, with a one-click founder override that is logged and reasoned.
- **Mechanism:** A `checklist_template` + per-engagement `checklist_run` in Supabase. The technical items (Lighthouse, axe) run **automatically**, reuse Aegis' scanner against the deploy URL and write the scores straight onto the run. Claude summarises a pass/fail into a one-paragraph handover note.
- **Build: easy.** **Brand: ★★★** ("we take responsibility for what we build", made literally un-skippable). **Leverage:** produces the proof Agora shows the client and the language Logos reuses in the next pitch.
- **MVP:** the checklist + manual checks + the auto Lighthouse run on a deploy URL. One week.

### 1. Logos, "The proposal that argues the way we do."
- **Gap today:** we research a lead thoroughly (Peitho), then assemble the proposal by hand, the single highest-value, least-systematised step we have.
- **What it does:** Turns a qualified engagement into a branded proposal: pulls the competitor/website research already on file, drafts scope and a *"this creates risk because… here's the alternative and the trade-off… you don't need to decide now"* narrative in our exact voice, presents two or three priced options (consulting-only / build-only / end-to-end + the Stewardship add-on), and issues it as a shareable link with lightweight acceptance (typed-name + timestamp signature, or a DocuSign hand-off for heavier contracts).
- **Mechanism:** Claude drafts from the engagement + research `document`s against a locked DS2 voice prompt (the challenge-first beats, the signature sentences). Renders through the **same token-link mechanism as Presentations**; `proposal.accepted_at` flips the engagement to `signed`.
- **Build: medium.** **Brand: ★★★** (the proposal *is* the brand). **Urgency:** every week without it is a slower, less consistent close.
- **MVP:** template + Claude draft + share link + manual countersign. Skip true e-sign at first.
- **Boundary:** Logos writes the *commercial* proposal; it is not Aegis (the free audit lead-magnet that precedes it) and not the deck builder (Presentations renders the visual story).

### 2. Agora, "Let the client watch the work."
- **Gap today:** clients get updates by email and a deck. There is no single honest place where they see status, the research, and what was decided.
- **What it does:** A per-client, branded portal showing their engagement(s): current phase and next milestone, deliverables and their state, the research reports and decks, an append-only **decisions log** (what we recommended, the trade-off, what they chose, the date), and the Eunomia gate results when delivery completes. Optionally the Stewardship view (below).
- **Mechanism:** Reuses the **products client-auth** (portal_subscriptions) for the gate and the engagement record for content. Mostly read-only; the decisions log and a comment thread are the only writes. No new auth system.
- **Build: medium.** **Brand: ★★★** (transparency stops being a value and becomes a URL). **Leverage:** the artefact a prospect sees in the Logos pitch ("this is what working with us looks like").
- **MVP:** status + deliverables + documents for one live client. Decisions log second.
- **Boundary:** this is the *engagement* portal (one client, their project). The **Products** area is the *tools* portal (the things we sell). Same shell, different content; keep them distinct.

### 8. Mnemosyne, "Remember every relationship, not just every lead."
- **Gap today:** the Funnel finds and researches *leads*; once one converts there is no relationship + stage layer threading prospect → won → delivered → steward, or holding contact history.
- **What it does:** The pipeline and relationship view over the engagement spine: every client and engagement with its phase, owner, value, last touch, and next action; a Kanban from `prospect` to `closed`; contact records and interaction history. This **is** the spine surfaced, so it is also the substrate Logos/Agora/Kedemonia/Drachma all read from.
- **Mechanism:** Promote the thin `projects` table to the full `engagement` model; add `client`, `contact`, `interaction`. A board view + a record view. Hunt/Outreach write the top of it; everything else reads it.
- **Build: medium.** **Brand: ★★** (internal, but the memory that makes us look organised and on-it). **Leverage: ★★★★★** (nothing else works well without it).
- **MVP:** the data-model migration + a pipeline board. Build it **with Logos**, just enough, then thicken on demand.

### 3. Kedemonia, "Projects end; responsibility doesn't, and now there's a console for it."
- **Gap today:** Stewardship is a named phase of our model with no operational home, the recurring-revenue motion we are most likely to under-run.
- **What it does:** Runs the monthly Stewardship phase per retained client: the recurring deliverables and their cadence (uptime/Lighthouse re-checks, content refresh, dependency + security audits, a monthly written briefing), retainer burn vs hours used, an account-health signal (last delivered, last contact, open issues), and renewal/anniversary nudges. The monthly briefing is Claude-drafted from the month's activity + the latest re-scans.
- **Mechanism:** `steward_item` recurring rows + a scheduler (the GitHub Actions cron pattern we already run) that re-runs the technical checks and assembles the briefing draft for founder sign-off, then publishes it to Agora.
- **Build: medium.** **Brand: ★★★** (our signature promise, operational). **Urgency: low** (it bites only once we have retained clients, so build it just before the first Stewardship month).
- **MVP:** recurring-deliverable tracking + the monthly auto-briefing for one retainer.

### 7. Drachma, "We chase everyone's invoices but our own."
- **Gap today:** we built Plutus to predict and chase *clients'* late invoices, but DS2's own billing and receivables are unsystematised.
- **What it does:** Issues invoices against an engagement in any of our three models (fixed milestones, T&M from Horai's hours, monthly retainer), tracks status (draft → sent → paid → overdue), and sends polite bilingual reminders. In other words, **Plutus pointed inward**, eating our own cooking.
- **Mechanism:** `invoice` rows on the engagement; reuse **Plutus' risk-ranking + the email-channel send rail** we already built. T&M invoices read Horai. Retainer invoices auto-generate each period (the Productive pattern).
- **Build: medium.** **Brand: ★★** (lower client-facing fit, but "we run our business on our own tools" is a credible pitch line). **Urgency:** rises with headcount of concurrent engagements.
- **MVP:** create + send + mark-paid + an overdue list. Reminders second.

### 5. Horai, "Know where the hours actually go."
- **Gap today:** no view of who is on what, utilisation, or whether we are over-committed, the binding constraint for a two-founder shop.
- **What it does:** Lightweight time capture against engagements (a timer or end-of-day entry, deliberately low-friction so it actually gets used), then a utilisation + capacity view: this week per person, billable vs non-billable, and a forward look at committed load vs available hours so we can see a clash *before* we say yes to the next engagement.
- **Mechanism:** `time_entry` rows; a week grid and a capacity chart. Calendar-aware (it already knows our calendar). Optionally Claude turns a freeform "spent the morning on X" into structured entries.
- **Build: medium.** **Brand: ★** (purely internal). **Leverage:** feeds Drachma (T&M billing) and Ophelos (margin), so it unlocks both.
- **MVP:** manual time entry + a utilisation bar. The capacity forecast second.

### 6. Ophelos, "Is this fixed-fee engagement actually making money?"
- **Gap today:** the dashboard shows contract value, never cost or margin. On fixed-fee work, that is the number that matters.
- **What it does:** Per engagement, hours (Horai) × an internal rate vs the fee, surfaced as live margin and burn: green while under budget, a warning as effort approaches the fee, red past it, plus a portfolio view of which categories (Brand Upgrade / Internal Rewiring / Custom Solution) and which client types actually pay. The point is not to bill more, it is to **learn our true cost** so the next Logos proposal is priced from evidence.
- **Mechanism:** a derived view over `time_entry` + `engagement.fee`; no new capture. Claude writes the one-line "why this one ran hot" note.
- **Build: medium-easy** (it is mostly arithmetic on Horai). **Brand: ★** (internal). **Urgency:** low until ≥3 concurrent fixed-fee engagements, then it bites hard.
- **MVP:** the per-engagement margin bar. Portfolio analytics second.

---

## Sequencing (and why)

1. **Eunomia** first: lowest build, highest brand payoff, and it stands alone (no spine needed). Ship the responsibility promise in a week.
2. **Logos + the minimum of Mnemosyne**: the proposal is the single biggest unsystematised value step, and building it forces the engagement spine into existence, which everything else then rides.
3. **Agora**: with the spine in place, the client-visible transparency layer, the most sellable artefact, reusing client-auth.
4. **Kedemonia**: just before the first Stewardship month.
5. **Drachma → Horai → Ophelos**: the "protect the business" cluster. Hold until we have enough concurrent fixed-fee engagements that capacity and margin start to bite; Horai must precede Drachma's T&M billing and Ophelos' margin.

Two natural bundles, mirroring how the product roadmap bundles: **win the work** (Logos → Agora, with Eunomia as the proof inside both) and **run the business** (Horai → Ophelos → Drachma over the same hours).

## Boundaries (so these don't collide with what exists)
- **Agora (engagement portal)** vs **Products (tools portal)**: same admin shell, different content. Agora = one client's project; Products = the tools we sell. Do not merge.
- **Drachma** vs **Plutus**: identical engine, opposite direction. Plutus chases *clients'* receivables (a product); Drachma chases *ours* (internal). Share the code, keep the surfaces separate.
- **Eunomia** reuses **Aegis'** scanner; it does not re-implement Lighthouse/axe.
- **Logos** ends at the signed proposal; **Presentations** renders the visual deck; **Aegis** is the free audit that precedes the proposal. Three different moments, no overlap.
- **Mnemosyne** owns the engagement record; the Funnel (Hunt/Outreach) writes the *top* of it and must not fork its own copy.

## What I'd validate before building
- **Time capture is where ops tools die.** Horai only works if entry is near-zero-friction (timer + the Claude freeform parser). If we won't log time, Drachma-T&M and Ophelos are theatre, build them fixed-fee-only first.
- **E-sign depth for Logos**: typed-name acceptance is fine for SOWs; decide if any engagement needs real DocuSign-grade signatures before over-building.
- **One spine, resisted scope creep**: the engagement model is tempting to over-design. Ship the seven tables above, add columns only when a tool needs them.

---

*Recommended first move: build **Eunomia** this week (standalone, one week, pure brand proof), then **Logos + spine** as the next real project. I can spec either to implementation depth, the way the product engines were specced, on request.*
