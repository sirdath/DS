# DS2 Inspired Design System

> **Clarity, given depth.**
> A space-grey, optical-glass design language for premium product UI — DS2's brand (v2) expressed through a proven React + Tailwind 4 implementation. Drop this file into any project and tell the model "apply DS2 design" to brand a UI.

DS2 is a digital-solutions consultancy. The visual identity uses **transparency to reveal structure, not to decorate it**. The product feel: precise, intelligent, calm, quietly advanced. Monochrome authority first; cool spectral blue only as light, never as wallpaper.

This system is derived from two sources and is meant to be used together:
- **The DS2 v2 brand system** — colour, type, motion, material, accessibility law.
- **The Event Mapping Platform build** — the React 19 + Vite + Tailwind 4 (CSS-first `@theme`) implementation idioms that make it real: glass primitive, staggered reveals, `cn()` component kit, focus/reduced-motion discipline.

---

## 1. Design principles

1. **Reveal structure.** Translucency must clarify hierarchy or information. If a glass effect isn't doing structural work, delete it.
2. **Depth with restraint.** One dominant depth gesture per view (overlap, refraction, focus, shadow). Never stack more than three prominent translucent layers.
3. **Begin in monochrome.** Space → graphite → titanium → silver → fog → mineral. Add Ice blue only after the greyscale composition already works.
4. **Continuous geometry.** Large rounded volumes, smooth transitions, thin precise edges, disciplined rectangular grids. Curves feel *engineered*, not playful.
5. **Protect negative space.** Space is a premium material. Spacious layouts, strict alignment, ideas allowed to stand alone.
6. **Keep information stable.** Body copy and controls always sit on an opaque or controlled-contrast surface. Blur is never a substitute for hierarchy.
7. **Move slowly.** Motion suggests shifts in light, focus, depth, perspective. No bounce, elastic, spin, or permanent ambient motion.
8. **Usability outranks styling.** Glass is optional; every core workflow must remain complete in opaque mode.

**The DS2 test** (before shipping any screen): Does it clarify an idea? Does it feel calm and intentional? Is the hierarchy obvious at a glance? Would it still feel premium with the glass removed? Is every highlight, curve, and layer doing useful work? If any answer is no — simplify.

---

## 2. Colour

The identity begins in monochrome. Ice / Optical Blue describe **focus and action**, not decoration.

### Core ramp (theme-independent)

| Token | Hex | Role |
|---|---|---|
| Space | `#050607` | Deepest background, primary text on light |
| Graphite | `#111419` | Surface on dark |
| Glass Strong | `#252A32` | Raised surface on dark |
| Titanium | `#626872` | Secondary text on light / muted on dark |
| Silver | `#AEB4BD` | Secondary text on dark |
| Fog | `#DDE2E8` | Hairlines, dividers on light |
| Mineral | `#F7F9FB` | Background on light, primary text on dark |
| Ice | `#8DCBFF` | Interactive accent / focus on **dark** |
| Action | `#347FD1` | Mid blue, charts, secondary action |
| Action Deep | `#173B67` | Interactive accent on **light** |

### Semantic (always paired with a label or icon — never colour alone)

| Token | Hex |
|---|---|
| Success | `#43A47A` |
| Warning | `#C89245` |
| Danger | `#C96868` |
| Info | `#66A6DA` |

### Theme mapping

**Dark is DS2's signature product theme.** Light is the alternate.

| Role | Dark | Light |
|---|---|---|
| Background | Space `#050607` | Mineral `#F7F9FB` |
| Surface | Graphite `#111419` | White `#FFFFFF` |
| Raised surface | Glass Strong `#252A32` | `#F0F0F2` |
| Primary text | Mineral `#F7F9FB` | Space `#050607` |
| Secondary text | Silver `#AEB4BD` | Titanium `#626872` |
| Interactive accent | Ice `#8DCBFF` | Action Deep `#173B67` |
| Glass fill | `rgba(255,255,255,.07)` | `rgba(255,255,255,.62)` |
| Glass border | `rgba(255,255,255,.22)` | `rgba(17,20,25,.16)` |

