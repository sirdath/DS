# DS2 — Tool opportunities: business problems → buildable products

*Research date: 2026-06-15. Method: five parallel evidence-based research streams (revenue/demand, operations/cost, customer comms & retention, data/decisions/compliance, digital presence/growth), each filtered through DS2's profile and required to carry confidence scores + sources — matching our own research discipline. This document deduplicates ~30 candidate concepts into a scored, sequenced roadmap that **complements** the existing four tools (Argus, Fama, Panoptes, Xenia) rather than duplicating them.*

---

## TL;DR — the shortlist

The biggest unguarded money-leaks for our clients aren't *acquisition* (Argus/Panoptes already play there) — they're in **capture, defence, and retention** of demand the business already has, plus **back-office money flows** and two hard **regulatory deadlines** in 2026.

**Build first (Tier 1 — highest ROI clarity, strong willingness-to-pay, clean fit):**
1. **Phylax** — no-show defence + waitlist auto-refill (clinics, salons, gyms)
2. **Nostos** — lapsed-customer win-back (everyone with a customer list) — *best "land" wedge*
3. **Hermes** — instant lead reply + multi-week follow-up agent (trades, clinics, services)

**Strong next (Tier 2 — back-office white space + regulatory tailwinds):**
4. **Plutus** — late-payment prediction + automated bilingual chasing
5. **Themis** — Greek myDATA e-invoicing compliance + cash intelligence *(hard Oct 2026 deadline, tax incentive funds it)*
6. **Tamias** — 13-week cash-flow forecast + plain-language weekly briefing

**High-novelty bets (Tier 3 — bigger builds, land-grab timing):**
7. **Pythia** — AI-search + Local-Pack discovery (get cited by ChatGPT/AI Overviews; remediation, not monitoring)
8. **Kerdos** — commission-free direct ordering/booking + demand-gen *(escape the efood/Wolt 30% tax)*

**Recommended first prototype: Phylax or Nostos** — both are medium-or-lower build on our stack, have a one-number ROI story, and open the door to the rest.

Two strategic moats run through everything: **bilingual Greek+English with Viber-first delivery** (US incumbents like Podium/Birdeye don't serve it, and it's the channel Greeks actually read), and **local presence on the 2026 regulatory deadlines**.

---

## How to read this

Each opportunity is scored 1–5 on six axes (synthesised from the research; my judgement where evidence was thin):

- **ROI** — how hard/legible the money story is
- **Reach** — how prevalent the pain is across our verticals
- **Fit** — match to DS2's stack (Next.js · Supabase/Postgres · Claude agents) + bilingual/local edge
- **Build** — buildability of a credible MVP (**5 = easy**, 1 = hard)
- **Edge** — differentiation vs incumbents *and* vs our existing four tools
- **WTP** — willingness-to-pay / does a budget already exist (regulation, incumbents charging)

Verticals throughout: hospitality (hotels, tavernas, cafes), clinics (dental/medical/aesthetic), retail/e-commerce, gyms/studios, professional services & trades — Greece + UK.

---

## The problem landscape (deduplicated, evidence-backed)

> Confidence in brackets is the median across the streams that surfaced it. Full sources in the appendix.

**A. Demand is captured slowly or not at all.** Average lead response is ~47 hours; 63% of leads never get a reply; replying in <5 min lifts conversion up to 100×, and 78% of buyers pick whoever responds first. UK trades lose ~£8k/yr to quotes never sent. SMBs miss ~62% of inbound calls and 85% of unanswered callers don't call back. *(0.88)*

**B. Booked revenue evaporates to no-shows.** Dental no-show 15–20% → average practice loses **$105k–$240k/yr**; salons up to ~$67k/yr; UK restaurant no-shows cited at £17.6bn/yr sector-wide. 37% of no-shows simply *forgot* — highly preventable. Targeted SMS/Viber reminders cut no-shows to ~5%; deposits lift kept appointments +32%. *(0.91)*

**C. The owned customer base is never reactivated.** Reactivation costs 5–25× less than acquisition; a repeat customer is 60–70% likely to buy vs 5–20% for a prospect; automated win-back is ~2% of email volume but drives 30–37% of email revenue. Almost no SMB does it systematically. *(0.83)*

