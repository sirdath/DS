# Homepage performance — diagnosis and plan

**Date:** 2026-08-03
**Trigger:** "when opening the website it is very laggy, takes much longer than it should — not a good first experience"
**Method:** headless Chrome measurements (local production build + live site, at 1×/4×/6× CPU throttle), a CSS ablation experiment, and a 5-lens code audit with adversarial verification.

---

## The headline

**The live site downloads 12.25 MB and takes 7.2 seconds to finish loading. 8.62 MB of that — 70% — is two videos that are eagerly downloaded in full before the visitor needs either of them.**

The logo-draw preloader was built to cover that video load. It cannot: it lifts after ~1.2–1.5s on a fixed timer, while the videos take many seconds. Worse, the readiness event it was meant to wait for (`ds2:videoready`) is **never dispatched anywhere in the codebase**, so the "wait until the video is ready" behaviour never existed. The animation is a 1.5s curtain in front of a 7-second load.

Ranked by what a visitor actually feels:

| # | Problem | Measured cost | Effort |
|---|---|---|---|
| 1 | Two videos with `preload="auto"` download in full on load | **8.62 MB**, `load` at **7.2s** | small |
| 2 | Hero video is over-encoded at 8.76 Mbps | **6.0 MB** where 1.0 MB is visually identical (SSIM 0.981) | small |
| 3 | Uncompressed PNGs on the live build | `contact-section-bg.png` 1.8 MB, `dataportfolio.png` 1.05 MB — WebP equivalents already exist locally at 60 KB / 20 KB | trivial |
| 4 | Preloader gates content on a dead timer | up to **2,092ms** hidden (4× CPU) vs **120ms** to paint | trivial–small |
| 5 | Apex→www redirect | **+328ms** to first paint | trivial |
| 6 | Hero runtime (12 eager full-res images, permanent GPU layers, per-frame hover loop) | scroll degrades to real **>100ms** stalls on weak machines | medium |

**The single biggest fix is already written but not shipped.** The current local build replaced the video hero and switched to WebP: it weighs **2.46 MB and paints in 120ms**, versus the live site's 12.25 MB / 7.2s. The live deployment is stale (no "Nine tools"; 40 KB HTML vs 127 KB local). **Deploying alone removes ~80% of the bytes.**

---

## Measurements

### Load is genuinely fast (local production build)

| Metric | Fast machine | 4× CPU | 6× CPU |
|---|---|---|---|
| First Contentful Paint | 120ms | 100ms | 232ms |
| Largest Contentful Paint | 296ms | 388ms | 332ms |
| Cumulative Layout Shift | **0** | 0 | 0 |
| DOMContentLoaded | 243ms | 381ms | 301ms |
| Total transfer | 2.46MB / 66 requests | — | — |

CLS of 0 is excellent. Nothing here justifies "laggy".

### Perceived readiness is the problem

| | Content painted | Overlay lifted | Wasted |
|---|---|---|---|
| Fast machine | 120ms | ~104ms* | — |
| 4× CPU | 100ms | **2,092ms** | ~2.0s |
| 6× CPU | 232ms | **2,299ms** | ~2.1s |

\* the fast-machine reading is unreliable (polling raced the overlay mount); the throttled figures are the trustworthy signal.

`preloader.tsx` enforces `minMs = 700` (300 with reduced-motion), an **850ms** fade-out, and a **1600ms** hard cap. These stack. On any machine that is not a fast desktop, the visitor stares at a black screen for ~2 seconds *after* the page is ready.

**Two important refinements** from adversarial verification of these findings:

