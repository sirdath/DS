# Open-source UI & motion repos, DS curated index

*Compiled 2026-05-24. The vetted external libraries we pull UI patterns and motion from.*
*Pairs with the read-only internal [`packages/frontendmaxxing-reference`](../packages/frontendmaxxing-reference/) and the
[Trust-UI Playbook](brand/TRUST-UI-PLAYBOOK.md).*

## How we use these (hard rules)

1. **Own the code.** Prefer copy-paste / "you own it" libraries (shadcn-style) over heavy runtime deps.
2. **Port, don't import.** Bring a component into [`@ds/ui`](../packages/ui/) as a proper React + Tailwind component, wired through [`@ds/tokens`](../packages/ds-tokens/). Don't import `frontendmaxxing-reference` or paste vendor code straight into an app.
3. **Motion = GSAP** for movement (per house rule); Motion/CSS may own opacity/colour. Everything respects `prefers-reduced-motion`.
4. **Check the licence** before shipping (table below). MIT = safe to adapt. Brand logos (e.g. simple-icons) are *nominative use only*, fine for "Powered by", not for implying endorsement.
5. **Restraint** (Playbook §6): these libraries make it easy to over-animate. One signature moment, then calm.

---

## 1. Foundations, accessible, own-your-code primitives
The base layer. Start here for anything structural.

| Repo | What it is | Licence | Use for |
| --- | --- | --- | --- |
| **shadcn/ui** (`shadcn-ui/ui`) | Copy-paste Radix + Tailwind components you own outright. The 2026 default. | MIT | Our base component layer in `@ds/ui` |
| **Radix UI** (`radix-ui/primitives`) | Unstyled, fully-accessible behaviour primitives (dialog, popover, etc.) | MIT | When shadcn doesn't cover a primitive |
| **Base UI** (`mui/base-ui`) | New unstyled a11y primitives from MUI/Radix authors | MIT | Alternative to Radix for headless behaviour |
| **React Aria** (`adobe/react-spectrum`) | Adobe's hooks for bullet-proof accessibility | Apache-2.0 | Hardest a11y cases (date pickers, tables) |

## 2. Animated component collections, premium flair
Drama for heroes, marketing sections, backgrounds. **Port the effect, don't bulk-import.**

| Repo | What it is | Licence | Notes |
| --- | --- | --- | --- |
| **React Bits** (`DavidHDev/react-bits`) | 110+ animated text/background/UI bits; works with GSAP, Motion or Spring | MIT | Biggest creative set; great for hero text/bg moments |
| **Magic UI** (`magicuidesign/magicui`) | 150+ animated components for marketing/landing | MIT | Pairs with shadcn; marquees, beams, tickers |
| **Aceternity UI** | Framer-Motion-heavy dramatic effects (spotlight, 3D card, parallax) | Free (copy-paste) | Visually loud, use sparingly for gravitas |
| **Skiper UI** | Animation-friendly components on top of shadcn, Next-focused | Free (copy-paste) | Smooth-scroll cards, micro-interactions |
| **cult/ui**, **Animata**, **HyperUI**, **Eldora UI** | More copy-paste animated/Tailwind blocks | MIT / free | Grab-bag; verify each component's licence |

> Caution: these skew toward the generic "AI-startup" look the palette audit warned about. Use them as *ingredients*, restyle through our tokens so the result is DS2, not stock.

## 3. Motion engines

| Repo | What it is | Licence | Use for |
| --- | --- | --- | --- |
| **GSAP** (`greensock/GSAP`) | The standard for complex/timeline/SVG/scroll motion. **Now fully free incl. SplitText, MorphSVG, DrawSVG, ScrollTrigger** (Webflow open-sourced the plugins, 2025). Official `useGSAP()` React hook. | MIT-ish (free) | **Our default for movement.** Wordmark draw-in, scroll-scrub, timelines |
| **Motion** (`motiondivision/motion`, ex-Framer Motion) | React-first declarative animation; very fast; MIT | MIT | Component enter/exit, layout animations (where GSAP is overkill) |
| **AutoAnimate** (`formkit/auto-animate`) | One-line list/grid transitions | MIT | Cheap polish on dynamic lists |
| **React Spring** (`pmndrs/react-spring`) | Spring-physics animation | MIT | Natural springy micro-feedback |

