# Onboarding, first week at DS

For Stelios (and any future contributor). Work through this in order. Should take 2–4 hours total.

## 0. Get access

- [ ] GitHub collaborator access to [daththeanalyst/DS](https://github.com/daththeanalyst/DS)
- [ ] Anthropic API key (shared billing)
- [ ] Supabase org access (for client projects)
- [ ] Vercel team access (once we have one, Phase 2)
- [ ] Firecrawl API key
- [ ] fal.ai account (for the motion pipeline), optional until a client's hero needs it

## 1. Local setup

```bash
# Requirements
node --version   # ≥ 20
pnpm --version   # ≥ 9
git --version
gh --version     # optional but useful

# Optional for the motion pipeline
ffmpeg --version
cwebp -version
avifenc --help   # from libavif

# Clone
git clone git@github.com:daththeanalyst/DS.git
cd DS
cp .env.example .env.local    # fill in keys you've been given
pnpm install
```

Verify:
```bash
pnpm turbo build
pnpm --filter @ds/site dev
# open http://localhost:3000
```

## 2. Read the canon (30 minutes)

1. **[docs/brand/POSITIONING.md](brand/POSITIONING.md)**, every section. This is the company.
2. **[CLAUDE.md](../CLAUDE.md)**, how we use Claude Code here.
3. **[docs/SKILLS-AND-REPOS.md](SKILLS-AND-REPOS.md)**, what's available to you.
4. **[docs/DELIVERY-CHECKLIST.md](DELIVERY-CHECKLIST.md)**, what "done" looks like.

## 3. Install Claude Code + MCPs

Claude Code: https://docs.claude.com/en/docs/claude-code/overview

Once installed, in a terminal at this repo root:
```bash
claude mcp list
```
You should see: `chrome-devtools`, `playwright`, `shadcn-ui`, `firecrawl`, `21st-dev-magic`. If any are red, check `.env.local` for the missing key.

## 4. Dry-run the skills

In a Claude Code session at repo root, try these prompts one at a time:
- *"Scaffold a client project for Acme Coffee (cafe chain in Athens)"*, triggers `client-project-scaffold`. Verify an `apps/acme-coffee/` appears, then discard it.
- *"What does the premium motion pipeline look like end to end?"*, triggers `premium-motion-pipeline`. Verify it references Flux + Veo 3.1 + ffmpeg.
- *"Build me a hero section for a consulting landing page"*, triggers `frontend-design`. Verify it references `@ds/ui` and sentence-case headlines.

## 5. Read the reference codebases (optional but recommended)

These live outside DS but inform a lot of DS decisions:
- `c:\Users\Dath\OneDrive\Desktop\AntiGravity Stuff\DATH-PERSONAL-PORTFOLIO`, React Three Fiber + Framer Motion premium-site reference
- `c:\Users\Dath\OneDrive\Desktop\AntiGravity Stuff\CareerWebApp`, Next.js + Supabase + Anthropic integration reference
- `D:\AEGIS\agents\crew.py` + `D:\AEGIS\rag\retriever.py`, agent architecture reference (we're building the DS research agents in TypeScript via Claude Agent SDK, but the pattern carries)

## 6. Your first contribution

Pick one of these to commit within your first week:
- Fill in `@ds/tokens` with real DS brand colors + typography (once brand is decided)
- Port the **hero** component from `packages/frontendmaxxing-reference/components/` into `packages/ui/` as a React component
- Write `docs/brand/SERVICES.md` from the service descriptions in POSITIONING.md (Strategy & discovery / Web & app / Data & ML / Delivery / Stewardship)
- Add a first case study to the site (even a placeholder "Rebuild of our own site" works)

## 7. If you get stuck

- Bug / unclear behavior → open an issue on the DS repo
- Design / brand disagreement → discuss before committing, resolve on a short call
- Infra / account access → ping Dath

## House rules
- **Conventional commits:** `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`
- **Small PRs.** If the diff is > 500 lines, split it.
- **Research before code.** New client work starts with the two research skills. No exceptions.
- **Challenge-first.** If you disagree with a design decision, say so, that's the DS workstyle. *"This creates risk because…"*, not *"this is wrong"*.
- **Don't ship without the delivery checklist.** It exists for a reason.
