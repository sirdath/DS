# `@ds/video` — DS2 marketing-video Remotion project

The programmatic-video package for DS2's identity / marketing videos. Compositions live in `src/compositions/`.

> **Separate from `packages/motion-editor`**, which handles the *scroll-scrubbed hero* frame-sequence pipeline (Flux → Veo → ffmpeg). This package is for **finished video assets** — the 60–90s identity reel, sales-deck cuts, LinkedIn / vertical exports.

## Status — 2026-05-29

🪛 **Scaffolded but not installed.** Built on the Windows machine pre-Mac-migration, intentionally without `pnpm install` (RAM-constrained). The moment you're on the M5:

```bash
cd packages/ds-video
pnpm install
pnpm dev          # opens Remotion Studio at http://localhost:3000
```

Then iterate on `src/compositions/AntiConsultancyReel.tsx`.

## Compositions registry

| ID | Concept | Status | Reference |
|---|---|---|---|
| `AntiConsultancyReel` | C1 — Anti-Consultancy Reel (v1 recommended) | Placeholder scaffold | [docs/library/04 §C1](../../docs/library/04-remotion-video-concepts.md#c1--the-anti-consultancy-reel-recommended) |

Add new concepts as separate `Composition` entries in `src/Root.tsx`.

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