## 4. Smooth scroll & scrollytelling

| Repo | What it is | Licence | Notes |
| --- | --- | --- | --- |
| **Lenis** (`darkroomengineering/lenis`) | Inertia smooth-scroll engine; 2026 industry standard | MIT | **Already in our hero**; pair with GSAP ScrollTrigger |
| **GSAP ScrollTrigger** | Scroll-driven reveals + scrubbing | free w/ GSAP | Section reveals, pinned/scrubbed heroes |

## 5. 3D · WebGL · interactive

| Repo | What it is | Licence | Use for |
| --- | --- | --- | --- |
| **React Three Fiber** (`pmndrs/react-three-fiber`) + **drei** (`pmndrs/drei`) | React renderer for Three.js + helpers | MIT | Interactive 3D heroes/scenes |
| **OGL** (`oframe/ogl`) | Tiny low-level WebGL | MIT | **Already powering our shader hero**, light-weight effects |
| **Theatre.js** (`theatre-js/theatre`) | Visual animation editor for R3F/DOM; bake to JSON | Apache-2.0 | Art-directed cinematic sequences |
| **Rive** (`rive-app/*`) | GPU vector interactive animations, runtime + editor | MIT runtimes | Logo/illustration micro-interactions at 120fps |
| **Spline** | Design-tool 3D with web runtime | Free tier (proprietary) | Fast 3D mockups (not OSS, note) |

## 6. Icons & brand assets

| Repo | What it is | Licence |
| --- | --- | --- |
| **Lucide** (`lucide-icons/lucide`) | Clean, consistent icon set (shadcn default) | ISC |
| **simple-icons** (`simple-icons/simple-icons`) | Brand/tech logos, **what our "Powered by" marquee uses** | CC0 (icons); brand marks = nominative use only |
| **Tabler Icons** (`tabler/tabler-icons`) | 5000+ outline icons | MIT |
| **Phosphor** (`phosphor-icons/core`) | Flexible weighted icon family | MIT |

## 7. Inspiration & "awesome" lists (not deps, for direction)
- **awesome-design-systems**, **awesome-rive**, curated example/resource lists.
- Galleries to study (not repos): Awwwards, Godly, Land-book, for premium/trust references when designing a section.

---

## Recommended DS2 stack (the shortlist)

For a premium, trustworthy, distinctive build:
- **Base:** shadcn/ui (+ Radix where needed) → ported into `@ds/ui`, themed via `@ds/tokens`.
- **Motion:** GSAP (movement, now free) + Lenis (scroll) + Motion (component enter/exit).
- **Flair (sparingly):** React Bits / Magic UI effects, restyled to DS2, never stock.
- **3D:** OGL (light) or R3F + drei (interactive) for a single hero moment.
- **Icons:** Lucide (UI) + simple-icons (tech logos).

Everything filtered through the Playbook: subtle, fast, deliberate motion; one signature beat; high contrast; reduced-motion honoured.

## Sources
- [14 Best React UI Component Libraries 2026 (Untitled UI)](https://www.untitledui.com/blog/react-component-libraries)
- [Best React UI Components 2026 (Aceternity)](https://ui.aceternity.com/guides/best-react-ui-components-2026)
- [GSAP, now free](https://gsap.com/) · [GSAP vs Motion (Motion docs)](https://motion.dev/docs/gsap-vs-motion)
- [React Bits (repo)](https://github.com/DavidHDev/react-bits) · [Lenis (repo)](https://github.com/darkroomengineering/lenis)
- [React Three Fiber (repo)](https://github.com/pmndrs/react-three-fiber) · [Theatre.js](https://www.theatrejs.com/) · [Rive](https://rive.app/) · [awesome-rive](https://github.com/rive-app/awesome-rive)
- [Best JS scroll/scrollytelling libraries 2026 (CSS Author)](https://cssauthor.com/best-javascript-scroll-animation-scrollytelling-libraries/)

## Studios to study (styling references)
- **Textura Agency**, https://github.com/textura-agency, strong, distinctive front-end styling; keep as a design/motion reference.
