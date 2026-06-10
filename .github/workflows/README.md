# DS2 CI workflows

The automated quality layer for this monorepo. A deterministic gate (lint,
types, build) plus Claude-powered reviews that judge what a linter can't.

| Workflow | Trigger | What it does |
|---|---|---|
| `ci.yml` | every PR + push to `main` | Lint, type-check and build must all pass. The hard floor. |
| `claude-review.yml` | every non-draft PR | Claude reviews the diff against DS2's rules: logic bugs, EN/EL i18n parity, accessibility, token discipline, brand voice. Posts one comment. (Sonnet) |
| `claude-security.yml` | PRs touching `api/`, `middleware.ts`, `supabase/`, auth, env, workflows | Deep security pass — injection, secrets, RLS, rate limits, OWASP. (Opus) |
| `claude.yml` | `@claude` in any PR/issue/review comment | Interactive Claude with repo context. (Sonnet) |

## One-time setup (required for the Claude workflows)

The `ci.yml` gate works immediately. The three Claude workflows need:

1. **Install the Claude GitHub app** on the repo — run `/install-github-app`
   inside Claude Code, or add it from https://github.com/apps/claude.
2. **Set the token secret** — `CLAUDE_CODE_OAUTH_TOKEN`, as a repo or org secret:
   ```
   gh secret set CLAUDE_CODE_OAUTH_TOKEN --repo sirdath/DS
   ```
   Generate the token with `claude setup-token` (needs a Claude subscription).

Until both are done, the Claude jobs no-op or fail silently; `ci.yml` is
unaffected.

## Conventions

- **Skip a review** on a PR by adding the `skip-review` label, or open it as a
  draft.
- **Models** follow CLAUDE.md routing: Opus for the security deep-dive, Sonnet
  for everyday review and interactive.
- The Claude prompts live inline in each workflow and reference the repo's own
  rules (`.claude/rules/`, `i18n-dict.ts`, the brand playbook) — keep them in
  sync when those rules change.
