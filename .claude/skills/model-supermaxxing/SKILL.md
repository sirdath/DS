---
name: model-supermaxxing
description: Turns the currently-running model into an orchestrator that decomposes an ambitious project into tasks, triages each by difficulty, and dispatches them to subagents on the cheapest-capable model (Haiku/Sonnet/Opus/Fable) — keeping the hardest architecture and synthesis work for itself. Use for large, end-to-end builds or any ambitious project with a lot of work to parallelize across models. Invoke with /model-supermaxxing.
user-invocable: true
metadata:
  version: "1.0.0"
  author: "Stel"
---

# Model Supermaxxing by Stel

**You — the model reading this right now — are the orchestrator.** Whatever model is active when this skill runs (Fable, Opus, Sonnet, Haiku) is the manager. Your job is not to do all the work yourself. Your job is to **break the project into tasks, route each task to the cheapest model that can do it well, run them in parallel where safe, and personally handle only the most ambitious work**: architecture, hard problem-solving, integration, and final synthesis.

The principle: **no overkill.** Don't burn a frontier model on renaming a button. Don't send a subsystem redesign to Haiku. Match the model to the difficulty.

The mechanism is real: the `Task`/`Agent` tool accepts a `model` override of `haiku`, `sonnet`, `opus`, or `fable`. Each subagent runs on the model you assign it.

---

## The capability ladder

From cheapest/fastest to most capable:

| Tier | Model | Built for |
|------|-------|-----------|
| 1 | **Haiku** | Trivial, mechanical, well-specified work. Boilerplate, config edits, copy tweaks, simple CRUD, renaming, formatting, single-file changes with a clear spec. |
| 2 | **Sonnet** | Moderate, self-contained work. A standard component, a normal feature, writing tests, a straightforward refactor, docs. |
| 3 | **Opus** | Complex work. Tricky algorithms, cross-cutting logic, debugging hard issues, designing a subsystem, security-sensitive code. |
| 4 | **Fable / You** | The most ambitious work. Overall architecture, key design decisions, integration of everything, and final review/synthesis. The orchestrator keeps this tier. |

You (the orchestrator) sit at the top of the chain. You may also dispatch an isolated, exceptionally hard subtask **up** to Fable as an agent even if you're Opus — but reserve that for genuinely frontier-level subproblems.

---

## Workflow

### 1. Understand the project
Read the request fully. Explore the codebase if one exists (Glob/Grep/Read). If scope, stack, or success criteria are ambiguous, ask a few sharp clarifying questions **before** decomposing — a bad task graph wastes the most money.

### 2. Decompose into a task graph
Break the work into concrete, self-contained tasks. For each task note: what it produces, which files it touches, and what it **depends on**. Independent tasks can run in parallel; dependent tasks form waves. Track the whole graph with `TodoWrite`.

### 3. Ask the user how to run it
Use `AskUserQuestion` to confirm two things before dispatching:

- **Routing mode** (pick per the project):
  - **Standard** — Trivial→Haiku · Moderate→Sonnet · Complex→Opus · Most-ambitious→You/Fable. The balanced default.
  - **Cost-aggressive** — Push work down: mechanical→Haiku, moderate→Sonnet, only genuinely hard→Opus, reserve You/Fable for very little. Maximizes savings.
  - **Quality-first** — Bias up: floor is Sonnet (skip Haiku), Opus for most real work, You/Fable for anything non-trivial. Fewer mistakes, higher cost.
- **Deploy mode:**
  - **Checkpoint** — Present the full task→model assignment plan and wait for approval before spawning. Pause at each wave boundary for a quick OK.
  - **Full A–Z deploy** — Autonomous. Triage and dispatch end-to-end, parallel where safe, only stopping for genuine blockers. Report at the end.

### 4. Assign a model to every task
Apply the chosen routing mode to the task graph. Be honest about difficulty — a task that *looks* small but has subtle correctness or security stakes belongs a tier up. A task that looks big but is repetitive and well-specified belongs a tier down.

### 5. Present the plan (or proceed)
If **Checkpoint**: show a table — `Task | Model | Why | Depends on` — and wait. If **Full A–Z**: post the table for transparency and continue.

### 6. Dispatch — parallel where safe
- Run **independent tasks concurrently**: issue multiple `Task`/`Agent` calls in a **single message** (one per task), each with its `model` set.
- Run **dependent tasks in waves**: finish a wave, integrate, then launch the next.
- Subagents start cold with **no memory of this conversation.** Every brief must be self-contained: the goal, exact files/paths, the stack and conventions, constraints, and a crisp definition of the deliverable ("Return the final code for X" / "Report what you changed and any follow-ups"). A vague brief sent to a cheap model is the main way this fails — spend your effort here.

### 7. Integrate & verify
Collect agent outputs. **You** do the integration and synthesis — wiring pieces together, resolving conflicts, ensuring coherence. Run builds/tests/linters (Bash) to verify. Anything broken gets either a fix by you or a re-dispatch with a sharper brief.

### 8. Final review
Do a final pass yourself, or spawn one Opus/Fable reviewer agent for a fresh-eyes check on the assembled result. Fix what it finds.

### 9. Report
Summarize: what was built, the task→model breakdown (who did what), verification results, and any follow-ups. This makes the efficiency win visible.

---

## Routing judgment — examples

- "Add a CRUD endpoint matching the 6 existing ones" → **Haiku** (pattern is established).
- "Build the settings page component" → **Sonnet**.
- "Design the caching layer and its invalidation strategy" → **Opus**.
- "Decide the overall architecture, then integrate all subsystems" → **You/Fable**.
- "Rename `userId` to `accountId` across the repo" → **Haiku**, even though it spans many files — it's mechanical.
- "Fix this intermittent race condition" → **Opus**, even though it's one file — it's hard.

## Rules of thumb
- **When unsure between two tiers, the deciding factor is correctness risk, not size.** Cheap models are great at volume, weak at subtlety.
- **Front-load context, not back-and-forth.** A precise brief to Sonnet beats a vague brief to Opus.
- **Parallelize aggressively, but never let two agents edit the same file at once.** Serialize anything that touches shared files.
- **You stay in the loop as integrator.** Subagents produce parts; you make them a whole.
- **Match brief length to model.** Cheaper models need more explicit, spelled-out instructions; capable models can be handed open-ended problems.
