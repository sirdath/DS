# DS2, Design-cohesion spec: every tool onto one design system

*Date: 2026-06-28. Goal: make every product tool (Fama, Aegis, Argus, Plutus, Xenia, Panoptes, Presentations) and the admin read as **one** product, the way the dashboard does. This is a restyle/consolidation spec, not new features and not new tools. The recent colour pass aligned the palette; this fixes the deeper problem: the components themselves are bespoke per tool.*

---

## The problem (audited, not assumed)

Three things are fragmented today:

1. **Tokens are defined three-plus times.** `--ds2-*` (14 vars, dashboard), `--admin-*` (19, admin shell), `--ws-*` (15, products), plus Notes' `--wn-*` aliases. The *values* are already DS2 v2 and mostly agree; the problem is **N copies of the same palette**, which drift and make light-mode + future changes an N-place edit.
2. **The admin already disagrees with itself.** There are two card systems (`.admin-card` and `.ds2-card`), two header patterns, two button conventions. The "reference" isn't yet singular.
3. **Every tool reinvents the same primitives.** Each tool ships its own 40 to 60 component classes with **zero reuse** of any shared kit:

   | Tool | Own classes | Reinvents |
   |---|---|---|
   | Plutus | `.wp-*` ×61 | button, card, header, input, table, tag |
   | Aegis | `.wg-*` ×51 | card, input (+ score viz) |
   | Presentations | `.pb-*` ×43 | builder chrome, cards |
   | Argus | `.wr-*` ×39 | card, header, table |
   | Fama | own | card, chip, table (+ score/sentiment viz) |
   | Xenia | own | input, select, tag (+ chat thread) |
   | Panoptes | `.pv-*` (own `--pv-*` tokens too) | panel, controls, tooltip (+ the map) |

**Net:** a button in Plutus, a button in the dashboard, and a button in the funnel are three different pieces of CSS that happen to look similar. That is why the suite feels "close but not the same." Cohesion is not a colour problem any more; it is a **component-ownership** problem.

---

## The target: one system, three layers

The fix is the standard design-system shape, no novelty required.

**Layer 1, Tokens (one source of truth).**
Collapse `--ds2-*`, `--admin-*`, `--ws-*`, `--wn-*` into **one** canonical set, defined once on a root that wraps both admin and products. Keep the old names as **thin aliases** (`--ws-cta: var(--ds-accent)`) during migration so nothing breaks on day one, then delete the aliases per tool as each is migrated. The values don't change (they're already DS2 v2 per [DS2-design.md](../../.claude/skills/ds2-design/DS2-design.md) §2); we are de-duplicating, not recolouring. Light mode then becomes a **single** override block instead of three.

**Layer 2, Primitives (one shared kit).**
One component vocabulary that **everything** uses. The canonical set, distilled from the admin kit + DS2-design.md §7:

- **Button** (`primary` Ice-on-Space / `secondary` bordered surface / `ghost`; 40px, 44px touch; house-curve hover lift)
- **Card** (radius 14 to 16, 1px subtle border, dark inset top-highlight / soft light shadow)
- **Field** (Input / Select / Textarea: persistent label, 44px min, focus ring, reserved helper/error)
- **Table** (left text, right numbers with `tabular-nums`, sticky header, hairline rows)
- **Badge / Pill** (status: `color-mix` tint + solid label; always carries text, never colour-alone)
- **PageHeader** (mono eyebrow `DS2 · {Section}` + light-weight title + sub)
- **Section** (eyebrow + title + count header over content)
- **Tabs** (the products tool-nav pattern, already shared via ProductsTabs)
- **Stat / KPI** (tabular value + label + delta)
- **States** (Empty / Loading-skeleton / Error / Toast), one look for all

Ship this either as a shared CSS layer (`ds-*` classes in one stylesheet imported by admin + products) or as `@ds/ui` React components. **Recommendation: a shared CSS component layer first** (lower churn, no prop-API design, tools already render HTML), promote the hottest few to `@ds/ui` React components later if reuse demands it.

**Layer 3, Tool-specific (only what is genuinely unique).**
Each tool keeps a *small* bespoke stylesheet for the parts that are actually unique, and **builds them from Layer 1 + 2**: Xenia's chat thread, Panoptes' map canvas, Aegis/Fama's score gauges, Plutus' chase-list, the Presentations deck-builder canvas. These stay custom, but use the shared tokens and sit inside the shared Card/Section/Header chrome.

The success test, per tool: **delete the per-tool CSS file and the only thing that should break is the genuinely-unique viz** — everything else (buttons, cards, tables, inputs, headers, badges) should already be coming from the shared kit.

---

## Per-tool refactor plan

For each: what maps onto the kit, what stays bespoke, and effort. "Maps" = delete the bespoke class, use the shared primitive.

### The launcher + shell, **mostly done**
`.ws-grid` / `.ws-card` / the rail / ProductsTabs are already on `--ws-*` and aligned (colour pass + the app-tiles + the seamless rail). Action: fold `--ws-*` into the canonical tokens; adopt the shared Card so a launcher tile == a dashboard card. **Effort: low.**

