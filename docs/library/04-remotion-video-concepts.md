# 04 — Remotion marketing video — concept directions

> One-line brief: a **60–90 second identity video** for DS2 that expresses *"challenge-first, transparent delivery"* — anti-consultancy in tone, premium in craft — to live on the homepage, LinkedIn, and inside the sales deck.

This doc is the **ideation phase**, not the brief. The brief comes after we pick a concept.

---

## Why Remotion (not After Effects / video agency)

- **Programmatic = data-driven.** Once the system is built, we can regenerate per client / per pitch / per language with code changes, not video re-renders. Massive long-term leverage for a consultancy that pitches a lot.
- **Lives in your stack.** React + TypeScript = version-controllable in git, code-reviewable, no creative-vendor lock-in.
- **Render anywhere.** Vercel, AWS Lambda, or a small server. We control everything.
- **2026 context:** 73% of B2B marketers are using animated explainers as their #1 pipeline-driving format ([Vidico 2026 trends](https://vidico.com/news/animated-marketing-videos/)). Static "About Us" pages are dead.

The trade: Remotion rewards code-discipline; it punishes treating video like After Effects. Plays to DS2's strengths.

---

## What "good" looks like in 2026 — references to study

### The bar
- **[Remotion official showcase](https://www.remotion.dev/showcase)** — the ceiling of what's possible programmatically. Study the *kinetic typography* and *data-driven* pieces first.
- **ElevenLabs Conversational AI 2.0 reveal** (2026) — fluid animation + tight voiceover, *brand reveal* rather than product demo. Restrained, premium.
- **Linear launch videos** — the gold standard for SaaS identity motion: clean typography, single accent color, restrained motion, sound design > visuals.
- **Anthropic's Claude product videos** — text-driven, slow-paced, *trust signals over fireworks*.
- **Apple text-rhythm trailers** (iPhone keynote intros) — pure kinetic type at editorial pace.
- **Spotify 30-second brand spots** — 2D animation + striking graphics, often *no voiceover at all*. Music carries it.

### Anti-references (what NOT to do)
- Consultancy reels with stock footage of handshakes / boardrooms / globes / dashboards.
- Logo-spin endings.
- Voiceover written by a marketing team ("In today's fast-paced digital landscape…").
- Anything that could've been made by a competitor with one Find-and-Replace.

---

## Five concept directions

> Each direction is independently producible. They differ in *what* they say and *how* they say it. Pick one to develop into the brief.

### C1 — "The Anti-Consultancy Reel" **(Recommended)**

**One-line idea:** Other consultancies' polished promises fade in then strike through; replaced by the things DS2 actually says.

**Structure (60s cut):**
| Sec | Frame | Audio |
|---|---|---|
| 0–3 | Black. White serif type fades up: *"Most consultancies say:"* | Silence → soft pad enters |
| 3–10 | "*We deliver transformation at scale.*" (strike through) → "*We're your end-to-end partner.*" (strike through) → "*We help you innovate.*" (strike through) | Subtle whoosh on each strike |
| 10–15 | Cut to white. Bold sans serif: *"We say:"* | Beat |
| 15–35 | The signature sentences animate in, one at a time:<br>*"We work best when we can be honest early — even if that means challenging the initial idea."*<br>*"Projects end. Responsibility doesn't."*<br>*"We don't certify your organisation — we take responsibility for what we build."* | Quiet, deliberate; one founder voice or none |
| 35–50 | A single line — *the* challenge-first line — animates across the screen tracing the four beats (diagnose → challenge → alternatives → decision-pause) | Music swells slightly |
| 50–60 | Logo. URL. Single line: *"DS2 Consulting. Athens — London."* | Resolve |

**Tone:** Stripe homepage + Basecamp essay + Anthropic dry confidence.
**Visual:** 80% typography. Single accent color (DS2 purple). One typographic motif (the line).
**Why this wins:** It *is* the brand. It's the only video your competitors literally cannot make — because the script *is* your method. Costs almost nothing to produce; reads premium because the craft is in the typography + timing.
**Hardest part:** Voiceover decision (founder-voice = max trust; pro-VO = max polish). Recommend founder-voice if Dimitris or Stelios can land 6 takes calmly.

### C2 — "The Two Paths"

**One-line idea:** Split-screen of the same Day 1 brief, taken down two different paths.

**Structure (90s cut):**
- Open: same brief lands on two desks (left: generic agency; right: DS2).
- Day 5: left says "yes, building"; right says "we have questions — this creates risk because…"
- Day 30: left is mid-build of the wrong thing; right has pivoted to the right thing.
- Day 90: left ships, struggles; right ships, succeeds.
- End: *"You can have either of these. Choose deliberately."*

**Tone:** Documentary-clean, dry.
**Visual:** Animated timeline split-screen, key moments illustrated as icons + dates.
**Why it works:** Makes the differentiator *tangible*. Excellent for sales-deck embed (the prospect sees themselves in it).
**Risk:** More complex Remotion build; risk of feeling preachy if the "wrong path" is too cartoony.

### C3 — "The Method in Motion"

**One-line idea:** An animated walkthrough of the four beats of Challenge-First Delivery, each demoed against a real micro-scenario.

**Structure (90s cut):**
- Title: *"Challenge-First Delivery"*.
- Four chapters, ~20s each:
  1. **Diagnose** (here's how we open every engagement)
  2. **Challenge** (real example of what we pushed back on)
  3. **Alternatives** (the option we proposed instead)
  4. **Decision pause** (the line we always say)
- Each chapter: kinetic diagram + one real (anonymised) micro-quote from a client moment.
- End: "*This is how we work. Always.*"

**Tone:** Editorial, instructional. Think *The Pudding* or Stripe Engineering blog.
**Visual:** Diagram-driven; nodes, lines, simple icons. Single accent color, restrained.
**Why it works:** **Doubles as a sales asset.** This video *is* the four-beats deck a prospect needs to see by call 2. Reusable across pitch, homepage, and onboarding.
**Risk:** Easy to over-explain. Discipline = keep each chapter under 5 sentences.

### C4 — "Founders Direct"

**One-line idea:** Dimitris and Stelios, direct to camera, each tells one real client moment where challenging the brief saved the project.

**Structure (60–90s cut):**
- 5s logo cold-open.
- 25s Dimitris: one story.
- 25s Stelios: one story.
- 10s bookend: signature sentences animated.
- 5s logo + URL.

**Tone:** Honest, low-fi, premium. The opposite of a corporate talking-head video.
**Visual:** Beautifully shot (good camera + light + room) but compositionally simple. The talk *is* the value. Optional: kinetic captions reinforce key lines.
**Why it works:** Maximum trust signal. Real founders, real stakes, real stories. The strongest possible expression of "challenge-first" because *you're literally doing it on camera*.
**Hardest part:** Requires an actual shoot (camera, light, edit). Bigger production lift. Could be the **v2** after C1 establishes the visual language.

### C5 — "Magazine Motion"

**One-line idea:** Pure typography. The signature sentences delivered with editorial-grade kinetic type. No voiceover. Music carries it.

**Structure (60s cut):**
- Black → white → black.
- The three signature sentences each get 15s of typographic treatment (huge type, varied scale, slight movement, subtle paper-grain texture).
- One color accent appears on a key word in each sentence.
- End: logo + URL.

**Tone:** Pentagram + Sagmeister + a printer's restraint.
**Visual:** Heavy custom type (maybe even custom-drawn letterforms for the signature words). Single accent color. Paper-grain or print-screen texture for warmth.
**Why it works:** **Distinctive on a feed full of generic motion.** Stops scroll *because* it's text on a feed of video.
**Risk:** Requires real typographic craft. If the type isn't great, it falls flat. Probably wants 4–8 hours from a real type designer (could brief one via Pentagram alumni network or Working Not Working).

---

## Recommendation

**C1 — Anti-Consultancy Reel — as the v1.**

Why:
- The script *is* the brand (impossible to copy).
- Lowest production risk (typography + voiceover, no shoot).
- Fastest to ship (1–2 weeks of focused Remotion work on the M5).
- Lays a visual system (typography, accent color, motion rhythm) you reuse for C3 and C4 later.
- Strongest "stop the scroll" energy on LinkedIn — text-first reads as serious.

**Then v2 = C3 (Method in Motion)** to double as a sales asset, and **v3 = C4 (Founders Direct)** once you have a shoot day budget.

C2 and C5 are good but riskier as a v1.

---

## Length cuts to plan from the start

Build the master at 90s. Cut down. Always.

| Cut | Length | Aspect | Use |
|---|---|---|---|
| **Master** | 90s | 16:9 | Pitch deck, conferences, full storytelling |
| **Hero** | 60s | 16:9 | Homepage above-the-fold; loops, captioned |
| **LinkedIn feed** | 30s | 1:1 | LinkedIn / Twitter, autoplay-friendly, captions baked in |
| **Reels / Shorts** | 15s | 9:16 | Instagram, TikTok, LinkedIn Stories — if you go there |

---

## Asset list (concept-agnostic)

- **Logo**: final SVG + 3 colorways
- **Brand typography**: at least one serif (signature voice) + one sans (UI). Loaded into Remotion as `staticFile()` font assets.
- **Color**: DS2 purple + 1 neutral. Don't add a third.
- **Voiceover**: founder-voice OR licensed VO (recommend founder, see C1 notes)
- **Music**: instrumental, restrained. Sources: Musicbed, Artlist, Soundstripe (licensed) or Epidemic Sound. Avoid royalty-free clichés.
- **Captions**: baked in (auto-play on LinkedIn is muted; captions = 80% of views)
- **Sound design**: subtle whooshes + a single distinctive sting at the logo reveal (do NOT skip — sound design separates premium from amateur)

---

## Production checklist (when the M5 arrives)

1. **Pick concept** ← *the decision to make next*
2. Write script — for 90s, ~180 words max
3. Storyboard 8–12 keyframes (Figma or paper)
4. Record voiceover (or commit to founder-voice — record 6 takes minimum)
5. License music + sound design
6. Build in Remotion under `apps/ds-site/remotion/` or a new `packages/ds-video/`
7. Render 3 cuts (master / 1:1 / 9:16)
8. Deploy:
   - Homepage hero with poster fallback
   - LinkedIn pinned post
   - Sales deck slide 1

---

## Remotion resources to study

- [Official showcase](https://www.remotion.dev/showcase) — the bar
- [Remotion templates](https://www.remotion.dev/templates) — starting points
- Remotion docs: kinetic typography patterns, `interpolate` + `spring`, transitions
- The `remotion` skill is installed in this repo — invoke it when we move from concept → build.

---

## Sources verified May 2026

- [Vidico — 10 Best Animated Marketing Video Examples (2026)](https://vidico.com/news/animated-marketing-videos/) — 73% B2B animated-explainer stat
- [Vidico — Best Rebranding Videos (2026)](https://vidico.com/news/rebranding-videos/) — reference list of brand-reveal pieces
- [Superside — Corporate Animation Examples (2026)](https://www.superside.com/blog/corporate-animation-examples)
- [Remotion official showcase](https://www.remotion.dev/showcase)

> Next: once a concept is picked, generate the **brief** (script + storyboard + production plan).
