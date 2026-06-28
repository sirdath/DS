# DS2 tool portfolio, the council's decision

*A 24-agent deliberation: 17 diverse personas (founders, a VC, a profit-first acquirer, a CFO, real Greek + UK SMB owners, an agency operator, a behavioral economist, an AI engineer, a compliance lawyer, GR/UK market insiders, a contrarian tool-killer, a sales closer) → 3 independent quant models (balanced / fastest-cash / durability-weighted) → a 3-person adversarial red-team → a chair. Votes aggregated deterministically in code. Builds on [2026-06-15-tool-opportunities.md](2026-06-15-tool-opportunities.md) and the skeptical validation pass.*

---

## The scoreboard (avg of 17 personas, 1–10)

| Tool | Overall | Revenue | Ease | CAC→profit | Moat | Fit | best-bet | picked | **trap** |
|------|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **Plutus** | **7.1** | 6.8 | 6.0 | 7.6 | 6.6 | 7.9 | **15** | **17/17** | 0 |
| **Aegis** | **6.5** | 3.4 | 7.9 | **9.1** | 3.5 | 8.1 | 0 | 16/17 | 0 |
| **Phylax** | 6.1 | 6.2 | 4.4 | 6.9 | 5.4 | 7.2 | 1 | 7/17 | 0 |
| **Pythia** | 6.1 | 5.2 | 5.8 | 7.9 | 3.8 | 6.6 | 0 | 6/17 | 0 |
| **Kerdos** | 5.9 | 5.6 | 5.4 | 6.6 | 5.6 | 6.8 | 1 | 6/17 | 0 |
| **Hermes** | 5.0 | 6.8 | 3.8 | 4.8 | 4.6 | 5.4 | 0 | 0 | 1 |
| **Themis** | 4.1 | 5.1 | 2.6 | 5.5 | 3.8 | 5.1 | 0 | 0 | 5 |
| **Nostos** | 3.1 | 3.2 | 4.1 | 4.7 | 2.1 | 4.0 | 0 | 0 | **10** |
| **Tamias** | 3.0 | 3.3 | 3.9 | 4.8 | 2.2 | 4.0 | 0 | 0 | 1 |

- **Portfolio stance: 17/17 personas independently said `build_few`**, zero said all, one, or none.
- **Quant models** (all three): `build_few`, Plutus #1 on every model (8.8 / 7.23 / 7.08); recommended sets `[Aegis,Plutus,Phylax]`, `[Plutus,Aegis]`, `[Plutus,Aegis]`.
- **Red-team:** two of three downgraded to **`build_one`** on capacity grounds, survivors `[Plutus]`, `[Plutus,Aegis]`.
- **Plutus took zero trap votes and 15/17 best-bet votes. Nostos took 10/17 trap votes.**

---

## 1. The portfolio call, **build few; realistically, build ONE, then a SECOND**

The vote is near-unanimous: every seat, from the indie hacker to the GDPR lawyer to the Athens taverna owner, landed on "two or three, not nine." The red-team pushed harder and was right to: two founders already maintaining four live tools have ~24 person-days/month for new work. *"Build few" read as a simultaneous plan is a trap, it means building two things at 60% and being known for neither.*

So the honest synthesis is **sequenced, not parallel**: build **one product properly (Plutus)**, ship **one near-free lead-magnet alongside it (Aegis)**, then earn the right to a second product (Phylax) once the first runs without daily founder attention. One new *product* in flight at a time.

---

## 2. The ranked verdict