### Argus (`.wr-*` ×39), **the proof tool**
Maps: `card → Card`, header → `PageHeader`, the weekly table → `Table`, status → `Badge`. Bespoke: almost nothing (it is a briefing + table). The cleanest first migration to prove the kit. **Effort: medium-low.**

### Fama
Maps: `card → Card`, `chip → Badge`, the review table → `Table`, header → `PageHeader`. Bespoke: the sentiment/score visual + the report layout (built from Card + tokens). **Effort: medium.**

### Xenia (chat)
Maps: `input/select → Field`, `tag → Badge`, the surrounding page → `PageHeader` + `Card`. Bespoke: **the chat thread** (message bubbles, typing state) is genuinely unique; restyle its colours/radii/spacing to tokens but keep its own CSS. **Effort: medium.**

### Aegis (`.wg-*` ×51)
Maps: `card → Card`, `input → Field`, the audit form → `Field` + `Button`. Bespoke: the **score gauges / result panels** (the Lighthouse-style readout) keep custom CSS, on tokens, inside shared Cards. 51 classes to retire. **Effort: medium-large.**

### Plutus (`.wp-*` ×61), **the heaviest**
Maps: `btn → Button`, `card → Card`, `head → PageHeader`, `input → Field`, `table → Table`, `tag → Badge` (it reinvents the *most* primitives, so it gains the most). Bespoke: the chase-list ranking + approval-queue interaction UI, on the shared Table/Card. 61 classes. **Effort: large.**

### Panoptes (`.pv-*` + its own `--pv-*` tokens)
Maps: fold `--pv-*` into the canonical tokens (it defines a *fourth* palette today); the side panel, controls, legend, tooltip adopt `Card`/`Field`/`Badge` and tokens. Bespoke: **the map canvas** (maplibre) stays untouched. Also resolves the off-brand `--pv-cta`/`--pv-cyan` properly at the token level. **Effort: medium.**

### Presentations (`.pb-*` ×43)
Two surfaces. The **builder** chrome adopts `Button`/`Card`/`Field`/`PageHeader`. The **public deck** (`/p/[token]`) is a deliberate scrollytelling design and already DS2-leaning; align it to the canonical tokens only, do not force it into the admin chrome (it is client-facing, full-bleed). **Effort: medium.**

### Admin, **close the loop last**
Once the kit exists, retire the admin's own duplication: `.admin-card` + `.ds2-card → Card`, the two header patterns → `PageHeader`, so the dashboard itself is built from the same primitives the tools now use. This is what makes the whole thing *provably* one system. **Effort: medium.**

| Tool | Effort | Bespoke kept |
|---|:---:|---|
| Launcher/shell | low | — |
| Argus | med-low | — |
| Fama | med | sentiment/score viz |
| Xenia | med | chat thread |
| Presentations | med | deck builder + the public deck |
| Panoptes | med | map canvas |
| Aegis | med-large | score gauges |
| Plutus | large | chase-list / approval queue |
| Admin (loop-close) | med | dashboard hero/calendar/ring |

---

## Sequencing

0. **Build Layer 1 + 2 once** (unified tokens + the shared primitive kit, with old names aliased). Nothing visibly changes yet; this is the enabling step.
1. **Argus** end-to-end as the proof: migrate it fully, delete `.wr-*`, confirm it looks identical-or-better and light mode still works. This validates the kit before scaling.
2. **Fama, Xenia, Presentations, Panoptes** (the medium tier).
3. **Aegis, then Plutus** (the heavy tier, most to gain).
4. **Close the loop on admin** (retire `.admin-card`/`.ds2-card` duplication).
5. **Delete the alias tokens** once every consumer is migrated.

One PR per tool: reviewable, revertible, and each ends with a per-tool **DS2 test** (clarifies? calm? hierarchy obvious? premium without glass? every layer working?) plus a light/dark check.

---

## Rules and risks (so the refactor stays safe)

- **Restyle only, never touch tool logic.** Each PR changes class names + CSS, not data flow or behaviour. The colour pass already proved this is safe to do mechanically.
- **Migrate, then delete.** Don't leave the bespoke CSS sitting dead next to the shared kit; remove `.wp-*`/`.wg-*`/etc. as each tool moves, or the fragmentation just doubles.
- **Light mode is the regression magnet.** Unified tokens fix it structurally, but check every tool in both themes; the tool CSS is where light mode broke before.
- **Protect the unique viz.** Chat, map, and gauges are the parts a careless "use the Card everywhere" pass would flatten. They stay bespoke, on tokens.
- **The public deck is not admin chrome.** `/p/[token]` is client-facing and full-bleed; cohere its tokens, not its layout.
- **Accessibility carries through:** every shared primitive ships the DS2 guarantees once (focus-visible ring, 44px targets, AA contrast, reduced-motion), so every tool inherits them instead of re-getting them wrong.

---

*Recommended first move: build the shared token + primitive layer, then migrate **Argus** as the proof (smallest surface, no unique viz). Once that lands clean, the rest is a cascade, one tool per PR. I can start on Layer 0 (the kit) whenever you want to green-light it.*
