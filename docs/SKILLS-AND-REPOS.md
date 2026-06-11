# Skills, agents, MCPs, and external repos — the curated index

This is the one-stop lookup for *"what do we have, where did it come from, and when do I use it"*. Keep it current — every new skill or repo addition should get a row here within the same PR.

---

## Claude Code skills (`.claude/skills/`)

Skills are prompt packages with YAML frontmatter that Claude Code auto-invokes based on their `description`. Total: **23** (18 adopted from [CLAUDE-STUFF](https://github.com/…/) + 5 DS-specific).

### DS-specific (5)

| Skill | Trigger | Purpose |
|---|---|---|
| [`frontend-design`](../.claude/skills/frontend-design/SKILL.md) | "build a component / page / site" | **The brand guardrail.** Upstream Anthropic skill enriched with DS overlay (POSITIONING.md rules, default stack, sentence-case headlines, honesty rhythm, token discipline). |
| [`competitor-research`](../.claude/skills/competitor-research/SKILL.md) | "research competitors for {client}" | Firecrawl-powered competitive-intelligence pass. Writes `apps/{slug}/public/research/{slug}/competitors.md`. |
| [`website-research`](../.claude/skills/website-research/SKILL.md) | "analyze {URL}" | Site IA + component decomposition. Writes `site-map.md`, `components-inventory.md`, `component-shopping-list.md`. |
| [`client-project-scaffold`](../.claude/skills/client-project-scaffold/SKILL.md) | "new client project for {name}" | One-shot client-engagement bootstrap. Creates `apps/{slug}/`, seeds research folder, opens delivery checklist. |
| [`chatbot-integration`](../.claude/skills/chatbot-integration/SKILL.md) | "add a chatbot to {X}" | Standard DS chatbot playbook. Anthropic SDK + prompt caching + RAG + Supabase + cost dashboard. |
| [`premium-motion-pipeline`](../.claude/skills/premium-motion-pipeline/SKILL.md) | "premium hero / scroll-scrubbed animation" | Flux 1.1 Pro → Veo 3.1 → ffmpeg → WebP → GSAP ScrollTrigger recipe. |
| [`blender-mcp-workflow`](../.claude/skills/blender-mcp-workflow/SKILL.md) | "blender / mantaflow / fluid sim / 3D animation for the website" | Hard-won field manual for driving Blender via `ahujasid/blender-mcp`. Save discipline, MCP call chunking, Mantaflow Python-API bugs (empty-cache symptoms, inflow keyframe traps), Blender 4.x Action API drift, GPU/OptiX setup, when to NOT use Blender for hero animations. |
| [`model-supermaxxing`](../.claude/skills/model-supermaxxing/SKILL.md) | `/model-supermaxxing` on any big multi-part build | **By Stelios** ([Stel777/model-supermaxxing](https://github.com/Stel777/model-supermaxxing)). Turns the running model into an orchestrator: decomposes the project into a task graph, triages each task by correctness risk, and dispatches to the cheapest-capable model (Haiku→Sonnet→Opus→Fable) in parallel waves — keeping architecture, integration and final review for itself. Routing modes: Standard / Cost-aggressive / Quality-first; deploy modes: Checkpoint / Full A–Z. |

### Adopted from [`CLAUDE-STUFF/.claude/skills/`](file:///C:/Users/Dath/OneDrive/Desktop/AntiGravity%20Stuff/CLAUDE-STUFF/.claude/skills/) (18)

Pruned: the 9 Remotion-contributor-only skills (those are for the Remotion open-source repo itself, not for *using* Remotion).

#### Development workflow (7)
| Skill | Purpose |
|---|---|
| `brainstorming` | Design-first ideation before any implementation |
| `writing-plans` | Break work into detailed, executable task plans |
| `executing-plans` | Execute plans task-by-task with checkpoints |
| `planning-with-files` | Manus-style file-based planning (task_plan.md / findings.md / progress.md) |
| `subagent-driven-development` | Dispatch a fresh subagent per task with 2-stage review |
| `using-git-worktrees` | Isolated workspaces for parallel development |
| `finishing-a-development-branch` | Merge / PR / discard decisions after work is done |

#### Code quality (6)
| Skill | Purpose |
|---|---|
| `coding-standards` | KISS / DRY / YAGNI + TS/React/Node specifics |
| `test-driven-development` | RED-GREEN-REFACTOR cycle enforcement |
| `tdd-workflow` | Full TDD methodology with coverage targets |
| `systematic-debugging` | 4-phase root-cause investigation (never guess-fix) |
| `requesting-code-review` | Pre-review checklist + reviewer dispatch |
| `verification-before-completion` | Verify claims with evidence before marking done |
| `api-design` | REST design patterns, pagination, validation |

#### Document + file creation (4)
| Skill | Purpose |
|---|---|
| `pdf` | Read, create, merge, split, OCR PDFs |
| `docx` | Create / edit Word documents |
| `pptx` | Create / edit PowerPoint presentations (pitch decks) |
| `xlsx` | Create / edit Excel spreadsheets (research data, cost models) |

#### Frontend + creative (2)
| Skill | Purpose |
|---|---|
| `web-artifacts-builder` | Complex React+Tailwind+shadcn HTML artifacts (client demos, pitches) |
| `algorithmic-art` | Generative art with p5.js (decorative motion backgrounds) |

#### Meta (2)
| Skill | Purpose |
|---|---|
| `mcp-builder` | Build custom MCP servers (we'll use this for per-client knowledge MCPs) |
| `skill-creator` | Create / evaluate / iterate on skills — how this library evolves |

---

## Subagents (`.claude/agents/`)

All **17** adopted from CLAUDE-STUFF. Invoked via the Task tool when a piece of work benefits from isolation + model routing.

### Core development (7)
| Agent | Role | Model |
|---|---|---|
| `planner` | Feature-implementation planning with worked examples | sonnet |
| `architect` | System design decisions, scalability | sonnet |
| `backend-developer` | Node.js / Python / Go backend specialist | sonnet |
| `frontend-developer` | React / Vue / Angular UI specialist | sonnet |
| `fullstack-developer` | End-to-end web application development | sonnet |
| `python-pro` | Python (typing, async, pytest, FastAPI) — for rare Python client work | sonnet |
| `typescript-expert` | Advanced TS patterns + strict-mode + generics | sonnet |

### Quality + security (5)
| Agent | Role | Model |
|---|---|---|
| `code-reviewer` | Security-first code review with language-specific patterns | opus |
| `security-reviewer` | Vulnerability detection (OWASP top 10) | opus |
| `security-auditor` | Deep security audit with compliance checks | opus |
| `tdd-guide` | TDD guidance for feature work | sonnet |
| `e2e-runner` | Playwright E2E test generation + execution | sonnet |

### Infrastructure + utilities (5)
| Agent | Role | Model |
|---|---|---|
| `build-error-resolver` | Fix build / type errors | sonnet |
| `refactor-cleaner` | Dead-code removal + cleanup | sonnet |
| `database-reviewer` | Postgres / Supabase schema + query review | sonnet |
| `devops-engineer` | CI/CD, Docker, cloud infra | sonnet |
| `multi-agent-coordinator` | Orchestrates the above on complex tasks | opus |

---

## Slash commands (`.claude/commands/`)

From CLAUDE-STUFF. Five commands registered:

| Command | Purpose |
|---|---|
| `/plan` | Start feature-planning workflow |
| `/tdd` | Start test-driven development workflow |
| `/code-review` | Run code review on current changes |
| `/debug` | Start systematic debugging workflow |
| `/build-fix` | Fix build + type errors |

---

## Rules (`.claude/rules/`)

Inline style + security rules loaded into every session:
- `coding-style.md` — conventions across languages
- `security.md` — OWASP quick reference + DS-specific rules (no secrets in committed files, RLS on Supabase tables, client-side API keys are forbidden)

---

## MCP servers (`.mcp.json`)

### Installed now (Phase 1)
| Server | Purpose |
|---|---|
| [chrome-devtools](https://developer.chrome.com/blog/chrome-devtools-mcp) | Agents can see what they built — DOM, console, network, perf |
| [@playwright/mcp](https://playwright.dev/docs/getting-started-mcp) | E2E tests + browser automation |
| [shadcn/ui MCP](https://ui.shadcn.com/docs/mcp) | Browse + install shadcn components via agent |
| [Firecrawl MCP](https://www.firecrawl.dev/) | Powers `competitor-research` + `website-research` |
| [21st.dev Magic](https://21st.dev/) | Component inspiration, already-installed in the user's session |
| [Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp) | Already-installed in the user's session |

### Install later
| Server | When | Purpose |
|---|---|---|
| [Figma MCP](https://help.figma.com/hc/en-us/articles/39888612464151) | Phase 2, when the first client brings a Figma design | Design-to-code handoff + token sync |
| [Storybook MCP](https://storybook.js.org/addons/@storybook/addon-mcp) | Phase 2, once `@ds/ui` passes ~20 components | Query design-system from agent |
| [Vercel MCP](https://vercel.com/docs/agent-resources/vercel-mcp) | Phase 3, first deploy | Deploy automation, env-var management |
| [Sentry MCP](https://mcpmarket.com/) | Phase 3, after first live client site | Production error querying |
| fal.ai MCP (or custom) | Phase 2, first premium-motion hero | Flux + Veo 3 + Kling access in one place |
| [Blender MCP](https://blender-mcp.com/) | Phase 4, when a client needs real-time 3D | Procedural 3D asset generation |
| [MCP Three](https://github.com/basementstudio/mcp-three) | Phase 4 | glTF → R3F JSX conversion |

---

## Upstream repos + references

### Directly copied-from / inspired-by
- [`AntiGravity Stuff/frontendmaxxing`](file:///c:/Users/Dath/OneDrive/Desktop/AntiGravity%20Stuff/frontendmaxxing) — vanilla JS/CSS component library. Verbatim copy in `packages/frontendmaxxing-reference/`.
- [`AntiGravity Stuff/CLAUDE-STUFF`](file:///c:/Users/Dath/OneDrive/Desktop/AntiGravity%20Stuff/CLAUDE-STUFF) — skills + subagents + commands + rules source.
- [`AntiGravity Stuff/DATH-PERSONAL-PORTFOLIO`](file:///c:/Users/Dath/OneDrive/Desktop/AntiGravity%20Stuff/DATH-PERSONAL-PORTFOLIO) — R3F + premium-motion reference for the eventual 3D unlock.
- [`D:/AEGIS`](file:///D:/AEGIS) — CrewAI + RAG + FastAPI + streaming + confidence-scoring reference for the research agents (reimplemented in TS via Claude Agent SDK, but the pattern is adopted).

### External — frontend
- [shadcn/ui](https://ui.shadcn.com/) + [shadcn monorepo template](https://ui.shadcn.com/docs/monorepo)
- [turborepo-shadcn-nextjs](https://github.com/gmickel/turborepo-shadcn-nextjs) — agency-grade Turborepo starter
- [Tailwind 4](https://tailwindcss.com/) CSS-first config
- [Framer Motion](https://www.framer.com/motion/)
- [GSAP ScrollTrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)
- [Lenis](https://github.com/darkroomengineering/lenis) — smooth-scroll library

### External — research + content
- [Firecrawl](https://www.firecrawl.dev/)
- [Exa](https://exa.ai/)
- [Jina Reader](https://jina.ai/reader)

### External — motion pipeline
- [Google Veo 3.1 docs](https://ai.google.dev/gemini-api/docs/video)
- [fal.ai](https://fal.ai/)
- [Flux 1.1 Pro](https://fal.ai/models/fal-ai/flux-pro)
- [Kling O1](https://fal.ai/models/fal-ai/kling-video/o1/image-to-video)
- [Scroll-Frames](https://github.com/olivier3lanc/Scroll-Frames)
- [apple-scroll-animation](https://github.com/emanuelefavero/apple-scroll-animation)
- [Builder.io GSAP + Veo 3 deep dive](https://www.builder.io/blog/3d-gsap)

### External — agents
- [Anthropic Claude Agent SDK](https://github.com/anthropics/claude-code)
- [Claude Code skill structure](https://github.com/anthropics/claude-code/blob/main/plugins/frontend-design/skills/frontend-design/SKILL.md) — the structural template every SKILL.md follows

### External — reference: other AI agents
- [Open Deep Research](https://github.com/nickscamara/open-deep-research)
- [LangChain Open Deep Research](https://github.com/langchain-ai/open_deep_research)
- [Market Research Agent](https://github.com/younis-ali/market-research-agent)

### External — 3D (deferred)
- [Blender MCP](https://github.com/ahujasid/blender-mcp)
- [MCP Three](https://github.com/basementstudio/mcp-three)
- [React Three Fiber + drei](https://github.com/pmndrs/react-three-fiber)

---

## How to add a new skill / MCP / repo

1. Add it
2. Add a row to the relevant table above
3. Update [CLAUDE.md](../CLAUDE.md) if it changes the default workflow
4. Mention it in the PR description so Stelios sees it in review
