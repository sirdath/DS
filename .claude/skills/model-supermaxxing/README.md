# Model Supermaxxing

A Claude Code skill that turns **whatever model you're currently running** into an **orchestrator**. Instead of doing every part of an ambitious project itself, the orchestrator decomposes the work, triages each task by difficulty, and dispatches tasks to subagents on the **cheapest model that can do them well** — keeping only the hardest architecture and synthesis work for itself.

> The principle: **no overkill.** Don't burn a frontier model on renaming a button. Don't send a subsystem redesign to a small model. Match the model to the difficulty.

## Why

Ambitious, end-to-end projects contain a mix of trivial, moderate, and genuinely hard work. Running all of it on a top-tier model is slow and expensive; running all of it on a cheap model is unreliable. This skill routes each task to the right tier and parallelizes the independent ones.

## The capability ladder

| Tier | Model | Built for |
|------|-------|-----------|
| 1 | **Haiku** | Trivial, mechanical, well-specified work — boilerplate, config, copy tweaks, simple CRUD, renames, formatting. |
| 2 | **Sonnet** | Moderate, self-contained work — a standard component, a normal feature, tests, a straightforward refactor, docs. |
| 3 | **Opus** | Complex work — tricky algorithms, cross-cutting logic, hard debugging, subsystem design, security-sensitive code. |
| 4 | **Fable / Orchestrator** | The most ambitious work — overall architecture, key design decisions, integration, and final synthesis/review. |

The deciding factor between tiers is **correctness risk, not task size**: a one-file race-condition fix goes to Opus; a 30-file mechanical rename goes to Haiku.

## How it works

1. **Understands** the project — explores the codebase, asks sharp questions if scope is fuzzy.
2. **Decomposes** the work into a task graph with dependencies.
3. **Asks you two things** at runtime:
   - **Routing mode** — `Standard` · `Cost-aggressive` · `Quality-first`, chosen per project.
   - **Deploy mode** — `Checkpoint` (approve assignments, pause at each wave) vs. `Full A–Z` (autonomous, report at the end).
4. **Routes** each task to a model tier per the chosen mode.
5. **Dispatches in parallel** where safe — independent tasks batched together, dependent tasks in waves, never two agents editing the same file at once.
6. **Integrates itself** — the orchestrator wires the parts together and owns the final review.
7. **Verifies** (build / test / lint) and **reports** the task→model breakdown so the efficiency win is visible.

The mechanism is real: each subagent runs on a per-agent `model` override (`haiku` / `sonnet` / `opus` / `fable`).

## Install

Clone into your Claude Code skills directory:

```bash
git clone https://github.com/Stel777/model-supermaxxing.git ~/.claude/skills/model-supermaxxing
```

Restart your Claude Code session, then invoke with:

```
/model-supermaxxing
```

## Usage

Run `/model-supermaxxing` on any ambitious, multi-part project. Pick your routing and deploy modes when prompted, and let the orchestrator fan the work out across models.

---

**Author:** Stel · **Version:** 1.0.0