### Colour law
- Normal text meets **WCAG AA 4.5:1**; large text and essential graphics meet **3:1**.
- Mineral-on-Space and Space-on-Mineral are the default reading pairs.
- Ice is for links and focus on dark fields — never for long body text, never for "success".
- Silver is supporting copy, not micro-copy.
- State and hierarchy never depend on transparency or colour alone.

---

## 3. Typography

- **Primary:** `Inter, "Segoe UI", Arial, sans-serif` — headlines, body, UI, reports.
- **Mono:** `"IBM Plex Mono", Consolas, monospace` — metadata, timestamps, versions, status labels, code, annotations. A supporting instrument, never the main voice.
- The DS2 logo is custom artwork — **never typeset it**.

### Weights
`300` cinematic display & large quotes · `400` body · `500` UI controls & emphasized body · `600` headings & nav · `700` rare short emphasis. **Prefer light display type over bold.**

### Scale (fluid)

| Token | Desktop | Mobile | Line height | Tracking | Use |
|---|---:|---:|---:|---|---|
| Display XL | 96px | 56px | 0.98 | `-0.045em` | Launch statement |
| Display L | 68px | 46px | 1.02 | `-0.045em` | Page hero |
| H1 | 48px | 36px | 1.08 | `-0.025em` | Page title |
| H2 | 36px | 30px | 1.12 | `-0.025em` | Section title |
| H3 | 26px | 23px | 1.18 | `-0.025em` | Subsection |
| Lead | 21px | 19px | 1.5 | `-0.012em` | Intro copy |
| Body | 16px | 16px | 1.6 | `-0.012em` | Default reading |
| Small | 14px | 14px | 1.5 | `-0.012em` | Supporting copy |
| Label | 12px | 12px | 1.3 | `0` | UI & metadata |
| Micro | 10px | 10px | 1.3 | `0` | Non-essential notation |

Uppercase mono metadata: tracking `0.12em`–`0.22em`.

### Type rules
- **Sentence case** for headlines. Never uppercase a sentence or long heading.
- Body lines 45–75 characters. Avoid centre-aligned paragraphs (centre is reserved for singular cinematic moments).
- No more than three sizes in an ordinary composition.
- On imagery, essential copy needs a solid or gradient contrast field.

---

## 4. Layout, grid & spacing

- **Desktop:** 12 columns · 24px gutter · 64px outer margin.
- **Tablet:** 8 columns · 20px gutter · 32px margin.
- **Mobile:** 4 columns · 16px gutter · 20px margin.
- Spacing scale is 4-based: `4 · 8 · 12 · 16 · 20 · 24 · 32 · 48 · 64`.
- Prefer one large form over many small forms. Asymmetry inside strict alignment. Crop forms boldly at the canvas edge. Pair rounded material forms with rectangular grids.

### Radius
`sm 8px` · `md 14px` · `lg 24px` (DS2 product scale). Cards/KPIs commonly `16px`; modals `24px`.

### Numeric tabular data
Use `font-variant-numeric: tabular-nums` (utility `.tabular`) for all KPIs, tables, and counts. Left-align text, **right-align numbers**, sticky headers for long tables.

---

## 5. Material & glass

Primary materials: smoked optical glass, space-grey aluminium, satin titanium, polished black glass. Secondary: clear liquid glass, frosted silver, diffused mineral white. Accent: atmospheric ice blue, fine cyan edge light, very subtle prismatic dispersion.

**Glass primitive rules**
- Blur is **optional and capped at ~24px** (`blur(20px) saturate(180%)` is the house value). Always ship an opaque fallback.
- Visible border on every translucent surface.
- Body copy never sits directly on unstable glass — add a contrast scrim.
- Honour `prefers-reduced-transparency`: glass collapses to the opaque surface colour.

```css
/* House glass primitive (dark default) */
.glass {
  background: rgba(255,255,255,.07);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border: 1px solid rgba(255,255,255,.22);
  box-shadow: inset 0 1px 0 rgba(255,255,255,.10), 0 8px 32px rgba(0,0,0,.40);
}
@media (prefers-reduced-transparency: reduce) {
  .glass { background: #111419; backdrop-filter: none; }
}
```

---

## 6. Motion

Character: **deliberate, physical, calm.** Motion reveals structure or communicates state — never decorates.