**D. Members/customers churn predictably and silently.** Gyms ~40% annual churn, half quit within 6 months, 67% of memberships go unused; a 2-week attendance gap moves cancel probability 8%→48%; combining signals predicts churn at ~87% accuracy. +5% retention = +25–95% profit. *(0.84)*

**E. Money-in is slow; chasing it burns the owner's time.** 87% of firms report late payments; average SME owed ~£17.5k–£22k, ~42 days past due; owners spend 4+ hrs/week chasing (~£5,200/yr). ~14k UK firms close yearly from late payment. *(0.85)*

**F. Two hard 2026 compliance deadlines with budgets attached.** Greek **myDATA** B2B e-invoicing: large firms 2 Mar 2026, **all businesses 1 Oct 2026** — with 100% depreciation + 100% expense-deduction incentives for early adopters. UK **MTD for Income Tax**: sole traders >£50k from **6 Apr 2026**, quarterly digital filing. EU **Accessibility Act** live since 28 Jun 2025 (Greek fines up to €100k). Non-discretionary spend, time-boxed. *(0.90)*

**G. Data-rich, insight-poor.** 61% of SMEs have no real-time cash view; SMBs lose ~17 hrs/month to manual reporting and >9 hrs/week moving data between systems that don't talk; 33% of UK owners still on spreadsheets. *(0.85)*

**H. Operational waste & mis-staffing.** Restaurants throw away 4–10% of food inventory and over/under-staff against unforecast demand; AI forecasting cuts waste 30–40% and labour 10–15%. Acute under Greek seasonality. *(0.82)*

**I. Invisible online — classic *and* AI search.** 93% of local queries trigger the Local Pack (61% of clicks) yet only ~35% of SMBs have a complete Google Business Profile; AI Overviews now appear on ~42–52% of queries and cut organic clicks ~38%, while consumers using AI for local recommendations jumped 6%→45% in a year — and 83% of restaurants are "invisible" in AI answers. *(0.84)*

**J. The aggregator commission tax.** Delivery platforms take 15–35% (efood/Wolt ~27% + VAT ≈ 30% all-in in Greece); yet 65% of UK diners would book direct. Commission-free rails exist but require demand-gen the SMB lacks. *(0.85)*

**K. Marketing capacity ≈ zero.** 56% of SMBs have ≤1 hr/day for all marketing; ~47% don't run email (which returns $36–42 per $1); AI content output is generic, off-brand, English-centric. *(0.80)*

---

## The roadmap (scored)

| # | Tool | One-liner | ROI | Reach | Fit | Build | Edge | WTP | Tier |
|---|------|-----------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | **Phylax** | Defend the calendar from no-shows; auto-refill cancellations | 5 | 5 | 5 | 4 | 4 | 5 | **1** |
| 2 | **Nostos** | Win back dormant customers automatically | 4 | 5 | 5 | 5 | 4 | 4 | **1** |
| 3 | **Hermes** | Reply to every lead in seconds, nurture for weeks | 5 | 5 | 4 | 3 | 4 | 5 | **1** |
| 4 | **Plutus** | Predict late invoices, chase them for you (GR/EN) | 5 | 4 | 5 | 4 | 4 | 4 | **2** |
| 5 | **Themis** | myDATA e-invoicing compliance + cash intelligence | 5 | 5 | 4 | 2 | 4 | 5 | **2** |
| 6 | **Tamias** | 13-week cash-flow forecast + weekly "what to do" briefing | 4 | 5 | 5 | 3 | 3 | 4 | **2** |
| 7 | **Pythia** | Get found by ChatGPT/AI Overviews + win the Local Pack | 4 | 5 | 4 | 3 | 5 | 4 | **3** |
| 8 | **Kerdos** | Commission-free direct ordering/booking + demand-gen | 5 | 4 | 4 | 3 | 5 | 5 | **3** |
| 9 | **Iris** | Always-on bilingual content + email engine | 4 | 5 | 5 | 4 | 3 | 4 | 3 |
| 10 | **Aegis** | Speed + accessibility + conversion audit (lead-gen) | 3 | 5 | 5 | 5 | 3 | 3 | LG |
| 11 | **Oikos** | Demand-aware staff scheduling | 4 | 4 | 4 | 2 | 3 | 4 | 4 |
| 12 | **Trofi** | Order the right amount, bin less (UK waste-law tailwind) | 4 | 4 | 4 | 3 | 3 | 3 | 4 |

