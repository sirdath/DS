---
name: ds2-design
description: Apply DS2's brand design system ("Clarity, given depth" — space-grey, optical-glass, Ice-blue, monochrome-authority product UI) to any web frontend. Use when the user runs /ds2-design or /DS2-design, asks to "apply DS2 branding/design", "make this look like DS2", "use our brand on this UI", or wants a new component/page/app styled in the DS2 design language. Pairs the DS2 v2 brand law with a proven React 19 + Tailwind 4 implementation kit.
metadata:
  version: "1.0.0"
  author: "DS2"
  github: "https://github.com/Stel777/DS2-design-skill"
---

# DS2 Design — brand application skill

Applies the **DS2 design system** to a frontend. The full, portable spec lives next to this file in [DS2-design.md](DS2-design.md) — it is the single source of truth for colour, type, motion, glass, components, and copy voice.

## When invoked

1. **Read [DS2-design.md](DS2-design.md) first, in full.** Do not work from memory — the tokens and rules there are authoritative.
2. Determine the target:
   - **New component / page / app** → build it directly in the DS2 language.
   - **Existing UI** → restyle it, mapping its surfaces/text/accents onto DS2 tokens. Don't rewrite logic; change styling and structure only.
3. Detect the stack and adapt:
   - **Tailwind 4** (preferred) → paste the `@theme` token block from §7 into the global stylesheet; reference tokens via `bg-[var(--color-…)]`. No `tailwind.config`.
   - **Tailwind 3 / other** → translate the tokens into the project's config or CSS variables, keeping the same values.
   - Plain CSS → emit the CSS-variable blocks from §2/§5/§7 directly.

## Defaults & decisions

- **Theme:** default to **dark** (Space `#050607` bg, Mineral text, Ice `#8DCBFF` accent) — DS2's signature. Use light only if the user/project clearly calls for it (then use Action Deep `#173B67` as the accent). If genuinely unsure which, ask once.
- **Accent discipline:** Ice / Optical Blue is for **focus and action only** — never body text, never "success", never wallpaper. Start every composition in monochrome and add blue last.
- **Glass:** optional and structural. Cap blur ~24px, always include an opaque fallback, honour `prefers-reduced-transparency`. Never put body copy on unstable glass.
- **Motion:** deliberate and slow (house curve `cubic-bezier(0.32,0.72,0,1)`); use the `card-rise` / `stagger` / `page-in` utilities. Always wire `prefers-reduced-motion`.
- **Type:** Inter (sans) + IBM Plex Mono (metadata only). Sentence-case headlines, prefer light display weights, three sizes max per ordinary view.

## Guardrails (from the DS2 brand law)

- Accessibility is non-negotiable: WCAG AA 4.5:1 normal text, 3:1 large; state/hierarchy never by colour or transparency alone; semantic colours always carry a label or icon.
- Usability outranks styling — every core workflow must remain complete in opaque mode.
- Use only the official logo artwork; never typeset, recolour, or decorate the mark.
- Don't fabricate technical metadata, results, or interface chrome for atmosphere.
- Avoid: colourful glassmorphism, neon/cyberpunk, heavy blur behind text, glossy toy-3D, generic-AI/circuit imagery, direct Apple-layout imitation.

## Finish

After applying, run **The DS2 test** from the spec (clarifies an idea? calm & intentional? hierarchy obvious? still premium without glass? every layer doing work?). If any answer is no — simplify. Briefly report what tokens/patterns you applied and any spots you simplified.
