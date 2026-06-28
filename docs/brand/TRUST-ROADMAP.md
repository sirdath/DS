# DS2 Trust Roadmap, a full plan to make people trust us more

*Drafted 2026-05-24. Companion to [TRUST-UI-PLAYBOOK.md](TRUST-UI-PLAYBOOK.md) (the research), this is the action plan.*

## The thesis (what actually moves trust)

From the research: visitors judge us in **~50ms** on looks, then **earn-or-lose** trust as they read.
Design quality gets us in the door; **proof keeps us there**. We already win the 50ms test (premium,
calm, restrained). Where we're thin is exactly where comparable firms are strong: **named clients,
quantified outcomes, visible people, and clear process/price.** This plan closes that gap in order of
impact-per-effort.

## Competitor benchmark (who we're compared to)

Looked at the tier we'd sit in, boutique product/AI studios and consultancies:

| Firm | Palette | People shown? | Trust engine |
| --- | --- | --- | --- |
| **Lazarev** | Dark + vibrant accent | **Founder-led** ("challenges assumptions") | Metrics-first ($500M+ raised, 120+ awards), named logos (Shopify, Boeing, HP), **per-case $ outcomes**, titled testimonials |
| **ustwo** | **Light / minimal** | No, deliberately faceless "institution" | Enterprise logo wall (Google, DeepMind, HSBC), "9.5/10" score, B-Corp, methodology |
| **Scandiweb** | Light | Process-led | Named framework ("P.A.T.H."), "live in 6–12 weeks", "30+ companies, 15+ industries" |

**What every one of them does that we don't yet:** lead with **quantified proof + named clients**, give the
method a **name/shape**, and frame case studies as **outcomes** ("$40M growth"), not tasks.

**What this tells DS2 specifically:**
- Palette is **not** the differentiator, dark-accent (Lazarev) and light-minimal (ustwo) both read as premium. Pick on fit + contrast, not fashion. (Decision process in Phase 2.)
- Motion is **minimal** across the top tier → our restraint is right; keep one signature beat (the wordmark draw-in), nothing looping.
- We are **founder-led by design** ("you talk to one of the two"). That's the **Lazarev route, not ustwo's faceless one** → showing the founders (photos, philosophy) is on-strategy, not vanity.

## Where DS2 stands today (gap analysis)

✅ Strong: visual polish, calm premium hero, distinctive challenge-first voice, clear services, working contact.
⚠️ Thin: no named clients, no metrics, no quantified case outcomes, founder photos are placeholders, no
stated process/price, no testimonials, limited "presence on the web," no objection-handling (cost/risk).

---

## The plan, phased by impact-per-effort

### Phase 0, Polish & remove trust leaks  *(me, this week, no inputs needed)*
Small things that quietly cost credibility.
- **Motion audit** vs the playbook §6, keep the draw-in + subtle reveals; verify every motion gates on `prefers-reduced-motion`; kill anything looping/competing.
- **Contrast / AA pass**, guarantee 4.5:1 body text (critical if we go light/pastel).
- **No placeholder/empty states visible**, the "this person, this city" founder treatment (done) removes the empty-portrait look; sweep for any other "coming soon".
- **Tighten copy to specifics**, replace soft adjectives with concrete nouns/numbers wherever we already can.

### Phase 1, Proof  *(highest trust gain; needs founder inputs)*
This is the big one. Each item maps to a trust signal.
1. **Founder photos** (transparency + our founder-led play). Real dark-bg/cut-out portraits → double-exposed with their city. *Need: 2 photos.*
2. **One named, quantified case study** (social proof). Pick the client we can name + 2–3 real numbers/outcomes; reframe the portfolio card as an outcome ("X → Y result"). *Need: client + permission + numbers.*
3. **Client logos / "worked with"** strip if any are nameable (authority). *Need: which names are allowed.*
4. **"How we engage" + price clarity** (up-front disclosure, Nielsen's 4). Even ranges or "from €X / typical engagement" beats silence. *Need: pricing stance.*
5. **Founder philosophy line with a face**, like Lazarev's, ties the challenge-first promise to a real person.

### Phase 2, Palette decision  *(evidence, then commit)*
- **Competitor colour audit**, I catalogue the palettes of ~5 firms we'll be compared to (so we differentiate, not blend, recall "blue is invisible" in this category).
- **Real-hero preview**, blue-pastel vs green-pastel on the actual hero (not a mockup), side by side.
- **Decide** → implement as a clean token system (one accent), **AA contrast verified**. Light-pastel only if contrast holds; otherwise keep the premium dark with a colored accent.
- Standing constraint: no blue-tinted neutrals in dark (founder preference), blue ⇒ go light.

### Phase 3, Depth & signals  *(compounding trust)*
- **Metrics band**, even modest, honest numbers (projects shipped, years combined, response time) in a quantified strip, the way every benchmarked firm leads.
- **Testimonials** with name + title (social credibility's strongest form). *Need: 1–2 client quotes.*
- **Name the method**, give the challenge-first delivery a named shape (we already have the 4 beats in POSITIONING; surface it as a labelled process).
- **Connection to the web**, link real LinkedIn/GitHub; consistent name/contact everywhere.
- **Objection handling**, a short FAQ answering the unspoken "what will this cost / what's the risk / what if it goes wrong", our guarantee voice already answers these.
- **Security/privacy clarity** on the contact path.

### Phase 4, Keep it earned  *(ongoing discipline)*
- **Performance**: Lighthouse ≥ 90, zero layout shift (speed = trust). Per [DELIVERY-CHECKLIST](../DELIVERY-CHECKLIST.md).
- **Accessibility**: keyboard + screen-reader clean.
- **Consistency**: one nav/button/motion system across all pages (and both languages).
- **Freshness**: add a new case/outcome whenever one lands, activity signals matter.

---

## Owner split

**I can do without you:** Phase 0 entirely; Phase 2 competitor audit + previews; the structural build for
Phase 1/3 (case-study layout, logo strip, metrics band, FAQ, "how we engage" section) using placeholders
ready to fill.

**Needs you (founders):** real photos · the case-study client + numbers + permission · which client names/
logos are allowed · pricing stance · 1–2 testimonials · the final palette call.

## Decisions to make now
1. **Pricing**, show ranges, or keep "tell us what you need"?
2. **Named case study**, which client can we name, with what numbers?
3. **Palette**, green-pastel (distinctive, "growth") vs blue-pastel (expected trust) vs keep dark+accent, I'll bring the audit + live preview to settle it.
4. **Start order**, I'd suggest: Phase 0 now → Phase 2 audit (parallel) → Phase 1 as your inputs arrive.

## Sources
Competitor scan: [Lazarev](https://lazarev.agency) · [ustwo](https://ustwo.com) · [AI product design agency rankings (ParallelHQ)](https://www.parallelhq.com/blog/ai-product-design-agency) · [Top AI agencies (Scandiweb)](https://scandiweb.com/blog/top-ai-agencies/).
Trust research: see [TRUST-UI-PLAYBOOK.md](TRUST-UI-PLAYBOOK.md) sources (NN/g, Stanford, motion-design studies).