*"LG" = best deployed as a lead-generation/qualifier, not a subscription product.*

---

## Tier 1 — build first

### 1. Phylax — "Defend your calendar from no-shows."
- **Who buys:** Dental/medical clinics (sharpest ROI), salons/med-spas, gyms, tavernas/restaurants.
- **What it does:** Scores every upcoming booking for no-show risk; sends smart, escalating **bilingual reminders on the channel each customer reads (Viber-first in GR, WhatsApp/SMS in UK)**; prompts a deposit/confirm for high-risk ones; and when a slot cancels, auto-offers it to a waitlist and rebooks conversationally.
- **Mechanism:** A light risk model over booking history (prior no-shows, lead time, channel, day-part, season) + Claude to generate the right nudge and negotiate the rebooking; Supabase for booking + waitlist state.
- **Build:** Medium. **WTP:** Very high — a clinic losing $105k+/yr pays €100–300/mo to recover a slice; easiest ROI story we have.
- **Complements:** Xenia *takes* the booking; Phylax *protects* it and recovers lost slots. No overlap with Argus/Fama/Panoptes. *(Ship as standalone, or as Xenia's "revenue-recovery" module — see build-vs-extend.)*

### 2. Nostos — "Wake up your dormant customers." *(best wedge)*
- **Who buys:** Clinics (recall-due), salons, gyms (lapsed members), retail/e-commerce, restaurants with a list.
- **What it does:** Mines the customer DB, builds RFM segments, finds high-value lapsers ("monthly client, silent 90 days"), and auto-drafts/sends personalised **Greek/English** win-back offers — a real offer to high-value lapsers, a light nudge to the rest. Tracks revenue recovered.
- **Mechanism:** RFM segmentation in Postgres + Claude for per-customer copy/offer/channel; email/WhatsApp/Viber send.
- **Build:** Low–Medium (fastest to ship). **WTP:** Medium–High; provable on a **free first campaign** — the ideal land product that opens the cross-sell to Phylax/Hermes.
- **Complements:** Fama works *public reviews*; Nostos works the *owned database*. Distinct.

### 3. Hermes — "Never let a lead or quote go cold."
- **Who buys:** Trades, clinics, gyms, professional services, hospitality enquiries — any business where the owner *is* the salesperson and is physically busy.
- **What it does:** Captures leads from web forms / WhatsApp / missed calls / email, replies in seconds, qualifies, and runs a timed multi-touch nurture across the 2–6 week buying window — surfacing hot leads to the owner.
- **Mechanism:** Claude tool-use agent over a Supabase lead store (classify intent/urgency, draft contextual replies, decide next-touch timing); reuses Xenia's channel plumbing.
- **Build:** Medium. **WTP:** High (£8k/yr lost to un-sent quotes; <5-min reply = up to 100× conversion).
- **Complements:** Xenia handles inbound *booking/reception*; Hermes is *outbound persistence + qualification + nurture*. Adjacent, not duplicate.

---

## Tier 2 — back-office white space + regulatory tailwinds

All four existing tools are front-of-house. This tier opens a clean, defensible **money-flow / compliance** front — pure "Internal Rewiring."

### 4. Plutus — "Your invoices, paid faster, chased for you."
Predicts which invoices will go late from the client's own payment history, ranks a daily chase list by risk × value × relationship, and drafts **bilingual** reminders in the owner's tone with polite escalation. **Buys:** B2B services, agencies, trades, wholesalers, clinics billing insurers. **Build:** Low–Med. **WTP:** Strong (4+ hrs/week + ~£17.5k avg owed). Must price under enterprise AR tools (Chaser/Satago). **Pairs with** Themis/Tamias to form a money-flow suite.

### 5. Themis — "Compliant by the deadline, and finally able to read your own numbers."
Connects common Greek POS/accounting to **myDATA**, validates + transmits B2B invoices to AADE, reconciles against the books, and turns the cleared stream into a live VAT + cash-flow dashboard with a Claude-written monthly summary. **Buys:** every Greek B2B SMB — *forced* by the 1 Oct 2026 mandate, with the 100% depreciation incentive providing the budget. **Build:** High (AADE integration + compliance correctness). **WTP:** Strong + time-boxed + non-discretionary. **Moat:** our Greece presence + bilingual hand-holding; incumbents (EDICOM/Epsilon/SoftOne) target mid-market, AADE's free tools don't reconcile or advise. *(UK analogue: an **MTD**-flavoured advisory layer on top of the ledger — never another ledger.)*

### 6. Tamias — "A cash-flow forecast built from your own history."
A 13-week forecast from POS/bank/booking history with a plain-language weekly briefing ("tight in week 3 — chase invoice #112, defer the supplier order"). **Build:** Medium (Prophet/light ML + Claude narration). **WTP:** Med–High — directly addresses the #1 cited failure cause; 61% have no real-time view today. **Pairs with** Plutus (receivables timing) + Themis (the ledger).

---

## Tier 3 — high-novelty / growth bets

### 7. Pythia — "Be the answer when someone asks the oracle."
Audits visibility across the **Google Local Pack and generative engines** (ChatGPT, Google AI Overviews/AI Mode, Perplexity, Gemini) on the client's money terms ("best physio in Glyfada"), then *drives the fixes*: schema/structured-data injection, GBP completeness + post/photo hygiene, NAP consistency across GR/UK directories, and citable-content rewrites. **Remediation, not monitoring** — the whole incumbent market (Profound/Peec/Otterly) is monitoring-only, enterprise-priced, English, B2B-brand-focused. **Build:** Med–High (multi-engine querying/parsing is fiddly). **Edge:** highest novelty, lowest competition; early-mover land-grab. **Caveat:** AI-referral *volume* is still small today — pitch as positioning ahead of the curve. **Boundary:** stops at *discovery*; once a customer forms an opinion, that's **Fama's** turf (keep review usage read-only as a citability signal).

### 8. Kerdos — "Your own front door — commission-free."
A direct ordering/reservation/appointment rail on the client's own domain with deposits + reminders, plus a **demand-gen layer that pulls repeat customers off the aggregators** back to direct. **Buys:** independent restaurants/takeaways (escape ~30% efood/Wolt all-in), clinics/salons/gyms (deposits kill no-shows), small retail (checkout + abandoned-cart recovery). **Build:** Medium (this is more a "Brand Upgrade" build than a thin tool). **WTP:** Very high, pure money math; the Greek efood/Wolt duopoly with no localised commission-free alternative is open white space. **Pairs with** Xenia (Xenia books *into* Kerdos) and Phylax (deposits + reminders).

---

## Tier 4 / supporting (validate or build to pull)

- **Iris** — always-on **bilingual** content + email engine tied to the business's actual offers/seasonality (not blank-canvas prompts); per-client brand-voice locked from their existing copy. Low–Med build; bilingual Greek/English is the moat vs Jasper/Canva. Produces the citable content **Pythia** optimises.
- **Aegis** — speed (Core Web Vitals) + **WCAG/EAA accessibility** + conversion audit. Low build on open-source scanners + Claude. **Best as our challenge-first lead magnet** ("here's what's bleeding revenue") that feeds every other engagement — and the EAA (€100k Greek fines, new-builds must comply at launch) gives the accessibility half real urgency. Embodies the brand line: *real remediation, not an overlay widget*.
- **Oikos** — demand-aware staff scheduling (labour is the #1 cost line; 65% of operators rank staffing their top challenge). Med–High build (forecasting + constraint solving + GR/UK labour rules). Natural bundle: **Xenia books, Oikos staffs against the bookings.**
- **Trofi** — kitchen/stock waste + ordering assistant; UK mandatory food-waste separation (in force Mar 2025) is a regulatory tailwind. Med build.
- **Operational demand forecasting** — next-week covers/stock/shifts. **Flag:** keep explicitly distinct from **Panoptes** (site-selection = geographic/pre-opening; this = operational/existing-site). Can ship as a skin on Tamias/Trofi infra.
- **Churn-prediction brain** — membership churn scoring (gyms/clinics). Overlaps **Nostos** (pre-emptive vs post-lapse) — **merge** rather than ship separately.
- **Self-populating CRM** ("Anamnesis") — a customer-data layer assembled from Viber/WhatsApp/IG threads + POS. High build; weak standalone WTP but strong **strategic substrate + lock-in** — the spine Nostos/Phylax/Hermes read from. Build *as* those tools need it.
- **Unified omnichannel inbox** — one bilingual inbox for Viber/WhatsApp/IG/SMS/email. Strong GR pain, but **closest to Xenia** → ship as a **Xenia extension** (human-in-loop console), not a separate product.
- **KPI dashboard spine** ("Oikonomos") — horizontal operational dashboard that could *host* Argus/Fama/Panoptes as panels. Med–High; scope-creep risk — keep to operational KPIs, leave geo to Panoptes.
- **Paid-ads audit + attribution** ("Argyros") — recover 20–40% wasted spend + server-side tracking. Med build, narrower audience (only ad-spending SMBs).
- **Pricing/yield advisor** ("Kairos") — recommend (never auto-apply) price/day-part/seasonal moves; could *consume* Argus competitor signals. **Validate appetite first** — SMB dynamic-pricing backlash risk.
- **GDPR/AI-Act register** — RoPA/DPIA/AI-use register generator. Low conviction standalone; **attach-on to a delivery engagement**, never sold as certification (brand line: *"we don't certify your organisation"*).

---

## Build-vs-extend decisions (avoid cannibalising the four)

- **Review solicitation / private service-recovery** → **extend Fama**, do not ship a 5th review tool. Clean split: Fama *monitors public reviews + drafts replies*; the new capability *generates* reviews and *intercepts detractors privately before they post*. If sold separately they must never both "ask for reviews."
- **No-show module** → Phylax can ship standalone *or* as a Xenia premium module. Recommendation: **standalone Phylax** (distinct buyer value: a clinic without Xenia still wants no-show defence), but share Xenia's channel plumbing.
- **Omnichannel inbox** → **Xenia extension**, not a new product (too close to Xenia's conversational core).
- **Operational demand forecast** → keep positioning explicitly off **Panoptes** (operational vs site-selection).
- **Kairos pricing** → wire to *consume* Argus competitor-price signals rather than re-derive them.

---

## Cross-cutting strategy

1. **Two moats, used everywhere:** (a) **bilingual Greek+English, Viber-first delivery** — US incumbents (Podium/Birdeye at $300–600/mo) don't serve it and it's the channel Greeks read; (b) **local presence on the 2026 deadlines** (myDATA, MTD, EAA) — non-discretionary budgets, time-boxed urgency.
2. **Land-and-expand:** lead with a low-friction, provable wedge (**Nostos** free-first-campaign, or **Aegis** audit as the challenge-first lead magnet), then expand into Phylax/Hermes/Plutus on the same account and data.
3. **Natural bundles:** *money-in + money-out* (Plutus + Themis + Tamias); *book → defend → staff* (Xenia → Phylax → Oikos); *get found → convert* (Pythia → Kerdos, with Iris feeding content).
4. **GTM filter (matches buyer-readiness evidence):** SMBs cite cost, skills-gap and ROI-uncertainty as the top AI barriers but will pay ~10% more for AI *embedded* in tools they already use. **Lead every pitch with the recovered-revenue number, not the technology** — DS2's done-for-you, outcome-priced, embedded model is exactly right; don't sell raw AI capability.
5. **On-brand:** these are "Internal Rewiring" automation/data products; each should ship with the challenge-first framing ("here's where you're bleeding money, here's the trade-off, you decide") and "built to hold up under stress" assurance.

---

## Risks & what to validate before a client deck

- **Greek SMB primary data is thin** — the "no localised commission-free alternative" (Kerdos) and bilingual-localisation (Iris) claims are reasoned from gaps; do **one round of Greek primary research** (talk to 5–8 owners) before committing build budget.
- **AI-referral volume is still <1% of traffic** — Pythia is an early-mover positioning play, not today's traffic firehose; price/pitch accordingly.
- **Dynamic-pricing backlash** — validate Kairos appetite before building.
- **Compliance correctness is liability-sensitive** — Themis must be genuinely correct against AADE; partner or budget for proper testing ("we take responsibility for what we build").
- **Integration breadth is a bottomless build** — anything depending on connectors (Themis, CRM spine, KPI dashboard) needs a *tight* starter set of supported systems, not "everything."

---

## Recommended next steps

1. **Pick one Tier-1 to prototype** — recommend **Phylax** (sharpest ROI) or **Nostos** (fastest to ship, best wedge). Build the engine package the way Fama/Xenia were built (typed core + sample data + demoable without a live client), then a workspace surface.
2. **Validate the two regulatory wedges** (Themis/myDATA, MTD advisory) with 2–3 real Greek/UK clients — the deadlines create urgency *now*.
3. **Ship Aegis as a lead magnet** regardless — it's low build, it's our challenge-first voice in a tool, and it feeds every other engagement.
4. **Decide the Fama/Xenia extensions** (review-solicitation into Fama; omnichannel inbox into Xenia) so they don't get re-pitched as new products.

---

## Appendix — key sources by problem

- **Lead speed / missed calls:** verse.ai/blog/speed-to-lead-statistics · getaira.io/blog/missed-business-calls-statistics · pat.org.uk (tradesmen lose jobs)
- **No-shows:** arini.ai/blog/dental-practice-no-show-rate · curogram.com/blog/average-patient-no-show-rate · vocalyai.com (salon no-shows) · dialoghealth.com/post/patient-no-show-statistics
- **Retention / win-back:** emarsys.com (win back lost customers) · clevertap.com/blog/win-back-campaign · smallbiztrends.com (5% retention) · glofox.com/blog/gym-membership-statistics · smarthealthclubs.com (100 retention stats)
- **Late payments / AR:** startups.co.uk/news/late-payment-crisis · smallbusinesscommissioner.gov.uk · monite.com (AP/AR for SMBs) · resolvepay.com (cost-per-invoice)
- **myDATA / MTD / EAA:** edicomgroup.com/blog/greece-mandatory-electronic-invoice · marosavat.com (Greece B2B e-invoicing) · sage.com / xero.com (MTD income tax) · fsb.org.uk (MTD 2026) · sgklegal.gr (EAA fines) · webaim.org/projects/million
- **Cash flow / reporting:** relayfi.com (state of SMB cash flow) · pymnts.com (bankruptcies 15-yr high) · toomanyhats.net (17 hrs/month) · camelai.tech (SMB ops report 2025)
- **Demand / waste / scheduling:** toasttab.com (forecasting) · supy.io (2026 forecasting guide) · synergysuite.com · growyze.com / restroworks.com (UK food waste) · 7shifts via lavu.com · rotacloud.com (labour %)
- **AI search / local SEO:** searchenginejournal.com (AIO field study) · brightlocal.com (local SEO + consumer survey) · webfx.com (GBP benchmarks)
- **Aggregator commission:** pos.toasttab.com (delivery fees) · opentable.co.uk (how diners book)
- **Web speed / accessibility / ads:** cloudflare.com (performance/conversion) · baymard.com (cart abandonment) · groas.com / wordstream.com (ad waste) · gov.uk UK Business Data Survey 2024
- **Buyer readiness:** salesforce.com (CRM for small business) · signeasy.com (SMB CRM) · constantcontact.com (small business 2024) · demandsage.com (email stats)

*Confidence is highest on regulatory items (0.90) and no-shows (0.91); softest on system-integration sizing (0.75), AI-Act standalone thesis (0.70), and dynamic-pricing appetite (0.72).*
