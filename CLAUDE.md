# CLAUDE.md — DS monorepo

This file is loaded into every Claude Code session in this repo. It's the compact operating manual: who we are, how we work, and the rules Claude must apply when writing or reviewing code here.

## Who we are

**DS** is a Digital Solutions Consultancy. **Athens–London based.** Two founders, both senior:
- **Head of Strategy & Consulting** — client relationships, commercial strategy, consulting engagements
- **Head of Engineering & Data** — architecture, engineering quality, data / ML, technical delivery

We serve clients three ways: **consulting-only**, **build-only**, or **end-to-end** — plus an optional monthly **Stewardship** phase after delivery. Full brand playbook: [docs/brand/POSITIONING.md](docs/brand/POSITIONING.md).

## How we work — Challenge-first, transparent delivery

This is the differentiator. Not "a value" — a **structured, repeatable workstyle**. Four beats in every engagement:
1. **Diagnose & challenge** — assess what's working, what isn't, what we'd do differently
2. **Say what creates risk** — always *"this creates risk because…"*, never *"this is wrong"*
3. **Present alternatives with reasoning** — critique paired with constructive alternative + trade-offs
4. **Decision pause** — *"You don't need to decide now. Take time — we're happy to proceed either way."*

When Claude writes copy for DS or client sites, keep the same rhythm. Protective framing, not judgmental.

## Signature sentences (do not deviate when writing DS marketing copy)
- *"We work best when we can be honest early — even if that means challenging the initial idea."*
- *"Projects end; responsibility doesn't."*
- *"We don't certify your organisation — we take responsibility for what we build."*

## Monorepo layout

```
DATHSTEL/                                 # this repo — DS monorepo
├── apps/
│   ├── ds-site/                          # DS's own company site (Next.js 15)
│   └── {client-slug}/                    # one per client engagement (scaffolded by client-project-scaffold skill)
├── packages/
│   ├── ui/                               # shared React components (shadcn/Tailwind)
│   ├── frontendmaxxing-reference/        # read-only vanilla JS/CSS inspiration lib
│   ├── ds-tokens/                        # design tokens (colors/space/motion) — import, don't hardcode
│   ├── eslint-config/                    # shared ESLint 9 flat config
│   ├── tsconfig/                         # shared TS configs (base / nextjs / react-library)
│   ├── chatbot-core/                     # (Phase 2) Anthropic SDK wrapper w/ caching + RAG
│   ├── research-agents/                  # (Phase 2) Claude Agent SDK agents for competitor + website research
│   └── motion-sequences/                 # (Phase 2) Flux → Veo 3 → ffmpeg → WebP pipeline
├── templates/
│   └── client-starter/                   # (Phase 3) copied by client-project-scaffold
├── docs/
│   ├── brand/POSITIONING.md              # canonical brand playbook
│   ├── ONBOARDING.md                     # how Stelios (or any new contributor) gets set up
│   ├── SKILLS-AND-REPOS.md               # curated index of every skill/subagent/MCP/repo we use
│   ├── DELIVERY-CHECKLIST.md             # every client site must pass this before handoff
│   ├── research-playbook.md              # how to brief a client research engagement
│   └── PREMIUM-MOTION-PIPELINE.md        # Flux → Veo 3 → scroll-scrubbed hero recipe
├── assets/
│   └── motion-inspiration/               # user-supplied reference images for motion work
├── .claude/
│   ├── skills/                           # 24 skills (6 DS-specific incl. Stelios's model-supermaxxing + 18 adopted from CLAUDE-STUFF)
│   ├── agents/                           # 17 subagents (all adopted from CLAUDE-STUFF)
│   ├── commands/                         # /plan, /tdd, /code-review, /debug, /build-fix
│   ├── rules/                            # coding-style, security
│   └── hooks.json                        # pre/post tool-use hooks
└── CLAUDE.md                             # this file
```

## Default stack (use unless a client explicitly needs otherwise)
- **Next.js 15** App Router + **React 19** + **TypeScript 5.6+**
- **Tailwind 4** CSS-first config (`@import "tailwindcss"` + `@theme` in `globals.css` — no `tailwind.config.ts`)
- **shadcn/ui** component primitives
- **Supabase** (Postgres + Auth + Storage + pgvector) as the default backend
- **Anthropic SDK** (`claude-sonnet-4-6` default, Haiku 4.5 for lightweight, Opus 4.7 for premium) with prompt caching mandatory
- **Framer Motion** for interactions; **GSAP ScrollTrigger** for scroll-scrubbed motion sequences
- **Vercel** for deployment
- Monorepo glue: **pnpm workspaces + Turborepo 2**

