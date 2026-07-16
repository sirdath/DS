# Working on ds2-consulting.com

A practical guide to improving the DS2 site: where everything lives, how to run it,
what the rules are, and how a change gets from your laptop to the live domain.

Read [ONBOARDING.md](ONBOARDING.md) first if you haven't set up at all yet. This
guide assumes you're set up and want to actually change the website.

---

## ⚠️ Read this before you touch a branch

There is a branch called **`feat/site-refresh`** (commit `fbf96e0`) on the remote.
It is an **unfinished homepage rebuild that was never completed**.

**Do not merge it. Do not `git checkout` it and push. Do not "just finish it".**

It has already taken the live homepage down once. Its `page.tsx` is missing
`HeroVideo`, `ServicesCircle`, `PortalJourney`, `Preloader`, and `SiteFooter` — merging
it silently replaces the real animated homepage with a stripped placeholder. The live
homepage is the one on `main`.

If you think it should be revived, talk to Dath first. It stays unmerged until there's
an explicit decision.

---

## 1. What you're actually working on

This repo is a **monorepo** — several projects in one. The public website is one app
inside it:

```
DathStel/
├── apps/
│   ├── ds-site/          ← ds2-consulting.com lives here. This is your app.
│   └── inspo-gallery/    (side thing, ignore)
├── packages/             shared code (design tokens, UI, product engines)
└── docs/                 you are here
```

Everything below is inside **`apps/ds-site/`** unless stated otherwise.

The app is **Next.js 16 (App Router)** + **React 19** + **TypeScript** + **Tailwind 4**.

If App Router is new to you, the one rule that explains most of it: **a folder inside
`src/app/` becomes a URL**. `src/app/about/page.tsx` → `ds2-consulting.com/about`.
That's it.

---

## 2. Run it locally

```bash
node --version    # must be ≥ 20
pnpm --version    # 9.15.9

git clone https://github.com/sirdath/DS.git
cd DS
pnpm install

cp apps/ds-site/.env.example apps/ds-site/.env.local   # ask Dath for real values
pnpm --filter @ds/site dev
```

Open **http://localhost:3000**. It hot-reloads as you edit.

You do **not** need the `.env.local` values to work on the public site's design and
copy — the pages render fine without them. You only need them for the admin panel,
contact form delivery, and anything touching the database.

Useful commands (run from the repo root):

