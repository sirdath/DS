# inspo — DS2 inspiration-fetch CLI

One tool, two lanes. Find and download reference imagery for the site + motion work.

| Lane | Source | Safe to ship? | Lands in |
|---|---|---|---|
| `stock` | Openverse (no key), Unsplash, Pexels | **Yes** — licence + author captured | `assets/inspiration/stock/<query>/` |
| `pinterest` | Your logged-in Pinterest (Playwright) | **No** — reference only | `assets/motion-inspiration/pinterest/<slug>/` (git-ignored) |

## Why two lanes

Pinterest has **no usable search API** and gates browsing behind login, so the only
way to pull from it is to drive a real browser with your own session — and everything
there is other people's copyrighted work. That's fine for a private moodboard, not for
a page. So anything that might actually ship comes from the **stock** lane, which uses
real licensed APIs and records the licence + author for every file in `sources.json`.

## Usage

```bash
# Licensed, publishable — Openverse needs no key
node scripts/inspo/inspo.mjs stock "blue hour architecture" --count 12
node scripts/inspo/inspo.mjs stock "minimal dark dashboard" --source unsplash --orientation landscape

# Private reference — opens a browser; log in once, it's remembered after
node scripts/inspo/inspo.mjs pinterest "https://www.pinterest.com/you/moodboard/" --count 40
node scripts/inspo/inspo.mjs pinterest "cinematic space grey ui" --count 30

node scripts/inspo/inspo.mjs --help
```

## Setup

- **Node 18+** (repo uses 24). The `stock` lane has **zero dependencies**.
- **Pinterest lane** needs Playwright, installed once:
  ```bash
  pnpm add -D playwright && pnpm exec playwright install chromium
  ```
  **Public search queries work logged-out** (even `--headless`). For a specific
  **board URL** or richer results, sign in: run without `--headless` once, a Chromium
  window opens, log into Pinterest there. The session is saved to `~/.ds2-inspo-chrome`,
  so every later run can use `--headless`.
- **Optional keys** for the stock lane (free tiers), in your shell or `.env`:
  - `UNSPLASH_ACCESS_KEY` — unsplash.com/developers (50 req/hr)
  - `PEXELS_API_KEY` — pexels.com/api (200 req/hr)
  - Openverse needs nothing.

## Output

Each run writes the images plus a `sources.json` (author, licence, source URL per file)
and a `READ-ME.txt`. The Pinterest lane also writes a **REFERENCE ONLY** notice and is
git-ignored so it can't leak into a public branch.

## Rights, plainly

- **stock** — credit per each file's licence (see `sources.json`). Openverse results are
  filtered to commercial + modification friendly by default.
- **pinterest** — moodboards only. Do not publish these on a DS2 or client site.
