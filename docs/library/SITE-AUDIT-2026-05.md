# Site identity audit, ds2-consulting.com (2026-05-29)

> **Verdict (one line):** The site is *much* stronger than I expected, sophisticated craft, identity-aware copy, the senior-only claim is already loud. The two real gaps are (1) **Challenge-First Delivery isn't named/visualized as a method**, and (2) **the three signature sentences aren't treated as a system**.

**Audit method:** measured against [01, Brand identity foundations](01-brand-identity-foundations.md) (Olins four channels, 7-second test, Onlyness) + [02, Consulting marketing playbook](02-consulting-marketing-playbook.md) (proof, distribution, named method, pricing, senior-only).

---

## What's already strong (don't touch)

- **Voice.** Copy is in the DS2 register, no fluff, anti-bundle, honest. Lines like *"No menu padding. Each of these is something we'd take responsibility for end-to-end, or refuse the engagement"* are exactly right.
- **Senior-only differentiation.** The Founders section title (*"Two senior founders. No layers in between."*) and sub (*"You're never handed off to junior staff, however big the project gets."*) are loud and well-placed. This is one of the rarest differentiators in consulting, and you're already saying it.
- **Signature sentence #1** *("We work best when we can be honest early, even if that means challenging the initial idea")* appears in the hero sub AND repeats as the About coda.
- **Engage modes** (Consulting / Build / End-to-end). Clean structure. Mode 3 description names the method implicitly (*"Where challenge-first pays back the most"*).
- **Stewardship** framed as **optional**, on-brand restraint. The microcopy (*"the occasional honest call when something's drifting"*) reinforces voice.
- **Visual craft.** OGL shader bg, Lenis smooth-scroll, GSAP magnetics, the macOS-Mail typewriter contact, all premium, all on-brand.

---

## What's missing (the real gaps, in priority order)

### 🔴 P1, Challenge-First Delivery isn't visualized as a method
It's mentioned once as a phrase, but the **four beats** (diagnose → challenge → alternatives → decision-pause) appear *nowhere* on the homepage. This is the single biggest identity gap, the thing that makes DS2 different is invisible.
**Fix:** A new section between Engage and Founders. Component name: **"How we work, Challenge-First Delivery"**. Visualize the four beats with a real micro-example for each. Lives forever in the sales deck too.

### 🔴 P2, Signature sentences aren't a system
Only #1 is live. The other two, *"Projects end. Responsibility doesn't."* and *"We don't certify your organisation, we take responsibility for what we build."*, are in `POSITIONING.md` but **not on the homepage**.
**Fix:** Replace (or extend) the current Thesis section with the three signature sentences treated typographically. Becomes the identity *moment* of the page.

### 🟠 P3, No POV essay / manifesto
The cornerstone marketing asset (per [02 playbook](02-consulting-marketing-playbook.md)), the canonical reference on Challenge-First Delivery, ~2,000 words, lives at `/manifesto` or `/how-we-work`, doesn't exist yet.
**Fix:** I can draft this. It also becomes the script foundation for the video.

### 🟠 P4, No pricing signal
Opaque pricing reads junior; banded pricing reads senior (per Enns, Weiss, Maister). Nothing on the engage modes hints at investment level.
**Fix:** Add "from €X" or a band to at least Mode 1 (lowest-commitment). Or a phrase like *"engagements typically range €25k–€150k"* under the Engage CTA.

### 🟠 P5, Proof is thin
Featured grid links to two sites without outcomes. Portfolio page acknowledges *"Early work, named where the client is happy to be."*
**Fix:** Pick the *one strongest* engagement; rewrite its blurb in outcome-language (80 words: problem → diagnosis → what we challenged → outcome). One real case study beats five screenshots.

### 🟡 P6, Generic hero tagline (defer until wedge picked)
"Digital Solutions / consulting" reads like 10,000 other firms. Once the wedge is picked from [03](03-wedge-and-positioning.md), this becomes the single highest-leverage copy change.

### 🟡 P7, About copy leans Greek-domestic
*"Athens moves slower on technology than it should"* + the family-restaurant typewriter draft reinforce a domestic-Greek focus. Per [[project_naming_direction]], brand must read internationally. **Deliberate call needed**: do you want a primary Greek-market wedge (E in [03](03-wedge-and-positioning.md)), or do we re-frame the About + typewriter draft to read international?

---

## Section-by-section notes (quick)

| Section | State | Recommended edit |
|---|---|---|
| **Hero** | Strong sub. Generic tagline. | Tagline rewrite *after wedge* (P6). |
| **Powered by** | OK. | None. |
| **Services** | Voice on-brand. 6 cells is broad. | Review post-wedge, boutique firms grow by cutting services. |
| **Featured** | Two cards, no outcomes. | Rewrite one card in outcome language (P5). |
| **Thesis** | Generic quote. | Replace with signature sentences as system (P2). |
| **Engage** | Excellent structure. | Add pricing band (P4). |
| **Founders** | Strongest section. | Optional: one-line claim above photos. |
| **Contact** | Distinctive. | Update draft body *after wedge* (P6). |
| **About** | Solid but Greek-leaning. | Deliberate call (P7). |
| **Footer** | OK. | None. |
| **New section needed** |, | **"Four Beats" between Engage and Founders (P1).** |

---

## Recommended fix order (next sessions)

Each step is independent + shippable + light on the machine. Wedge decision unblocks P6/P7 but P1–P5 can all start now.

1. **P1**, Build the "Four Beats / How we work" section.
2. **P2**, Rewrite Thesis as signature-sentence system.
3. **P3**, Draft the Challenge-First Delivery manifesto essay (`/how-we-work` page).
4. **P4**, Add a pricing band to the Engage section.
5. **P5**, Rewrite one Featured card in outcome language.
6. *(After wedge)*, **P6** hero tagline + **P7** About / typewriter re-frame.

---

## What this audit didn't cover (intentionally)

- Visual / design / color decisions, the visual craft is already strong; identity gaps are about *content + structure*, not aesthetics.
- Performance / Lighthouse, separate concern; covered by [docs/DELIVERY-CHECKLIST.md](../DELIVERY-CHECKLIST.md).
- Admin app (`/admin/*`), internal.
- Mobile-specific issues, would need a real-device test, deferred to Mac.

---

> **Recommendation for what to ship next:** start with **P1 (Four Beats section)**. Biggest single identity unlock, doesn't depend on any other decision, ~1 session of work, light on the machine.
