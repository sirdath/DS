# Web Interface Rules

Condensed, project-adapted from the **Vercel Web Interface Guidelines** by Rauno Freiberg
(https://vercel.com/design/guidelines · https://github.com/vercel-labs/web-interface-guidelines).
Apply these when building or reviewing any UI in this repo. These complement
[coding-style.md](coding-style.md) and the brand voice in [docs/brand/POSITIONING.md](../../docs/brand/POSITIONING.md).

## Interactions
- Full keyboard support (WAI-ARIA patterns); visible focus via `:focus-visible`; trap + restore focus in dialogs.
- Hit targets ≥24px (≥44px on mobile) even if the visual is smaller.
- Buttons keep their label while loading (show a spinner beside it, don't swap to "Loading…").
- Spinners/skeletons: ~150–300ms delay before showing, 300–500ms min display once shown (no flicker).
- Deep-link anything stateful — tabs, filters, pagination, expanded panels (anywhere you'd reach for `useState`).
- Optimistic UI: update immediately, reconcile on response, roll back on failure.
- Destructive actions need confirmation or an undo.
- `touch-action: manipulation` on interactive controls; `overscroll-behavior: contain` on modals/drawers.
- Use real `<a>`/`<Link>` for navigation — never a `<button>`/`<div>` that navigates.
- Announce async changes with polite `aria-live` (toasts, validation).
- Allow paste in every text field (incl. OTP/2FA).

## Animation
- Honour `prefers-reduced-motion` with a real reduced variant.
- Animate only `transform`/`opacity` (GPU); never `transition: all` — list the properties.
- Animate from the element's true origin (`transform-origin`); SVG: transform a `<g>` with `transform-box: fill-box`.
- Motion should clarify cause/effect or add intentional delight — not autoplay for its own sake; let input cancel it.

## Layout
- Align everything intentionally (grid/baseline/edge/optical centre); nudge ±1px when optics beat geometry.
- Prefer flex/grid/intrinsic sizing over JS measurement; let CSS handle wrap/flow.
- Test mobile, laptop, and ultra-wide; respect safe-area insets.
- Don't ship stray scrollbars — fix the overflow.

## Content & Typography
- Curly quotes (" "), real ellipsis (…), no widows/orphans, `&nbsp;` to keep units/terms together.
- `font-variant-numeric: tabular-nums` when numbers are compared/aligned.
- Never rely on colour alone for status — add a text label; every icon has an accessible name.
- Design every state: empty, sparse, dense, error — each with a next step / recovery path.
- Layouts survive short, average, and very long real content. Wrap brand/product/code in `translate="no"`.
- Format dates/numbers/currency to the user's locale.

## Forms
- Enter submits from a text input; in `<textarea>` use ⌘/⌃+Enter (Enter = newline).
- Every control has a clickable `<label>`; checkbox/radio hit target includes the label.
- Don't pre-disable submit — validate on attempt, show errors next to fields, focus the first error.
- Correct `type`/`inputmode`/`autocomplete`; disable spellcheck on emails/codes/usernames.
- Placeholders end with "…" and show an example pattern.

## Performance
- Test iOS Low Power Mode + Safari; profile with CPU/network throttling.
- Reserve space for media (explicit dimensions) to avoid layout shift; lazy-load below the fold, preload above.
- Preconnect to asset/CDN origins; preload + subset critical fonts.
- Keep mutations <500ms; batch DOM reads/writes; virtualize long lists (`content-visibility: auto`).

## Design polish
- Shadows in ≥2 layers (ambient + direct); combine border + translucent layer for crisp edges.
- Child `border-radius` ≤ parent, concentric.
- On tinted backgrounds, tint borders/shadows/text toward the same hue.
- Stronger contrast on `:hover`/`:active`/`:focus`.
- `<meta name="theme-color">` + `color-scheme: dark` on `<html>` so device UI matches a dark page.
- Avoid gradient banding (use a background image for fades, not a CSS mask).

## Copy (pairs with the brand voice)
- Active, action-oriented, second person: "Send a message", not "You will need to…".
- Specific button labels ("Save API key", not "Continue"); errors say how to fix, framed positively.
- Numerals for counts ("8 deployments"); space between number and unit ("10 MB").
