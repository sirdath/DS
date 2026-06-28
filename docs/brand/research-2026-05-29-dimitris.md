# DS², Website content & brand recommendations (Dimitris, 2026-05-29)

> Research input from Dimitris. Preserved verbatim. Kept **separate** from
> `docs/library/` (which is the curated knowledge base). Both will be used as
> inputs into the next website redesign, neither overrides the other.
>
> Related artifacts:
> - `docs/brand/POSITIONING.md`, canonical brand playbook
> - `docs/library/01-brand-identity-foundations.md`, frameworks (Neumeier, Dunford, Olins…)
> - `docs/library/02-consulting-marketing-playbook.md`, Maister, Enns, Weiss
> - `docs/library/03-wedge-and-positioning.md`, 5 wedge candidates
> - `docs/library/SITE-AUDIT-2026-05.md`, audit of the current live site

---

# DS², Website Content & Design Direction

*Ready-to-use copy + a "simple but cool" animation/effects spec.*
Replace `[VERTICAL]` with your phase-1 niche once chosen (e.g. salons, clinics, tavernas).

---

## Voice rules (apply everywhere)

- **Plain over clever.** If a shop owner wouldn't say it, don't write it.
- **Outcome first.** Lead with the result, then the thing that produces it.
- **Confident, not boastful.** Short sentences. No filler. Keep the challenge-first edge.
- **Zero jargon.** No "leverage", "synergy", "applied AI" in customer-facing copy.

---

# PART 1, WEBSITE COPY

## Hero

**H1:** We build the digital tools that help small businesses win, 
and handle the tech so you don't have to.

**Sub:** Websites, AI assistants, and automation. Built by two senior founders in
Athens and London. No jargon, no junior staff, no surprises.

**Buttons:** `Start a conversation` · `See our work`

> Optional one-liner under the buttons, kept from your current brand:
> *"We work best when we can be honest early, even if that means challenging the idea."*

---

## Services, "Six things we build, and we build them seriously."

*Lead with 01–03 (what an SME buys first). Present 04–06 as "when you're ready to go further."*

**01 · Websites**
A site that earns trust and turns visitors into customers, fast, polished,
and built to be found on Google.

**02 · AI Assistant**
Never miss a customer again. It answers, books jobs, and follows up by text and
call, day and night.

**03 · Automation**
The repetitive busywork between your tools, handled quietly in the background,
so you get your time back.

**04 · Data**
Straight answers from the numbers you already have: what's working, what isn't,
and what to do next.

**05 · Predictions**
See demand, risk, and opportunity coming before they arrive, so you can plan
instead of react.

**06 · Mobile Apps**
iOS and Android that feel fast and native, for when your business needs more
than a website.

---

## Featured work

**Heading:** A look at what we ship.
**Sub:** A couple of recent builds, the rest live in the portfolio.

*(Each card: client name · tags · one-line outcome · "Visit ↗")*
> When you have them, swap in `[VERTICAL]` case studies with a hard number:
> e.g. *"Bookings up 38% in 60 days."*

---

## A working principle

> The biggest cost is **lack of knowledge.**