| Band | Duration |
|---|---|
| Micro feedback | 120–200ms |
| Component transition | 200–400ms |
| Editorial reveal | 600–900ms |
| Cinematic title | 1200–1800ms (hold ≥ 2.5s) |

**Easing**
- Standard `cubic-bezier(0.4, 0, 0.2, 1)`
- Reveal `cubic-bezier(0.22, 0.61, 0.36, 1)`
- Exit `cubic-bezier(0.4, 0, 1, 1)`
- House "Apple" curve (transitions/hover, from the platform build) `cubic-bezier(0.32, 0.72, 0, 1)`

**Signature behaviours**
- Type reveal: fade + ≤14px vertical travel. (House: `card-rise` = `translateY(8px)→0`, 480–520ms, staggered 30ms per child.)
- Glass shifts focus/light/parallax slowly; never floats continuously.
- Lines draw from origin toward the selected decision.
- **Reduced motion:** replace all translation/assembly with short opacity changes (`prefers-reduced-motion` collapses durations to ~0.01ms).

Avoid: glitch, bounce, elastic, spinning logos, aggressive zooms, liquid wobble, permanent ambient motion.

---

## 7. Components

All components: `40px` standard button height (`48px` prominent), `44px` minimum touch target, visible label + persistent helper/error on inputs, always-visible focus ring. Cards only when content has a distinct action or boundary; limit nested glass.

### Tailwind 4 token block — paste into `globals.css` / `index.css`

```css
@import "tailwindcss";

@theme {
  --font-sans: Inter, "Segoe UI", Arial, sans-serif;
  --font-mono: "IBM Plex Mono", Consolas, monospace;

  /* Dark = DS2 signature product theme */
  --color-bg-base: #050607;
  --color-bg-surface-1: #111419;
  --color-bg-surface-2: #161A20;
  --color-bg-surface-3: #252A32;

  --color-text-primary: #F7F9FB;
  --color-text-secondary: #AEB4BD;
  --color-text-tertiary: #626872;

  --color-border-subtle: rgba(255,255,255,.08);
  --color-border-default: rgba(255,255,255,.14);
  --color-border-strong: rgba(255,255,255,.22);

  --color-accent: #8DCBFF;          /* Ice — links & focus on dark */
  --color-accent-deep: #347FD1;     /* Action */
  --color-success: #43A47A;
  --color-warning: #C89245;
  --color-danger:  #C96868;
  --color-info:    #66A6DA;

  --color-glass-tint: rgba(255,255,255,.07);
  --color-glass-border: rgba(255,255,255,.22);

  --radius-sm: 8px;
  --radius-md: 14px;
  --radius-lg: 24px;

  --ease-ds2: cubic-bezier(0.32, 0.72, 0, 1);
  --focus-ring: 0 0 0 3px rgba(141,203,255,.45);
}

*:focus-visible { outline: 2px solid var(--color-accent); outline-offset: 2px; }

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: .01ms !important; transition-duration: .01ms !important;
  }
}
```

> For a **light** build, swap base/surface to `#F7F9FB / #FFFFFF / #F0F0F2`, text to `#050607 / #626872`, accent to Action Deep `#173B67`, borders to `rgba(17,20,25,.x)`.

### Button

Three variants, two sizes. `cn()` = clsx merge. Primary uses Ice on dark; lift on hover via the house curve.

```tsx
const base = 'inline-flex items-center justify-center gap-2 rounded-[10px] font-medium ' +
  'transition-colors disabled:cursor-not-allowed disabled:opacity-50';
const variants = {
  primary:   'bg-[var(--color-accent)] text-[#050607] hover:brightness-110 ' +
             'transition-[transform,box-shadow,filter] hover:-translate-y-px',
  secondary: 'border border-[var(--color-border-default)] bg-[var(--color-bg-surface-1)] ' +
             'text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-3)]',
  ghost:     'text-[var(--color-text-secondary)] hover:bg-white/[0.06] ' +
             'hover:text-[var(--color-text-primary)]',
};
const sizes = { sm: 'px-3 py-1.5 text-[12px]', md: 'px-4 py-2.5 text-[13px]' };
```

### Pill / tag

Soft tinted background derived from a single colour via `color-mix`. Bold solid text.

