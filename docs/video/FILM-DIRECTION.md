# DS2 hero film — direction of record

**Working title:** *The honest version* · 52s · 1920×1080 @ 30fps · Remotion (`packages/ds-video`)

**Logline:** DS2 builds the app a client asked for — beautifully — then argues against
it on screen, compresses an 11-step booking journey into 3 in one unbroken shot, and
ships something better. The challenge-first workstyle as drama.

## Why this concept

Four concepts competed (4 independent creative directors), judged by a 3-lens panel
(brand truth / premium craft / marketing pull):

| Concept | Brand | Craft | Pull | Total /90 |
| --- | --- | --- | --- | --- |
| **The honest version** | **30/30** | 23 | 25 | **78** ← winner (2 of 3 judges) |
| The travelling detail | 20 | 24 | 26 | 70 |
| The semicolon | 27 | 24 | 18 | 69 |
| The through-line | 25 | 17 | 23 | 65 |

**Perfect brand-fit scores from all three judges** — the deciding factor. It's the only
concept a competitor cannot copy without lying: it *performs* the four-beat workstyle
(diagnose & challenge → "this creates risk because…" → alternative with reasoning →
decision pause) instead of claiming it. It shows we can build the thing we argue
against — capability AND judgment in one film.

## The film

**Cold open (0–3.2s)** — no logo, no fade. Ink + grain. Mono stamp: `client brief — 09:14`.
Typewriter: **"We want an app our guests download to book."** A gleaming App Store page
for *Meltemi Suites* (boutique hotel, Crete) fades up in a phone frame. It looks
finished, expensive, 4.8★.

**The build-up (3.2–7.5s)** — the app page auto-scrolls; it genuinely looks good.
Copy: *"We could build this. It would look good."* — earn the flawed ask before
challenging it.

**The challenge (7.5–13s)** — the scroll **freezes mid-motion**. A hand-drawn
periwinkle annotation circles the GET button; a mono margin note types:
*"this creates risk because… your guests book once, maybe twice a year. an install is
a wall between them and a room."* An 11-screen filmstrip of the install→book journey
assembles below, each screen stamped with a mono step label.

**The turn (13–16.5s)** — *"Here's what we'd do instead."* with a periwinkle underline
drawing beneath it.

**THE WOW (16.5–21.5s)** — the compression shot, one unbroken camera move: the
11-screen strip lifts into staggered 3D-parallax layers, and the 8 screens that exist
only to serve the install are **physically squashed flat** one after another — 2–3
frames apart, an in-key sub-bass hit on each, neighbours sliding in to close the gap —
while a tabular-nums counter reels **11 → 3**. This is the rewind moment.

**The alternative, alive (21.5–27.5s)** — a thumb books a room in three taps on the
instant mobile-web flow. Counter: *"time to book — 41 s"*.

**The full picture (27.5–33.5s)** — camera pulls back; beside the phone, the
*front desk* ops dashboard materialises (arrivals, occupancy dial, housekeeping) —
the Internal Rewiring capability, in the same story.

**The decision pause (33.5–39s)** — split composition: the client's original ask
dimmed to 40%, the alternative lit. Cursor drifts unhurried between them.
*"You don't need to decide now. Take time — we're happy to proceed either way."*
**Graft (from "The semicolon"):** during this beat, EVERYTHING halts on its exact frame
except film grain, a blinking caret, and a small counting GeistMono timecode — a
frame-verifiable pause. Stillness as confidence.

**Proof montage (39–45s)** — `meltemisuites.com — live` deploy line with green dot,
then two more finished builds at 1.5s crossfades:
*"challenged: fax orders → one-tap reorder · challenged: PDF forms → live scheduling"*
(the London wholesaler portal + the Athens clinic scheduler).

**Thesis (45–49s)** — ink card: *"We work best when we can be honest early — even if
that means challenging the initial idea."*

**Logo (49–52s)** — DS2LogoReveal, `ds2-consulting.com`, hold to black.

## Grafts adopted from the losing concepts

1. **GeistMono service-label system** (from *The travelling detail*): every mockup gets
   a mono stamp — `brand upgrade — hospitality · Crete`, `custom solution — food
   distribution · London`, `internal rewiring — hospitality · Crete` — making the three
   services literal on screen.
2. **Timecode-verified freeze** (from *The semicolon*): applied to the decision pause
   (above).
3. **Diegetic copilot exchange** (from *The through-line*) — OPTIONAL: inside the ops
   dashboard beat, a copilot pane could answer a question with "this creates risk
   because…" — the workstyle echoed inside the product. Only if the beat doesn't
   crowd; decide at animatic stage.

## Mockup aesthetic — "designs they covet"

Source: the founder's inspiration set, [assets/motion-inspiration/ds2-vid-inspo/](../../assets/motion-inspiration/ds2-vid-inspo/).
The common DNA across all seven references: **frosted-glass surfaces floating over
rich, warm, full-bleed photography** — golden-hour hospitality and real-estate
imagery, translucent cards, serif-editorial headlines, lavender/gold accents. Two of
them are already in DS2's periwinkle family (the lavender login, the DathHub bubbles).