1. **`ds2:videoready` is dead code.** The listener at `preloader.tsx` waits for an event that **nothing in the repo ever dispatches**. The "reveal early once ready" path therefore never fires — `reveal()` always lands on the flat `minMs + 20` timer. The code comments imply the gate is readiness-driven; it is purely a fixed delay. *This is the actual bug*, not merely the duration.
2. **Not all 700ms is waste.** The DS2 wordmark draw genuinely runs ~600ms (`ds2-draw` 0.4s + `ds2-fill` completing at 0.6s, `globals.css:2434-2442`). Only ~100ms of the floor is pure slack. **Cutting the floor to ~200ms would truncate the brand animation** — so the fix is to tie the reveal to the animation's completion, not to shorten it blindly.
3. The 850ms fade uses an `ease` curve (front-loaded) and applies `pointer-events: none` at fade start, so the page is interactive at ~720ms and the scrim is perceptually gone by ~500ms into the fade. Honest "looks ready" figure on a fast machine is **~1.2–1.3s**, not the full 1.55s. On throttled machines the measured figure remains ~2.0–2.3s.

### The live domain adds a redirect penalty

| | FCP | LCP | Perceived ready |
|---|---|---|---|
| `ds2-consulting.com` (apex) | 756ms | 916ms | 542ms |
| `www.ds2-consulting.com` (direct) | **428ms** | **588ms** | **260ms** |

The apex issues a **307 → www**, costing a second connection. TTFB with the redirect followed ranged **0.52s–1.62s** across runs. Cost: **~330ms of first paint, for nothing.**

### Scroll degrades on weak machines

Real scroll gesture (CDP-synthesised), live site:

| | avg frame | p90 | frames >100ms |
|---|---|---|---|
| Fast machine | 45.0ms | 75ms | 0 |
| 4× CPU + 9Mbps | 70.3ms | 141ms | **28** |

*Caveat: absolute FPS in headless is unreliable (no vsync). The **relative** degradation and the 28 real >100ms stalls are the meaningful signal.*

### What is NOT the cause (ruled out empirically)

A CSS ablation experiment disabled each suspect and re-measured scroll:

| Variant | FPS vs baseline |
|---|---|
| baseline | 26.1 |
| no `backdrop-filter` (19 instances) | −2.5 |
| no `filter: blur` (18) | −1.9 |
| no `box-shadow` (86) | −3.4 |
| no `mix-blend-mode` | −4.4 |
| **all of them off** | **−1.1** |

Turning off *every* expensive CSS property changed nothing beyond noise. **The glassmorphism is not the bottleneck** — we do not need to trade away the DS2 look.

Also ruled out: **Lenis + GSAP ScrollTrigger smooth-scroll is already disabled** (`page.tsx:48` gates it behind `window.__ds2_enable_motion`). Scroll is native.

---

## Code audit findings (verified)

**Startup gating**
- `preloader.tsx:14` — 700ms minimum floor, hidden regardless of real readiness.
- `preloader.tsx:38` — plus an 850ms cross-fade; the two stack to ~1.1–1.5s.
- `page.tsx:399` — the preloader is rendered in `page.tsx`, not the root layout, despite its own doc-comment saying otherwise. It therefore **replays every time a visitor returns to the homepage** from /about or /portfolio.

**Hero runtime**
- `core-hero.tsx:328` — all **12 full-resolution screenshots** render eagerly into stacked cards; only ~3 are ever visible.
- `core-hero.module.css:166` — all 12 cards carry a static `will-change: transform, opacity`, permanently promoting them to GPU layers for the entire pageview.
- `core-hero.tsx:121` — a per-frame hover-pop loop runs on any cursor movement over the hero (which fills the first viewport — the first thing a desktop visitor does).
- `core-hero.tsx:200` — the coverflow easing uses lerp `0.11` with stop threshold `0.0006`, so one interaction keeps the rAF loop running far longer than needed.
- `core-hero.tsx:241` — a native `scroll` listener calling `getBoundingClientRect()` stays attached for the whole session, including when the hero is far offscreen at the footer. *Verification downgraded this to low impact:* no coincident layout-dirtying write exists on this page (the other scroll-linked reads sit behind the disabled `__ds2_enable_motion` flag), so it is cheap hygiene, **not** an explanation for the reported lag. Ship it as cleanup, expect no measurable gain.

