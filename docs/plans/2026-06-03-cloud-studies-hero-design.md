# Cloud-studies hero, design (2026-06-03)

## Goal
Replace the DS2 hero's warm studio backdrop with a **fully original white + periwinkle
cloud scene**, the existing 3D black-glass DS2 logo composited in front of it. Build
**three cloud variants** as comparable prototypes; user picks the winner; port winner
into `apps/ds-site`.

## Decisions (approved)
- **Rendering:** procedural **WebGL fragment shaders** (not CSS/SVG, not AI images), only
  route that gives animated, volumetric, original clouds in the same 3D space as the logo.
- **Constant:** same black-glass DS2 logo across all three, reflection env retuned warm →
  **cool periwinkle/white**, so only the clouds vary (clean comparison).
- **Where:** standalone `DS2-CONSULTING/cloud-studies/` (instant reload) → port winner.
- **Scope:** hero-only bake-off; whole-site background decided after a winner is chosen.

## Palette anchors (from ds-site globals.css)
- white `#ffffff` / `#fafafa`
- periwinkle accent `#6D5DD3`
- soft periwinkle `#B9B0EE`
- smoke `#9990F1`

## Variants
- **A · Soft dreamy haze**, low-contrast fbm, big soft periwinkle blooms on white, slow drift, airy.
- **B · Volumetric puffy**, lightweight raymarch through 3D fbm, white tops + periwinkle-shadowed undersides, depth.
- **C · Nebula / flowing smoke**, domain-warped flow noise, wispy periwinkle streaks drifting over white.

## Architecture (shared harness)
- One Three.js scene: large **background plane** (cloud `ShaderMaterial`, fills view) +
  glass DS2 logo in front → glass refracts/reflects the clouds; subtle parallax on tumble.
- `scene.js` builds renderer, cool periwinkle PMREM env, glass logo (TRACE extrude), draw-on
  intro + camera tumble, and `setCloud(fragment)` to swap the backdrop shader live.
- `shaders.js` exports the shared vertex + noise lib + three fragment shaders + palette uniforms.
- `index.html` = one page, A/B/C toggle (+ `?v=`), so variants compare instantly on the same logo.
- `prefers-reduced-motion` → static frame.

## Deliverable of this round
3 working variants on a toggle page + a screenshot of each, for visual comparison.