**The rule:** the film's chrome (the void, labels, captions, transitions) stays in the
DS2 video identity — ink, grain, periwinkle, GeistMono. But the client work shown
INSIDE the frames goes glass-over-photography warm luxury. The contrast is the point:
our restrained dark frame presenting their vivid coveted product — a gallery wall.
The mockups must look like things a hotel owner or clinic director *wants to own*,
not like UI demos.

| Reference | Feeds mockup |
| --- | --- |
| `glass-proptech-app.jpg` (frosted cards over desert villa, warm gold) | Meltemi booking flow styling |
| `smarthome-glass-app.jpg` (amber glass phone screens over blurred interior) | Meltemi booking flow + front-desk widgets |
| `editorial-realestate-site.jpg` (giant serif over architecture photo) | Athens clinic site |
| `penthouse-dark-gold-site.jpg` (dark luxury, city dusk, gold) | Meltemi App Store page (the flawed ask must gleam) |
| `yacht-club-dark-luxury-site.jpg` (dark navy, serif italics, full-bleed sea) | proof-montage garnish / alt clinic direction |
| `lavender-glass-login.jpg` (periwinkle glass card over lavender field) | any auth/entry screen — native DS2 palette |
| `dathhub-desktop-app.jpg` (native frosted desktop app, periwinkle bubbles) | wholesaler portal → **as a desktop app** (below) |

## Mockups to build (all as real React components, not images)

| # | Mockup | Role | Service label |
| --- | --- | --- | --- |
| 1 | Meltemi Suites — App Store page (the flawed ask, deliberately premium, dark-gold gleam) | the setup | — |
| 2 | 11 mini iOS screens: install→account→verify→…→book journey | the compression shot fuel | — |
| 3 | Meltemi instant booking web flow — frosted glass over golden-hour Crete photography (date → room → payment) | the alternative | brand upgrade — hospitality · Crete |
| 4 | Meltemi front-desk ops dashboard — glass widgets over a soft interior blur | the full picture | internal rewiring — hospitality · Crete |
| 5 | London specialty-food wholesaler — **native desktop app window** (traffic-light chrome, no URL bar, DathHub-style frosted material): one-tap reorder, live stock, invoice archive | proof montage | custom solution — food distribution · London |
| 6 | Athens private clinic — editorial site with live scheduling (serif over calm photography) | proof montage | brand upgrade — healthcare · Athens |

**Why #5 is a desktop window:** it silently demonstrates the "an app your team
installs on their computers, connected to one online backend" capability — shown, not
claimed, and never naming the tech. Its montage caption gains a second mono line:
`desktop app — installed on the team's machines · one shared backend`.

**Photography note:** the warm imagery inside mockups comes from AI generation
(Design Book / fal.ai) or licensed stock — generated once, embedded as static assets
inside the components. The UI chrome over it is all real React.

**The declared risk (owned):** the film lives or dies on the compression shot — the 11
mini-screens must read as genuinely legible iOS frames, not grey placeholders. That's
why they're built as real components on the `CapabilityMockup` foundation, rendered at
full fidelity and scaled down.

## Audio

- **Music:** minimal analogue pulse, Linear/Vercel register — felt piano or soft
  square-wave motif over a sparse kick. Arc: room tone (hook) → pulse enters ("We could
  build this") → **thins to a held low note** during the challenge → sub-bass hits on
  the squashes → full warmth for the alternative → near-silence for the pause → resolve.
  ~100–110 BPM, must survive a -14 LUFS web mix. Source: Artlist/Epidemic ("minimal
  analog pulse", "felt piano minimal tech").
- **SFX:** existing pipeline (`public/sfx/`): `type.mp3` (brief + margin notes),
  `click.mp3` (annotation lands, taps), `confirm.mp3` / `clean_minimal_success` (booking
  confirmed, deploy line), whoosh (camera pull), NEW need: 8 short in-key sub-bass hits
  (the squashes) + one deep impact. Cue sheet to be written at build time, same format
  as `BriefToShipped`'s.

## Production plan

1. Codex's `foundation/` layer lands (motion primitives, `CapabilityMockup`,
   `FilmTexture`, `AudioCueTrack`, `DS2LogoReveal`) — review it against Remotion
   best practices first.
2. Build mockups 1–6 as components (the biggest chunk of work, and reusable on the
   site/pitches afterwards).
3. Block the film: `HonestVersion.tsx` composition, beats as `Sequence`s, no polish.
4. The compression shot — prototype FIRST (it's the risk). If it doesn't sing at
   animatic quality, we know early.
5. Polish pass: grain, atmosphere, light, easing; then SFX cue sheet; then music.
6. Render stills at key frames for review → full render → `book_video_critique` pass.

## Open decisions (Dath)

- Approve this concept as direction of record (runners-up are archived in the
  workflow transcript, revivable).
- Music: source a licensed track per the spec above (I'll shortlist candidates when
  we're at step 5).
- The optional copilot graft (§Grafts, 3).
