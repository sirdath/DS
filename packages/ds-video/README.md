# `@ds/video` — DS2 marketing-video Remotion project

The programmatic-video package for DS2's identity / marketing videos. Compositions live in `src/compositions/`.

> **Separate from `packages/motion-editor`**, which handles the *scroll-scrubbed hero* frame-sequence pipeline (Flux → Veo → ffmpeg). This package is for **finished video assets** — the 60–90s identity reel, sales-deck cuts, LinkedIn / vertical exports.

## Status — 2026-06-06

✅ **Installed and rendering on the Mac.** `BriefToShipped` ships as the first finished reel.

```bash
cd packages/ds-video
pnpm dev          # opens Remotion Studio at http://localhost:3000
pnpm render:brief # → out/brief-to-shipped.mp4 (35s, 1920×1080)
```

> **Render notes (this machine):**
> - Invoke the local binary as `./node_modules/.bin/remotion …` (or `pnpm render:*`). Bare `npx remotion` can't resolve the workspace bin.
> - Concurrency is capped at **3** in `remotion.config.ts`. At 4+, the Chrome page-pool races and renders die with *"Visited …/index.html but got no response"*. Drop to 1 if a render ever fails to launch.

## Compositions registry

| ID | Concept | Status | Reference |
|---|---|---|---|
| `BriefToShipped` | C3 — Brief → Shipped (35s capability reel: web · AI · engineering shown as craft) | ✅ Rendered | this README · `src/compositions/BriefToShipped.tsx` |
| `DS2BrandReel` | C2 — DS2 Brand Reel (26s identity promo, method/voice) | ✅ Rendered | `src/compositions/DS2BrandReel.tsx` |
| `AntiConsultancyReel` | C1 — Anti-Consultancy Reel | Placeholder scaffold | [docs/library/04 §C1](../../docs/library/04-remotion-video-concepts.md#c1--the-anti-consultancy-reel-recommended) |

Add new concepts as separate `Composition` entries in `src/Root.tsx`.

### `BriefToShipped` — structure

A SaaS launch-style montage: one client brief becomes a live, fast, AI-equipped site — shown as **craft, not buzzwords**. A single browser window persists and morphs through the build, closing on the signature responsibility line.

| Scene | Beat | Caption |
|---|---|---|
| Brief | typed client brief + cursor | *"We need a new site. Maybe some AI?"* |
| Wireframe | page skeleton snaps in | First, the structure. |
| Code → UI | terminal writes; real UI assembles | Then we build it — properly. |
| AI stream | grounded assistant cites your sources | AI grounded in your data — not guessing. |
| Lighthouse | dial + 4 axes tick to 100 | Fast, accessible, measured. Every time. |
| Deploy | check draws, URL goes live | Shipped — and we don't walk away. |
| Close | signature line + DS2 wordmark | *"We take responsibility for what we build."* |

Captions are baked in for muted feed autoplay.

#### Sound design

Per-beat SFX live in [`src/components/SfxTrack.tsx`](src/components/SfxTrack.tsx) — one cue map (frame → sound → volume) layered as `<Audio>` tracks. Restrained and cinematic: real keyboard typing, soft whooshes on transitions, clean interface clicks, a riser → confirmation for the Lighthouse beat, and one deep impact for the ship. All assets from **[Mixkit](https://mixkit.co/license/#sfxFree)** (free for commercial use, no attribution) in [`public/sfx/`](public/sfx/) — see `public/sfx/SOURCES.md`.

| Sound | Used for |
|---|---|
| `whoosh` / `whoosh-soft` | scene transitions · window appearing · the close |
| `type` | real laptop keyboard under the brief + code (trimmed per scene) |
| `click` | structure blocks snapping · UI reveals · source chips · deploy log |
| `send` | user sends the AI message · URL flips to live |
| `notify` | AI reply arrives |
| `riser` + `confirm` | Lighthouse dial filling → perfect-score chime |
| `impact` | deploy check lands (shipped) + soft logo-reveal sting |

The render mixes these to a stereo AAC track automatically. To retune, edit the `vol` / `at` values in the cue map and re-render — frames map to the timeline constants in `BriefToShipped.tsx`. A licensed instrumental music bed can be layered later as one more `<Audio loop>` under the whole composition (see docs/library/04 §asset-list).

## Render

```bash
pnpm render:reel                                                      # default: AntiConsultancyReel → out/anti-consultancy-reel.mp4
pnpm render <CompositionId> out/<file>.mp4                            # any composition
pnpm render AntiConsultancyReel out/reel-vertical.mp4 --height 1920 --width 1080   # vertical cut
```

For length cuts (16:9 / 1:1 / 9:16), define separate Compositions in `Root.tsx` rather than CLI overrides — easier to version.

## Production order (when concept + script are locked)

1. Lock the concept (currently: C1, see `docs/library/04`)
2. Write the script (~180 words for 60s)
3. Storyboard 8–12 keyframes (Figma or paper)
4. Record / source voiceover
5. License music + sound design
6. Build composition (here)
7. Render the master + cuts
8. Deploy:
   - Homepage hero (with poster fallback)
   - LinkedIn pinned post
   - Sales deck slide 1

## Brand tokens

Pull from `@ds/tokens` once installed:

```ts
import { colors } from "@ds/tokens";
const PURPLE = colors.brandPurple;
```

For now the scaffold has hardcoded values — replace when the package is wired up on the Mac.

## Fonts

Use `@remotion/google-fonts` for type that renders consistently across machines:

```ts
import { loadFont } from "@remotion/google-fonts/Inter";
const { fontFamily } = loadFont();
```

## Render pipeline (later)

Once compositions are stable, render in CI (Vercel cron / GitHub Actions / Lambda) so length cuts regenerate automatically when content changes. See Remotion docs on `remotion lambda` for serverless rendering.
