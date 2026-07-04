# DS2 marketing site — rebuild brief

Date: 2026-07-02 · Branch: `feat/site-refresh` · Companion: [content-inventory.md](content-inventory.md)

This is the plan and single source of truth for rebuilding the DS2 public marketing site
(ds2-consulting.com) from a clean sheet. The admin panel, product tools, and blog engine
are NOT rebuilt — only the public marketing shell + design. All content is preserved in
[content-inventory.md](content-inventory.md).

## Why rebuild (not patch)

- **Accreted clutter.** The homepage stacks a video-glass hero, a scroll-driven services
  circle, aurora-gradient surfaces on multiple sections, and a macOS-Mail contact widget —
  many competing effects, no visual rest. Founders' read: cluttered, laggy.
- **Off-brand accent.** The site uses periwinkle `#6D5DD3`; the DS2 system accent is blue
  (Ice / Action Deep), used sparingly for focus only. This drift is most of the "not-quite-DS2"
  feeling.
- **Dead weight.** ~300 lines of retired logo-hero code + a WebGL library were loading for
  nothing (already removed in Phase 1 on this branch).

Rather than keep patching, we rebuild the shell around the real brand system, keeping every
word of content.

## Brand foundation (authoritative — from docs/brand + the ds2-design system)

- **Idea:** "Clarity, given depth." Senior, calm, in control. We say what creates risk.
- **Monochrome-first.** Compose in greyscale: Space `#050607` → Graphite `#111419` →
  Titanium `#626872` → Silver `#AEB4BD` → Fog `#DDE2E8` → Mineral `#F7F9FB`. Add the blue
  accent only after the greyscale composition already works.
- **Accent = blue, for focus/action only.** Ice `#8DCBFF` on dark, Action Deep `#173B67`
  on light. Never body text, never "success", never wallpaper. (Retire periwinkle.)
- **Type:** Inter (sans) + IBM Plex Mono (metadata only). Sentence-case headlines, light
  display weights, three sizes max per view.
- **Negative space is a premium material.** Spacious layouts, strict alignment, one idea
  at a time.
- **Voice:** you/we, candid, challenge-first ("this creates risk because…"). Signature
  lines kept verbatim (see inventory): "We work best when we can be honest early…",
  "Projects end; responsibility doesn't.", "We don't certify your organisation — we take
  responsibility for what we build."
- **Motion:** deliberate, slow (house curve `cubic-bezier(0.32,0.72,0,1)`); honour
  `prefers-reduced-motion`; motion clarifies, never decorates.

## Design decisions (proposed — see "Open decisions")

- **Theme:** Light (Mineral `#F7F9FB` field, Space `#050607` ink, Action Deep accent).
  Matches the reference, the current base, and DS2 light-mode. Clean and editorial.
- **One accent, sparingly:** brand blue on the primary CTA + link/focus + one headline
  emphasis. Everything else greyscale.
- **Hero:** one cinematic image (a DS2-language plate — space-grey/blue-hour scene with a
  single ice-blue light; concepts already drafted) + a big two-tone headline as real HTML
  text over it + one sub-line + one CTA. No competing widgets. Static optimized AVIF/WebP
  first (fast); optional scroll-scrub later.
- **Rhythm:** one spacing scale (`--section-py`), generous. Fewer sections, more air.
- **Components:** a small, reused kit (nav pill, button, card, section header, footer) —
  built once, no per-section bespoke styling.

## New information architecture (leaner)

**Home** (single calm scroll):
1. **Nav** — floating pill: wordmark · Services · Work · About · Blog · one CTA · EN/EL.
2. **Hero** — cinematic plate + big headline + one sub + one CTA.
3. **Services** — the 3 categories (Brand Upgrade / Internal Rewiring / Custom Solution)
   as 3 clean cards, challenge-first framing, each links to detail.
4. **How we work** — the differentiator: the 4-beat challenge-first workstyle + the
   signature sentences. This is DS2's whole edge and deserves its own calm section.
5. **Featured work** — a few real projects, a clean list.
6. **Founders** — two senior people (trust), short.
7. **Contact** — one clean CTA / lightweight form (keep the Telegram wiring, drop the
   heavy mail-app skin).
8. **Footer** — minimal.

**Other pages** (rebuilt to match): `/about`, `/work` (portfolio), `/blog` (already clean),
`/tools` (already exists). The "powered by" stack and tools-teaser become optional, calmer
blocks or move to a subpage.

## What we keep vs rebuild

- **Keep (untouched):** admin panel, product tools, blog engine, all content/copy (EN+EL),
  assets (hero video/posters, logos, portfolio + tool images), the i18n system, the
  contact/Telegram backend.
- **Rebuild:** the marketing design system (tokens, components), the homepage sections,
  about + work page shells. Retire: periwinkle accent, aurora surfaces, the services
  circle, the mail-app contact skin, remaining dead effect code.

## Build phases (on this branch, visible on localhost + the preview URL)

1. **Foundation** — new clean token layer (light, brand blue, spacing/type scale) + the
   small component kit (nav, button, card, section header, footer). Nothing else changes yet.
2. **Home** — rebuild sections top to bottom against the kit, wiring the preserved copy.
3. **About + Work** — rebuild to match.
4. **Polish** — motion pass (calm, reduced-motion), Lighthouse, the real hero image.

Each phase is reviewable on localhost:3000 and the preview URL; `main` stays untouched until
the whole thing is signed off.

## Decisions (locked 2026-07-02)

1. **Theme:** Light (Mineral field, Space ink, Action-Deep blue accent).
2. **Hero:** Typographic first (big two-tone headline, one CTA, no image dependency);
   drop the cinematic plate in later.
3. **Scope:** New Home first, then iterate to About + Work.
4. **Language:** English first; wire Greek back in once the structure is locked.