*(Keep this, it reassures an SME that you'll teach, not gatekeep.)*

---

## How we engage, "Three ways to work with us."

**▶ End-to-end, we handle everything.** *(lead with this)*
Idea to live, under one roof. You stay informed without being overwhelmed.
*Best for: you know the problem, not the solution.*

**Build only.**
You know what you need, we ship it with senior hands and weekly visibility.

**Consulting only.**
A senior second opinion before you commit time or money.

**+ Stewardship (monthly).**
After launch we keep it running, updated, and watched, and make the honest call
if something starts to drift.

---

## Team, "Two senior founders. You talk to one of us, always."

**[Founder name], Strategy & Consulting · Athens**
Asks the uncomfortable questions early, so they're not asked late.

**[Founder name], Engineering & Data · London**
Decides whether what we build will still be standing in three years, and says so
before we ship.

> Add real names + photos. This section's whole job is trust.

---

## Contact

**Heading:** Tell us what you're actually trying to do.
**Sub:** We reply same or next business day.
**Email:** hello@ds2-consulting.com  *(not gmail)*
**Footer:** © 2026 DS² · Digital Solutions · Athens · London

---

# PART 2, DESIGN & ANIMATION DIRECTION

**Aesthetic:** refined minimalism. Confident, lots of negative space, one strong
accent. Premium enough for a future enterprise client, calm enough not to intimidate
a shop owner. *Elegance comes from restraint, not from adding more.*

### Foundations
- **Type:** a distinctive display face for headings (characterful, not Inter/Arial/Roboto)
  paired with a clean, highly legible body face. One display + one body, no more.
- **Color:** a deep ink/charcoal base + **one** warm, energetic accent (amber, coral,
  or a fresh green). Avoid corporate-blue cliché and purple-gradient-on-white "AI slop."
- **Space:** generous margins, big type, few elements per screen. Let it breathe.

### The signature moment, the DS² mark
Make the squared **²** the brand's one memorable animation: on load, the `2` lifts
into superscript position and settles (a ~500ms ease-out). Reuse the same motif as a
tiny accent on hover for the logo in the nav. **One** signature beat, done well.

### Motion, high-impact, low-quantity
The rule from good design practice: *one orchestrated page-load beats scattered
micro-interactions.* Pick a few, execute precisely.

1. **Hero load:** headline reveals as a staggered fade-up (each line +80ms delay).
2. **Scroll reveals:** sections fade + rise ~16px as they enter view (Intersection
   Observer). Subtle, once, never on every scroll.
3. **Service cards:** on hover, lift 4px and draw a 2px accent underline left-to-right.
4. **Buttons:** smooth accent-fill on hover (~200ms), not a hard color swap.
5. **Featured work:** image scales 1.03 and the "↗" nudges right on hover.

### Keep-it-simple guardrails (important)
- All transitions **150–400ms**, `ease-out`. Nothing slow or bouncy.
- **Respect `prefers-reduced-motion`**, disable non-essential motion for those users.
- No autoplay video, no parallax overload, no animation on *every* element.
- Animation should make it feel *considered*, never *busy*. If in doubt, remove it.

### Lightweight implementation notes
- **If plain HTML/CSS:** CSS keyframes + a small Intersection Observer for reveals.
  No heavy libraries needed.
- **If React:** use the Motion library for orchestration; keep variants minimal.

```css
/* Scroll-reveal pattern */
.reveal { opacity: 0; transform: translateY(16px);
  transition: opacity .4s ease-out, transform .4s ease-out; }
.reveal.in { opacity: 1; transform: none; }

@media (prefers-reduced-motion: reduce) {
  .reveal { opacity: 1; transform: none; transition: none; }
}
```

```js
// Trigger once on enter
const io = new IntersectionObserver((entries) => {
  entries.forEach(e => { if (e.isIntersecting) {
    e.target.classList.add('in'); io.unobserve(e.target);
  }});
}, { threshold: 0.15 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
```

---

## Build order (so it ships, not stalls)

1. Lock the **vertical** → fill the `[VERTICAL]` placeholders.
2. Drop in the new copy above.
3. Fix credibility items (domain email, founder names/photos, reply time).
4. Add the **DS² mark** animation + **hero stagger** + **scroll reveals** only.
5. Ship. Add card/button micro-interactions in a second pass.

---

# DS², Website & Brand Recommendations

*Strategy notes for improving ds2-consulting.com*

---

## The core strategy: two phases, not two companies

The tension between "premium senior consultancy" and "mass-market small-business
digitization" isn't a contradiction, it's a **sequence**:

1. **Phase 1, Land down-market.** Win small businesses to build cash, repetitions,
   and a portfolio of proof.
2. **Phase 2, Climb up-market.** Use that portfolio to credibly sell to bigger
   companies who pay more and need proof of competence.

This is how most respected agencies actually started. The job of the website right
now is to **sell to small businesses today without capping the ceiling for tomorrow.**

---

## The governing brand principle

> **Premium quality. Plain language. Outcome-led.**

Accessible to a small business does **not** mean cheap or junior. Keep every senior
quality signal; strip only the *insider jargon* that assumes the reader already builds
software. That jargon is what repels your phase-1 buyer, and it's the main thing
wrong with the current site.

The brand stance that wins phase 1 **and** ages up gracefully:
*the team that makes technology make sense, and handles it so you don't have to.*

---

## Homepage fixes for the phase-1 buyer

| Section | Problem today | Fix |
|---|---|---|
| **Hero** | "A senior team for strategy, engineering, and applied AI", a line for a CTO, not a shop owner | Lead with the **outcome + the relief**. Senior in quality, human in language. |
| **Services** | Framed as *what they are* (Data, Predictions) | Reframe as *what they do for the business*. Your "AI assistant" line is already perfect, make all six read like that. Lead with the 2–3 an SME actually buys. |
| **Engagement modes** | "Consulting only / Build only / you bring the spec" is enterprise-speak | An SME can't write a spec. **Lead hard with End-to-end ("we handle everything")**; keep the other modes quieter. |
| **Team** | "You talk to one of these two", but no names or faces | Add **names + photos**. That's the exact trust the section is reaching for. |
| **Contact** | `gmail.com` address; "reply within 1–3 business days" | Domain email (`hello@ds2-consulting.com`); promise **same / next business day**. |

---

## The proof engine (the real phase-1 job)

Your phase-2 plan depends entirely on portfolio. Build it deliberately:

- **First 3–5 clients:** over-deliver. Consider discounting a couple of *logo-able,
  photogenic* clients in exchange for a case study + testimonial.
- **Outcome-led case studies:** "bookings up X%", "20 hrs/week saved", not just
  screenshots. Outcomes convince the next SME *and* the future enterprise client.
- **Video testimonials from non-technical owners.** Nothing sells a wary small-business
  owner like another small-business owner saying "I was scared of this; they made it easy."
- **Niche the first wave.** 8 projects in one vertical = "they own this space."
  8 random projects = freelancers. Same effort, far more compounding.

---

## How the brand ages up (no rebrand needed)

Keep the signals that already translate upward:
- The writing quality and challenge-first voice
- "Two founders, no layers in between"
- The Athens + London footprint

Then you never rebrand, you **re-feature**. As bigger logos land, they move to the top
of the portfolio, and the homepage leads with the highest tier you're currently selling.
The proof does the repositioning for you.

---

## Quick credibility fixes (do this week)

- [ ] Replace the gmail address with a domain email
- [ ] Add founder names + photos to the Team section
- [ ] Change reply promise to "same / next business day"
- [ ] Reorder services to lead with Websites · AI Assistant · Automation
- [ ] Push the "you bring the spec" language out of the primary path

---

## The one decision still blocking everything

**Pick your phase-1 beachhead vertical.** (e.g. salons, clinics, tavernas/hospitality,
trades, small retail, tourism operators.)

Everything above, the homepage examples, the case studies, the niche compounding, 
gets sharper the moment that's chosen. The website content draft uses
`[VERTICAL]` placeholders so you can drop it in once decided.
