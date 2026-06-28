# Premium motion pipeline

DS's cinematic hero-animation pipeline. Generates scroll-scrubbed image sequences that *feel* 3D without any runtime 3D. Much cheaper than React Three Fiber for non-interactive heroes; performs better on low-end mobile.

This is the **reference recipe**. The matching skill is at [`.claude/skills/premium-motion-pipeline/SKILL.md`](../.claude/skills/premium-motion-pipeline/SKILL.md), it's what Claude Code uses to orchestrate this pipeline.

---

## When we use it

- Client landing pages with premium-brand positioning (luxury, SaaS hero product reveals, high-end portfolios)
- Case-study pages where we want a "process reveal" moment
- DS's own site, once the brand identity is locked

We **don't** use it when:
- The client's brand is utilitarian / developer-facing, a tasteful static hero outperforms a half-finished scroll sequence
- The page needs interactivity (rotate-the-product, configurator), that needs real 3D, deferred to Phase 4
- Budget is tight and research hasn't confirmed the client has a premium-positioning opportunity

## Full pipeline (copy-pasteable)

### Step 1, Generate keyframe 1

Model: **Flux 1.1 Pro** via fal.ai.

Prompt pattern, physics-first, not vibe-first:

```
A [subject], shot at [distance: 80cm / 2m / wide establishing],
[angle: 3/4 left, slightly below eye-line / dead centre],
lit by [specific source: studio backlight from upper-left with
1 m softbox / golden-hour sun at 30° / overhead ring-light],
material: [matte black anodized aluminium with brushed finish /
polished obsidian glass / raw cream linen cloth].
Depth of field: [shallow f/1.8 / deep f/11].
Mood: [restrained, editorial / cinematic nocturnal / clinical morning].
Camera: [35mm / 50mm / 85mm equivalent].
```

Save as `keyframe-01.png`, 1920×1080 or square 1024×1024.

### Step 2, Generate keyframe 2

Same prompt template; change **only** camera position, product state, or focal depth. Keep lighting and material language identical, that's what makes the interpolation clean.

Save as `keyframe-02.png`.

### Step 3, Interpolate to video

**Primary:** Google **Veo 3.1** "first-last-frame to video" mode.
- Access: Gemini API / Vertex AI / fal.ai
- Output: 8 seconds, 720p–4K MP4
- Generation time: 11 s – 6 min

**Fallback:** Kling O1 dual-keyframe mode (fal.ai) if Veo 3 is gated or the specific scene fails.

Save as `motion.mp4`.

### Step 4, Extract frames

```bash
mkdir -p raw
ffmpeg -i motion.mp4 -r 15 raw/frame_%04d.png
# 15 fps × 8 s = 120 frames, the sweet spot
```

### Step 5, Compress

```bash
mkdir -p webp avif

# WebP (universal browser support via <picture>)
for f in raw/*.png; do
  name=$(basename "$f" .png)
  cwebp -q 85 "$f" -o "webp/${name}.webp"
done

# AVIF (smaller, served to modern browsers)
for f in raw/*.png; do
  name=$(basename "$f" .png)
  avifenc --min 30 --max 40 "$f" "avif/${name}.avif"
done

# Check budget
du -sh webp avif
# Target: webp ≤ 1.5 MB, avif ≤ 1 MB for 120 frames @ 1080p
```

### Step 6, Deliver

File layout:
```
assets/motion-sequences/generated/{client-slug}/{sequence-name}/
├── webp/frame_0001.webp … frame_0120.webp
├── avif/frame_0001.avif … frame_0120.avif
└── poster.jpg     # the first frame as a static fallback
```

In the Next.js app:
```tsx
// Preload hint (put in <head>)
{Array.from({ length: frameCount }).map((_, i) => (
  <link
    key={i}
    rel="preload"
    as="image"
    href={`/motion/hero/webp/frame_${String(i+1).padStart(4,'0')}.webp`}
    fetchPriority="high"
  />
))}

// Component (packages/motion-sequences/<ScrollFrameSequence />)
<ScrollFrameSequence
  client="acme-coffee"
  sequence="hero"
  frameCount={120}
  fallbackSrc="/motion/hero/poster.jpg"
/>
```

Mobile < 576 px: the component serves `poster.jpg` only, no scroll scrubbing.

### Step 7, Scroll-scrub with GSAP

```ts
// packages/motion-sequences/src/ScrollFrameSequence.tsx (simplified)
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
gsap.registerPlugin(ScrollTrigger);

// inside component effect
ScrollTrigger.create({
  trigger: triggerRef.current,
  start: "top top",
  end: "+=3000",
  scrub: 1,
  pin: true,
  onUpdate: (self) => {
    const idx = Math.round(self.progress * (frameCount - 1));
    drawFrame(idx); // canvas draw from preloaded Image[]
  },
});
```

Optional: pair with **Lenis** for buttery smooth scroll on desktop.

---

## Budgets + non-negotiables

| Dimension | Target | Hard limit |
|---|---|---|
| Total WebP sequence size | ≤ 1.2 MB | 1.5 MB |
| Total AVIF sequence size | ≤ 800 KB | 1 MB |
| Frame count (8 s hero) | 120 | 150 |
| Mobile behaviour | Static poster | Never scrubbed |
| Hero LCP image | Preloaded | ≤ 1.5 s |
| Motion respects `prefers-reduced-motion` | Yes | Non-negotiable |

## Cost per finished hero

Approximate, April 2026:
- Flux 1.1 Pro: ~$0.04 per image × 5 iterations × 2 keyframes = **~$0.40**
- Veo 3.1 (8s, 1080p): ~$1.50 per generation × ~4 iterations = **~$6**
- Kling O1 fallback: ~$0.80 per generation
- fal.ai platform fee: negligible
- ffmpeg + cwebp + avifenc: free
- Engineer time: **2–4 hours** of curation / iteration

Total: **~$5–15 in API calls** + engineer time. Compare to 20–80 hours of 3D artist work for comparable polish in R3F.

## Debugging common issues

- **Muddy interpolation**, keyframes have inconsistent lighting. Regenerate both with a more constrained prompt.
- **Judder on scroll**, not preloading all frames. Add the `<link rel="preload">` for every frame in `<head>`.
- **Mobile lag**, you're still scrubbing. Mobile < 576 px must fall back to static poster.
- **Build output huge**, WebP quality too high. Drop to `-q 80` and re-measure.
- **LCP > 2.5 s**, hero frame isn't preloaded with `fetchpriority="high"`, or the canvas is blocking paint. Render a static `<img>` of frame 1 first, then hydrate canvas on top.

## Open-source references

- https://github.com/olivier3lanc/Scroll-Frames, frame-sequence lib, lightweight
- https://github.com/finnursig/VideoScroller, minimal scroll scrub
- https://github.com/emanuelefavero/apple-scroll-animation, vanilla Apple-style implementation
- https://www.builder.io/blog/3d-gsap, GSAP + Veo 3 tutorial walking through the whole pattern
- https://ai.google.dev/gemini-api/docs/video, Veo 3.1 first-last-frame official docs

## Where this fits in DS

- Skill: [`.claude/skills/premium-motion-pipeline/SKILL.md`](../.claude/skills/premium-motion-pipeline/SKILL.md)
- Future lib: `packages/motion-sequences/` (Phase 2)
- Storybook showcase: `apps/storybook/` (Phase 2) will show one story per generated hero so clients can pick a style
- Reference imagery: [`assets/motion-inspiration/`](../assets/motion-inspiration/)