| Command | What it does |
| --- | --- |
| `pnpm --filter @ds/site dev` | Run the site locally |
| `pnpm --filter @ds/site lint` | ESLint |
| `pnpm --filter @ds/site check-types` | TypeScript check |
| `pnpm --filter @ds/site build` | Production build (catches what dev doesn't) |

**Run `check-types` and `lint` before you push.** CI runs them and will fail the PR.

---

## 3. The directory map

### The public site — `apps/ds-site/src/app/`

The homepage and its parts sit at the top level of `src/app/`:

| File | What it is |
| --- | --- |
| **`page.tsx`** | **The homepage.** 610 lines. Composes everything below. |
| `layout.tsx` | Wraps every page — fonts, `<head>`, global providers |
| `hero-video.tsx` | The hero (the big animated thing at the top) |
| `services-circle.tsx` | The rotating services section |
| `portal-journey.tsx` | The scroll-driven journey section |
| `preloader.tsx` | The loading animation |
| `contact-panel.tsx` | The contact slide-over + `ContactCTA` button |
| `site-footer.tsx` | Footer |
| `mobile-menu.tsx` | Mobile nav |
| `ds2-mark.tsx` | The DS2 logo mark (SVG) |
| `i18n.tsx` / `i18n-dict.ts` | **Bilingual system — see §5** |
| `home.css` | Homepage styles (702 lines) |
| `globals.css` | Global styles + design tokens (3,216 lines) |
| `themes.css` / `schemes.css` | Theme + colour-scheme variants |

### The other routes

| Folder | URL | Notes |
| --- | --- | --- |
| `about/` | `/about` | |
| `portfolio/` | `/portfolio` | |
| `tools/` | `/tools` | |
| `blog/` | `/blog` | |
| `products/` | `/products` | The product apps (Aegis, Argus, Fama, Plutus…) |
| `clients/`, `client-login/`, `p/` | client-facing | Password-gated client decks |
| **`admin/`** | `/admin` | **Internal dashboard. Not the public site — leave it alone unless that's the task.** |
| `api/` | — | Server routes (contact form, admin APIs) |

### Shared packages — `packages/`

- **`ds-tokens/`** — the design tokens (colours, spacing, motion). Source of truth.
- **`ui/`** — shared React components (`@ds/ui`).
- **`frontendmaxxing-reference/`** — **read-only inspiration library.** Never import from
  it directly; port what you need into `packages/ui/`.
- The rest (`aegis`, `argus`, `plutus`, `panoptes`, `fama`…) are product engines — not
  the marketing site.

---

## 4. How the homepage fits together

`page.tsx` is a **client component** (`"use client"` at the top — it runs in the
browser because it has animation and state). It imports each section and renders them
in order:

```
Preloader          → loading animation
nav                → logo, links, language toggle, contact CTA
HeroVideo          → the animated hero
ServicesCircle     → the three services
PortalJourney      → the scroll journey
(tools teaser)
ContactPanel       → the slide-over contact form
SiteFooter
```

**Want to change one section?** Edit that section's own file — not `page.tsx`.
`page.tsx` mostly just arranges them.

At 610 lines, `page.tsx` is already over our 500-line rule. If you're adding to it,
prefer pulling a section out into its own file rather than growing it further.

---

## 5. The rules that matter

These aren't bureaucracy — each one exists because breaking it caused a real problem.

### 🔴 The site is bilingual. Copy lives in ONE place.

The site ships **English and Greek**. All copy comes from **`i18n-dict.ts`** — not from
JSX. So:

**Never hardcode user-facing text in a component.** Add it to `i18n-dict.ts` in *both*
`en` and `el`, then read it via `useT()`:

```tsx
const t = useT();
<h2>{t.services.title}</h2>     // ✅
<h2>Our services</h2>           // ❌ breaks Greek
```

If you don't speak Greek well enough to write the copy, add the English, put a
placeholder in `el`, and flag it — don't skip the key.

### 🔴 Never hardcode colours, spacing, or motion timing

Colours flow: `packages/ds-tokens` → `--ds-*` variables → `@theme` block in
`globals.css` → Tailwind classes.

```tsx
className="bg-ink-950 text-accent"                  // ✅
style={{ background: '#050607' }}                   // ❌
transition: all 300ms ease                          // ❌
transition: opacity var(--ds-duration-base) var(--ds-ease-standard)   // ✅
```

Same for spacing (use the Tailwind scale) and motion (`--ds-duration-base`,
`--ds-ease-standard`).

### 🔴 Motion must respect `prefers-reduced-motion`

Every animation needs a reduced variant. Some people get motion sick; some just turn it
off. This is a hard requirement in the delivery checklist, not a nice-to-have.

### 🔴 Don't add a second UI system

We use Tailwind + shadcn primitives via `@ds/ui`. No Chakra, MUI, Mantine, styled-components.

### The brand voice

Sentence-case headlines. "You / we" language. Candid, not salesy. Avoid "innovation",
"synergy", "transformation", "guru". Full playbook: [brand/POSITIONING.md](brand/POSITIONING.md).

If you're writing client-facing copy, that document is the canon — you wrote most of
the thinking behind it, so trust it over my formatting.

---

## 6. How to actually make a change

```bash
git checkout main
git pull

git checkout -b feat/hero-copy-tighten      # or fix/…, refactor/…, docs/…

# ... edit ...

pnpm --filter @ds/site check-types
pnpm --filter @ds/site lint
pnpm --filter @ds/site dev                  # LOOK at it. Both languages. Mobile width.

git add -A
git commit -m "feat(site): tighten the hero headline"
git push -u origin feat/hero-copy-tighten
```

Then open a PR on GitHub. Commit style: `feat:` / `fix:` / `refactor:` / `docs:` /
`chore:`. Keep PRs under ~500 lines of diff; split if bigger.

**Before you say it's done, check it in both languages and at 375px width.** Most
regressions on this site are Greek text overflowing or a section breaking on mobile.

---

## 7. How it deploys — and the trap

**Pushing to `main` deploys to production.** There's no staging gate.

The trap, and it has bitten us: **there are TWO Vercel projects** watching this repo.
They both report green on a commit. **Only one of them owns `ds2-consulting.com`.**

So a green checkmark in GitHub does **not** mean the live site updated.

**Always verify the actual domain**, not the build status:

```bash
curl -s https://www.ds2-consulting.com | grep -c "hero--glass"   # >0 = animated homepage is live
```

Or just hard-refresh `ds2-consulting.com` and look at it.

Some context worth knowing: we're on **Vercel's free (Hobby) plan**, which is why the
setup is a bit fragile. It also can't deploy from a GitHub organisation — that's why
the repo is still under Dath's personal account.

---

## 8. Things that will confuse you if nobody says them

- **`trailingSlash: true`** — every URL needs a trailing slash. `/api/admin/brain`
  308-redirects to `/api/admin/brain/`. Matters if you're calling an API route.
- **`globals.css` is 3,216 lines.** Search before adding a rule; it's probably there.
- **`_site-chrome.tsx`** — shared nav/footer chrome, used by inner pages.
- **`$ecretAnalytics/`** — internal analytics view. Yes, really, with a `$`.
- **The `admin/` folder is a whole separate product** — a dashboard with an AI copilot,
  leads, calendar. Don't refactor it while doing website work.
- **Two remotes exist on Dath's machine** (`origin` is dead, `ds` is real). A fresh
  clone won't have that problem — yours will just be `origin`.
- **`.mcp.json`** registers Claude Code tooling for the repo, including the shared DS2
  brain. It needs `DS2_BRAIN_TOKEN` in your `~/.claude/settings.json` to work — ask
  Dath. Everything else works without it.

---

## 9. Good first improvements

Genuinely useful, low-blast-radius, and they'd teach you the codebase:

1. **Mobile pass on the homepage.** Open at 375px, find what breaks, fix it. High value.
2. **Greek copy review.** `i18n-dict.ts` says the Greek is "a first professional draft,
   review before treating as final" — you're better placed than anyone to fix that.
3. **Split `page.tsx`.** It's 610 lines; pull a section into its own file. Pure win.
4. **Reduced-motion audit.** Turn on "Reduce Motion" in macOS settings, load the site,
   see what still moves that shouldn't.

---

## 10. If you get stuck

- Something's broken on the live site → tell Dath immediately, don't debug in prod.
- Not sure if a change is safe to push → it's a 2-minute question, ask.
- Disagree with a design decision → say so. *"This creates risk because…"* — that's the
  house style, and it applies internally too.