### 🥇 Plutus, **PRODUCT (managed-service-first). Build first.**
AR agent: predicts which invoices pay late, ranks the chase list by risk × value, drafts bilingual escalating reminders, **you approve every send.**
- **The number:** 15/17 best-bet, unanimous 17/17 pick, top quant score on every model. Payback **2.5–9 months**; ~**€1.2M ARR** ceiling.
- **Why it wins:** the only candidate clean on *all four* DS2 filters, a structurally broken problem (52% of Greek B2B invoices overdue), a moat incumbents can't copy without hurting their own generic positioning (Xero/QuickBooks send dumb date-based blasts; Chaser is £199/mo, English-only), **clean GDPR** (you chase your own customers over your own invoices), and **zero Xenia overlap.**
- **The caveat that kills the naive version:** the moat is **not the prediction model** (at 40–100 invoices/yr it barely beats "Monday + prior-late flag"), it's the **bilingual tone + the human-in-the-loop approval screen**, which is also the liability shield (one wrong automated chase to a VIP = churn). Ship aging-bucket rules first; add prediction once ~20 clients' payment history pools.

### 🥈 Aegis, **LEAD-MAGNET / INTERNAL TOOLING. Never a price page. Ship first (nearly free).**
Website speed + WCAG/EU-Accessibility-Act + conversion audit (Lighthouse + axe-core + Pa11y + Claude narration).
- **The number:** highest CAC-to-profit (9.1) and ease (7.9) in the slate, 16/17 picks. Build ≈ one sprint. Direct ARR ≈ 0, *that's the point.*
- **What it is:** the challenge-first opener the brand already promises. Run it on every prospect *before* the first call, "your site has N WCAG failures and €X exposure." EAA is live; Greek fines reach €100k; new builds must comply at launch.
- **Caveat:** the scan is commoditised (PageSpeed/WAVE are free). **Charge for the fix, never the scan.** It's a funnel and a prep tool, not a product line.

### 🥉 Phylax, **PRODUCT (managed service), PHASE 2. Defer until Plutus is live.**
No-show defence: prediction + bilingual Viber/WhatsApp reminders + deposit prompts + waitlist refill.
- **The number:** fit 7.2 with the existing clinic/salon/gym base; genuine Viber moat; payback **9–13 months.**
- **Two walls, both real:** (a) the *refill* feature needs booking-system **WRITE access** (Fresha/Dentally/Booksy are read-only or partner-gated), without it Phylax is just a reminder layer Fresha gives away free; (b) **cold-start**, one clinic can't out-predict a naive heuristic; you need pooled cross-client data + GDPR DPAs you don't have yet. Plutus builds that trust + pooled-data foundation first. Build Phylax as **Xenia's retention layer**, not standalone.

### The rest, none are net-new product builds