```tsx
<span
  className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
  style={{ color: c, background: `color-mix(in srgb, ${c} 14%, transparent)` }}
/>
```

### Stat / KPI card

Rounded `16px`, subtle border, hover lift `-translate-y-0.5` + soft shadow, `300ms` house curve. Value in tabular numerals at `26px/600`; icon in a `color-mix` 14% chip tinted with its accent.

### Surfaces
- **Card:** `bg-surface-1`, `1px` subtle border, radius `14–16px`, shadow `0 1px 2px rgba(0,0,0,.04)` (light) / inset top-highlight (dark).
- **Modal:** radius `24px`, `sheet-in` animation (`translateY(12px) scale(.99) → 0`, 320ms), dimmed `overlay-in` backdrop.
- **Input:** persistent label, `44px` min height, `--focus-ring` on focus, helper/error text always reserved.
- **Table:** left-align text, right-align numbers (`.tabular`), sticky header, hairline row borders.

### Signature utility animations (from the platform build)

```css
@keyframes card-rise { from {opacity:0; transform:translateY(8px)} to {opacity:1; transform:translateY(0)} }
.animate-rise { animation: card-rise 480ms var(--ease-ds2) both; }
.stagger > * { opacity:0; animation: card-rise 520ms var(--ease-ds2) both; }
.stagger > *:nth-child(1){animation-delay:30ms} /* … +30ms per child */

@keyframes page-in { from {opacity:0; transform:translateY(4px)} to {opacity:1; transform:translateY(0)} }
.animate-page-in { animation: page-in 320ms var(--ease-ds2) both; }
```

---

## 8. Graphic devices & iconography

- 12-column editorial grid; numeric identifiers `01 · 02 · 03`; **real** metadata in uppercase mono; thin structural rules and measured frames; one restrained optical-light path; glass capsules / lens forms as structural containers.
- **Annotation syntax:** `// NOTE` for context · `RISK -> ALTERNATIVE -> DECISION` for decision sequences · `STATUS / VERSION / DATE` for metadata · solid blue dot = current · hollow circle = available option · dashed line = provisional dependency.
- Icons: thin, precise line icons (e.g. **lucide-react**), `1.5px` stroke, sized to the type they label. No filled/cartoon icon sets.
- **Never fabricate technical metadata for atmosphere.**

## 9. Logo
- Only the official `black_DS2_logo.png` / `white_DS2_logo.png` are approved — every legacy iteration is dead.
- White logo on Space/Graphite/Optical Blue/photography; black logo on Mineral/Paper/Mist.
- Clear space ≈ one logo-stroke height. Min digital width `96px`; use the square avatar export below `96px`.
- Never stretch, rotate, outline, recolour, redraw, add shadow/bevel/glow/glass, typeset, or tile the mark.

---

## 10. Voice & copy

Sentence-case. Candid, collaborative, truth-teller — "you / we" language. Protective framing, never judgmental: *"this creates risk because…"*, never *"this is wrong."*

**Avoid:** "innovation", "synergy", unqualified "transformation", "guru", "ninja", fluff compound-nouns, generic-innovation-consultancy tone.

Feel: precise not clinical · premium not ornamental · advanced not futuristic · transparent not fragile · minimal not empty · confident not loud.

---

## 11. Do / Don't

**Do** — one clear focal idea · official logo artwork · keep technical details real · Ice & Optical Blue for focus/action only · believable optical architecture, glass, metal, systems · give direct language room.

**Don't** — legacy/generated/approximated logos · generic AI, cyberpunk, hologram, circuit imagery · fabricated interfaces/results/metadata · fill every surface with glass/blue/gradients/cards/animation · colourful glassmorphism dashboards · heavy blur behind body text · glossy toy-like 3D · neon cyberpunk lighting · direct imitation of Apple layouts.

---

### Reference stack (what this was built on)
React 19 · Vite · TypeScript · Tailwind 4 (CSS-first `@theme`, no `tailwind.config`) · `clsx` for `cn()` · `lucide-react` icons. Tokens live in `index.css` under `@theme`; components reference them via `bg-[var(--color-…)]`. Honour `prefers-reduced-motion` and `prefers-reduced-transparency` everywhere.