## Workflow rules

### Research-first
Before writing a line of client-facing code, run:
1. **`competitor-research`** skill on the client's industry + 3–5 competitors
2. **`website-research`** skill on the client's current site (if they have one)

Both write into `apps/{client-slug}/public/research/{client-slug}/`. This isn't optional — it's Step 1 of the DS delivery process (POSITIONING.md §5).

### Token discipline
- Never hardcode colors. Import from `@ds/tokens` or use the mapped Tailwind classes (`bg-ink-950`, `text-accent`, etc.)
- Never hardcode motion durations. Use `--ds-duration-base`, `--ds-ease-standard`.
- Never hardcode spacing outside the Tailwind scale.

### Component discipline
- **First choice:** `@ds/ui` components
- **Second choice:** shadcn/ui MCP → install into `@ds/ui`
- **Port on demand** from `packages/frontendmaxxing-reference/` into `@ds/ui` — never import the reference package directly
- Don't introduce a second UI system (no Chakra/Mantine/MUI alongside shadcn)

### Copy voice (from POSITIONING.md §8)
- **Sentence-case headlines**
- **You / we** language — candid, collaborative, truth-teller
- **Avoid:** "innovation", "synergy", "transformation" (unqualified), "guru", "ninja", fluff compound-nouns
- **Never** publish a client-facing page that hasn't been passed through the `frontend-design` skill once (it's the brand guardrail)

### Research-agent output discipline
- Every research report must include a **confidence score** (per `competitor-research` skill)
- Reports with confidence < 0.6 ship with "preliminary" in the header and explicit gaps listed
- Two random claims per report must be verified against live DOM via Chrome DevTools MCP before publishing

### Delivery discipline
A client site cannot ship without passing [docs/DELIVERY-CHECKLIST.md](docs/DELIVERY-CHECKLIST.md). Non-negotiable items: Lighthouse ≥ 90 across all four axes, a11y keyboard path clean, motion respects `prefers-reduced-motion`, chatbot (if present) has cost tracking + grounding, deploy preview URL attached.

### Commits
Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`. No commit touches more than one package unless the change is genuinely cross-cutting.

### Secrets
Never commit `.env*` files, API keys, client brand assets predating a public announcement, or pre-launch client content to public branches. `.gitignore` catches the obvious ones; think twice before any new `apps/*/public/` content.

## Model routing (pick one per task)
- **Opus 4.7** — deep reasoning: architecture decisions, security audits, research synthesis, code review of anything touching auth/chatbot-core/research-agents
- **Sonnet 4.6** — everyday development: feature work, component building, debugging
- **Haiku 4.5** — quick tasks: renames, dependency checks, simple edits, single-file refactors

## MCPs (see `.mcp.json`)
Chrome DevTools · Playwright · shadcn/ui · Firecrawl · 21st.dev Magic · Supabase (already in session). Phase-2 additions: Figma, Storybook, Vercel, Sentry, fal.ai. Phase-4: Blender, MCP Three (deferred).

## What to open first in a new session

Depending on the task:
- **"Start a new client":** `.claude/skills/client-project-scaffold/SKILL.md` → then research agents
- **"Build / tune a UI":** `.claude/skills/frontend-design/SKILL.md`
- **"Add a chatbot":** `.claude/skills/chatbot-integration/SKILL.md`
- **"Design a hero motion sequence":** `.claude/skills/premium-motion-pipeline/SKILL.md`
- **"What skills / repos / MCPs do we have":** [docs/SKILLS-AND-REPOS.md](docs/SKILLS-AND-REPOS.md)
- **Onboarding Stelios:** [docs/ONBOARDING.md](docs/ONBOARDING.md)

## Rules I trust you to follow
1. Do what was asked — nothing more, nothing less
2. Prefer editing files over creating new ones
3. Read a file before editing it
4. Keep files under 500 lines — split if larger
5. Prefer simple solutions over clever ones (KISS, YAGNI, DRY)
6. If a hook fails, fix the root cause — don't `--no-verify`
7. Never add a feature, refactor, or abstraction beyond what the task requires

---

*Plan of record for the foundation work: [C:\Users\Dath\.claude\plans\before-we-do-anytihng-staged-hamming.md](C:\Users\Dath\.claude\plans\before-we-do-anytihng-staged-hamming.md). Update the plan when reality diverges from it.*