| Tool | Verdict | What it actually is |
|---|---|---|
| **Kerdos** | DEFER | **Brand-Upgrade module**, not SaaS. €1.5–3k + €79–149/mo, Greece-first, reuses Xenia + Panoptes; IRIS hook is real. Revisit when a Greek F&B client asks by name. |
| **Pythia** | SELL, DON'T BUILD | **Fixed-fee audit sprint** (€1.2–2.5k) → Stewardship; bundle into Aegis. Monitoring is the fastest-commoditising category of 2026; the metric is non-deterministic (you can't SLA a ChatGPT rank); schema injection debunked (Ahrefs, May '26). |
| **Hermes** | DEPRIORITISE | GoHighLevel (£97/mo) bundles it; WhatsApp outbound is a quality-rating minefield; Xenia-overlap taxes every sales call. Revisit only as a Xenia outbound extension. |
| **Themis** | SERVICE ONLY | **Fixed-fee integration engagement** (€2.5–6k) on an accredited provider + Stewardship. **Integrate, never transmit, never seek accreditation** (AADE A.1112/2025 is a liability gate; the 1 Oct 2026 deadline crests before you could ship + channel-sell). |
| **Tamias** | FOLD-IN | Into Themis/Stewardship as a briefing deliverable. Fluidly died at 500k connected businesses. Never standalone. |
| **Nostos** | **KILL** | **Biggest trap (10/17).** Free in Fresha "Win back," Klaviyo, Phorest; Marsello clones it at $60/mo; GDPR wipes most of the list. Survives only as a data-cleaning *attach* to Phylax. Formally close it. |

---

## 3. The math, why Plutus is mathematically best

**Revenue × probability ÷ effort:**
- *Revenue:* ~€1.2M ARR ceiling, modest, but for two people it funds everything else.
- *Probability:* highest in the slate. **CAC ≈ 0**, sell into the existing book (*"want us to turn this on for the invoices you sent last month?"*), no cold sales engine (the only CAC path that works for two people). Clean GDPR removes the legal failure mode that kills Nostos/Hermes. No channel-approval gate on the critical path (unlike Phylax's Viber API or Themis's AADE accreditation).
- *Effort:* the smallest serious build, ~5 founder-weeks. A Claude-drafted, human-approved chase sequence on a Xero/ERP webhook; no ML at launch.
- *Payback:* **~2.5 months** under conservative assumptions (8 managed clients at €300–500/mo).

The comparison that settles it: Aegis pays back faster but ceilings near €0 standalone (it's infrastructure). Phylax has a real moat but a 9–13mo payback gated on data you don't have yet. Hermes has 3–4× the market but **negative EV** once you price the incumbent + hostile channel + the distraction. Plutus is the only one where revenue, probability, and effort all point the same way.

---

## 4. Sequence & GTM

- **Weeks 1–4, Aegis (the door).** One sprint. Open-source scanners + a Claude report template. Don't price it. Run it on every prospect and existing client before any other conversation. Your CAC weapon for everything downstream.
- **Weeks 5–16, Plutus (the product).** Sell as a managed service to **3–5 existing clients this quarter**, those with 20+ open invoices feeling it weekly. Ten-word pitch: *"52% of Greek B2B invoices are overdue, we predict which, rank the chase, and draft it for your one-click approval."* Price **€400–900/mo** managed. No self-serve dashboard, no pricing page yet, nail the approval-screen UX, get one case study, *then* consider productising.
- **Defer (H2 2026, conditional):** Phylax as Xenia's retention layer once Plutus is ~15 clients and the pooled-data + DPA foundation exists. Kerdos as a Brand-Upgrade module on demand. Pythia bundled into Aegis as a paid fix sprint.
- **Sell opportunistically as services, never build:** Themis (one integration engagement/quarter, liability carved to the accredited transmitter); Tamias (a paragraph in the Stewardship email).
- **Kill now, formally:** Nostos. Close Hermes/Themis/Tamias as *product* ideas so they stop bleeding calendar.

---

## 5. Dissents, and what would flip the call

- **AI-engineer: Phylax over Plutus.** Phylax's prediction + Viber combo is the one thing free tools genuinely can't replicate, and its data moat compounds where Plutus's is thin. **Overruled on sequencing, not merit**, Phylax's two walls (booking write-access, cold-start) need the trust + pooled data Plutus builds first. Same destination, correct order.
- **Red-team: `build_one`.** Drop Aegis from the "build" count, it's a one-sprint funnel script, not a co-built product. **Partly conceded:** read the call as **one product (Plutus) + one funnel asset (Aegis)**.
- **What flips the whole decision:**
  - If Argus/Fama/Panoptes/Xenia **aren't yet throwing off reliable Stewardship retainer income** → the contrarian's `build_none` becomes correct: run a Stewardship land-and-expand sprint instead. *Be honest about this before starting Plutus.*
  - If a **large clinic group** offers booking-system access + data → Phylax jumps the queue.
  - If you **can't get accounting-system OAuth** from even warm clients → Plutus degrades to a manual outcome-priced service (≈5% of accelerated receivables), still viable, software thesis weaker.

---

## 6. The honest close

The slate looked like nine products. It was really **one product, one funnel, and a shelf of service engagements wearing SaaS costumes**, and the moat was never the code. It's the client relationships, the bilingual delivery, and the fact that DS2 will actually do the compliance and setup work the client won't. That's not a venture-scale SaaS portfolio. It's a real, defensible, profitable business for two senior people, which is the honest thing to build.

**One line to walk away with: Aegis opens the door, Plutus walks through it. Everything else waits.**

*(Decision pause, on brand: you don't need to decide now. If the existing four aren't yet paying their own way, the more honest first move may be a `build-none` Stewardship sprint, happy to go either way.)*