**JavaScript weight**
- `page.tsx:260` — a second effect **still dynamic-imports gsap + ScrollTrigger unconditionally** on every homepage mount (and again on every language toggle), purely for a title split-reveal. Confirmed present in the built chunks (gsap 72KB + lenis 20KB).
- `i18n.tsx:17` — **both** the English and Greek dictionaries ship to every visitor.
- `layout.tsx:6` — effectively the whole homepage tree is client-rendered, so static marketing copy hydrates as client components.

**Assets**
- `next/image` is unused across the homepage; every image is a raw `<img>`, so mobile downloads desktop-resolution files with no responsive sizing.

---

## The video hero: measured facts

The live hero video is **1920×1080, 5.7s, 8.76 Mbps** — a broadcast-grade bitrate for a silent, looping, often-blurred background. Re-encode tests, with SSIM measured against the original (1.0 = identical; >0.98 is visually indistinguishable):

| Encode | Size | Saving | SSIM |
|---|---|---|---|
| Original (1080p, 8.76 Mbps) | 6.00 MB | — | — |
| H.264 tuned (1080p, CRF 26) | 2.05 MB | −67% | 0.981 |
| **VP9 / WebM (1080p)** | **1.06 MB** | **−83%** | **0.981** |
| H.264 720p (CRF 27) | 0.53 MB | −92% | 0.973 |

A side-by-side frame comparison confirms the 1.0 MB WebM is visually identical to the 6.0 MB original. **The 5 MB difference buys nothing.**

### Answering the original design question

The logo animation was intended to buy time for the video to preload. Three reasons it could not work:

1. **`preload="auto"` fetches the whole file, not the first frames.** It competes with CSS, fonts and images for bandwidth during the most critical moment of the page. `preload="metadata"` plus a poster lets the browser stream progressively and start playing almost immediately.
2. **The second video (`journey.mp4`, 2.65 MB) is below the fold** and also set to `preload="auto"` — it is downloaded before the visitor has scrolled anywhere near it.
3. **The reveal was never actually tied to the video.** `ds2:videoready` has no dispatcher, so the curtain always lifted on a timer regardless of whether the video was ready.

The correct pattern for a video hero: **poster image renders instantly → video streams in behind it → swap when `canplay` fires.** No curtain needed, because there is nothing to hide.

---

## Plan

### Stage 0 — Deploy what already exists (largest single win, zero new code)

0. **Ship the current build.** It is 2.46 MB / 120ms FCP versus the live 12.25 MB / 7.2s load. Per the house rule, verify on `ds2-consulting.com` itself — a green deploy status does not prove the domain updated.

### Stage 1 — Video weight (if/when the video hero returns)

**Status: assets produced and verified (2026-08-03).** Founder reviewed all four encodes side by side and judged B and C both acceptable, so we ship **WebM first with H.264 fallback** — modern browsers get the 1.0 MB file, everything else falls back to 1.95 MB. Files written to `public/hero/`, all decoding cleanly with frame counts identical to source (137 desktop / 129 mobile):

| File | Size | Note |
|---|---|---|
| `hero-loop.webm` | 1.01 MB | VP9 1080p — primary |
| `hero-loop.opt.mp4` | 1.95 MB | H.264 1080p — fallback |
| `hero-loop-mobile.webm` | 0.62 MB | VP9 portrait 1080×2340 |
| `hero-loop-mobile.opt.mp4` | 1.15 MB | H.264 portrait — fallback |
| `hero-poster.webp` | 74 KB | was 238 KB JPG |
| `hero-poster-mobile.webp` | 51 KB | was 117 KB JPG |

Desktop payload **6.21 MB → 1.09 MB (−83%)**; mobile **4.69 MB → 0.67 MB (−86%)**. The originals are untouched, so this is reversible.

Markup to use when the video hero is wired back in:

```html
<video poster="/hero/hero-poster.webp" muted loop playsinline preload="metadata" autoplay>
  <source src="/hero/hero-loop.webm" type="video/webm" />
  <source src="/hero/hero-loop.opt.mp4" type="video/mp4" />
</video>
```

`preload="metadata"` (not `auto`) is the key change: the poster paints instantly and the video streams in behind it, instead of the browser pulling the whole file before anything else can load. Faststart is already correct on these files, so progressive playback works.

1. ~~Re-encode to VP9/WebM with an H.264 fallback~~ — **done, above.**
2. Change `preload="auto"` → **`preload="metadata"`** on both videos, and keep the poster as the instant first paint.
3. **Lazy-load `journey.mp4`** (IntersectionObserver, load when it approaches the viewport) — saves 2.65 MB upfront.
4. Convert the remaining live PNGs to WebP (`contact-section-bg` 1.8 MB → 60 KB, `dataportfolio` 1.05 MB → 20 KB).
   *Combined 1–4: ~12.25 MB → under 2 MB.*

### Stage 2 — Perceived speed (do first; biggest win per unit of effort)

1. **Tie the reveal to the wordmark animation finishing (~600ms), not a guessed 700ms timer**, and **delete the dead `ds2:videoready` plumbing** (or wire it to a real readiness signal). This keeps the brand moment fully intact and removes only the unaccounted slack plus the misleading dead code.
2. **Shorten the fade from 850ms → ~250–300ms** and unmount on the same timer instead of a second one. A 250–300ms ease-out still reads as an intentional cinematic dissolve; only the long, barely-moving tail goes.
   *Combined 1+2 expected: ~1.2–1.3s → ~0.85s on a fast machine; ~2.1s → well under 1s on a throttled one.*
3. **Show the preloader once per session**, and move it to the root layout as its own comment intends, so returning to the homepage from /about or /portfolio is instant (currently it replays the full sequence every time).
4. **Kill the apex→www redirect** — point the apex at the app directly in Vercel (or serve the apex as canonical).
   *Expected: −330ms FCP, zero code risk.*

**Optional, and a design call for the founders:** if a sub-500ms reveal is wanted, the wordmark draw itself would need to speed up (e.g. `ds2-draw` 0.4s → 0.25s). That changes the brand animation's pacing, so it is deliberately not bundled into the mechanical fixes above.

### Stage 3 — Hero runtime

4. Render only the visible coverflow cards (~3–5) plus neighbours; lazy the rest.
5. Apply `will-change` **only** to the moving card, on interaction, and remove it after.
6. Gate the hover-pop loop and the scroll listener on hero visibility (IntersectionObserver); detach when offscreen.
7. Raise the lerp stop threshold so the loop parks quickly.

### Stage 4 — Weight

8. Remove the unconditional gsap/ScrollTrigger import — do the title reveal in CSS, or load it lazily on first scroll into view (−92KB).
9. Serve only the active language's dictionary.
10. Move static sections to server components; adopt `next/image` for the hero and portfolio shots (responsive sizes for mobile).

### Stage 5 — Verify on the live domain

11. **Deploy the current build.** The live site is stale, so none of the above reaches visitors until it ships. Verify against the live domain (per house rule: green status ≠ live domain — confirm on ds2-consulting.com itself).

---

## Verification

Re-run `runtime-probe.mjs`, `real-scroll.mjs`, and `css-ablation.mjs` (in the session scratchpad) before/after each stage, at 1× and 4× CPU, against both local prod and live. Targets:

- Perceived ready **< 400ms** at 4× CPU (from 2,092ms)
- FCP **< 500ms** on the live domain (from 756ms apex)
- Zero frames >100ms during scroll at 4× CPU (from 28)
- CLS stays at 0

## Explicitly not doing

- Removing glassmorphism, shadows or blur — measured as ~0 cost, and it is the brand.
- Re-enabling Lenis smooth scroll (`duration: 1.15` would *feel* laggier, not faster).
