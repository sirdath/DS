# MCP servers that need credentials (removed from `.mcp.json` for now)

These four servers were **removed from [`../.mcp.json`](../.mcp.json)** on 2026-06-04 because they require an account / authentication that isn't set up yet. The active config now contains only servers that work out-of-the-box.

To enable any of them: **(1)** create/sign-in to the account, **(2)** paste its block back into the `mcpServers` object in `.mcp.json`, **(3)** start a session, approve the new server, and run **`/mcp`** to authenticate in the browser.

All four use **browser OAuth** (not a stored API key), so nothing secret goes in the file, you just need the account and the one-time `/mcp` sign-in.

---

## 1. GitHub, PRs, issues, Actions
- **Needs:** a GitHub account (you have one, this is a git repo). Auth via OAuth on first use, or a Personal Access Token.
- **Get it:** PAT (optional) at https://github.com/settings/personal-access-tokens
- **Paste back into `.mcp.json`:**
```json
"github": {
  "type": "http",
  "url": "https://api.githubcopilot.com/mcp/"
}
```
- **Activate:** `/mcp` → authenticate GitHub. (PAT alternative: add `"headers": { "Authorization": "Bearer <PAT>" }`, but prefer OAuth.)
- **Why:** open/triage PRs, attach the deploy-preview URL your DELIVERY-CHECKLIST requires, drive Actions.

## 2. Sentry, production errors + Seer AI debugger
- **Needs:** a Sentry account + project (free tier exists).
- **Get it:** https://sentry.io → create a project, add the Next.js/Vercel SDK to the client app.
- **Paste back into `.mcp.json`:**
```json
"sentry": {
  "type": "http",
  "url": "https://mcp.sentry.dev/mcp"
}
```
- **Activate:** `/mcp` → authenticate Sentry (OAuth, read-only).
- **Why:** read prod exceptions with stack traces + traces, let Seer propose/verify fixes. Closes the "did my change fix it?" loop.

## 3. Vercel, deployment runtime logs
- **Needs:** a Vercel account (you deploy here, you have one).
- **Get it:** https://vercel.com (already in your stack).
- **Paste back into `.mcp.json`:**
```json
"vercel": {
  "type": "http",
  "url": "https://mcp.vercel.com"
}
```
- **Activate:** `/mcp` → authenticate Vercel (OAuth, read-only). Project-scoped variant: `https://mcp.vercel.com/<org>/<project>`.
- **Why:** pull a failing deployment's runtime logs (incl. `console.log`) to diagnose 500s / edge errors without copy-paste.

## 4. Stripe, payments / billing
- **Needs:** a Stripe account.
- **Get it:** https://stripe.com → Dashboard. (Local-key alternative: `npx -y @stripe/mcp --tools=all --api-key=sk_...` with a secret key in env.)
- **Paste back into `.mcp.json`:**
```json
"stripe": {
  "type": "http",
  "url": "https://mcp.stripe.com"
}
```
- **Activate:** `/mcp` → authenticate Stripe (OAuth).
- **⚠️ Safety:** this is **read + write** on real financial data. Enable human-confirmation on write tools, scope to least privilege, and never combine it with untrusted content-fetching MCPs in the same session.
- **Why:** query/manage customers, payments, subscriptions, invoices, for client billing + Stewardship retainers.

---

## Already keyed (kept in the config, for reference)
These need an API key but **yours are already set** via env vars, so they stay active:
- **firecrawl** → `FIRECRAWL_API_KEY` ✅ set
- **21st-dev-magic** → `TWENTYFIRST_DEV_API_KEY` ✅ set

## Other key-gated servers you might add later
Not in the config and not listed above, full install + credential details are in [`Claude Usable Stuff/mcp-and-tools-setup.md`](../../Claude%20Usable%20Stuff/mcp-and-tools-setup.md) and [`more-harnesses-and-mcps.md`](../../Claude%20Usable%20Stuff/more-harnesses-and-mcps.md). Highest-leverage:
- **fal.ai** (`FAL_KEY`), one server → Flux images + video + audio. The single best media-gen unlock. https://fal.ai
- **Recraft** (`RECRAFT_API_KEY`), text→SVG logos/icons. https://recraft.ai
- **ElevenLabs** (`ELEVENLABS_API_KEY`), voice/narration for Remotion. Free tier. https://elevenlabs.io
- **Linear** (OAuth), project management. https://mcp.linear.app/mcp
- **Exa** (`EXA_API_KEY`), neural web search/discovery. https://exa.ai
- **PostHog** (key), product analytics. https://posthog.com
