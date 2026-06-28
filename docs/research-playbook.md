# Research playbook

How DS briefs and runs the research that opens every client engagement. This playbook sits underneath [POSITIONING.md §5 Step 1 (Context & External Analysis)](brand/POSITIONING.md#5-the-9-step-delivery-process) and Step 2 (Technical & Digital Assessment).

## Goal

Turn "we have a new client" into a **design brief with confident findings** before a single line of client-facing code is written.

Two parallel passes:
1. **Competitor research**, who else plays in this space, what they do well, where the gaps are
2. **Website research**, what the client's current site (if any) actually looks like, structurally

Both driven by Claude Code skills, both produce files under `apps/{client-slug}/public/research/{client-slug}/`.

## When to run

- **Day 1 of every new client engagement.** Before the kickoff call if possible, so the kickoff is grounded.
- **Before any rebuild proposal**, you can't propose changes to a site without having decomposed the current one.
- **On request during stewardship** if the client says "our competitor just launched X, should we do the same?", 30-minute targeted pass.

## Inputs needed from the client

Minimum:
- Client name + trading name
- Industry / vertical
- Geography (who's the audience, UK / EU / global?)
- Existing website URL (if any)

Nice-to-have:
- Known competitors (3–5 URLs), saves the discovery step
- Rough scale ("we're a 20-person SaaS" vs "we're a 2000-person manufacturer"), calibrates what "competitor" means
- Success metrics for the engagement, if we know what they're optimizing for, research can emphasize that dimension

## Process

### Step A, Invoke competitor-research
In Claude Code at repo root:

> *"Run competitor research for {Client Name}, in the {industry} industry. Known competitors: {URL1}, {URL2}, {URL3}."*

Runtime: 3–8 minutes depending on Firecrawl load. Output: `competitors.md` + `competitors.json`.

### Step B, Invoke website-research (if client has an existing site)
In a separate session (or after A finishes):

> *"Run website research on {client URL}."*

Runtime: 2–5 minutes. Output: `site-map.md`, `components-inventory.md`, `component-shopping-list.md`.

### Step C, Synthesis (human pass, 30 minutes)
Read both outputs. Write a one-page **Brief** at `apps/{slug}/public/research/{slug}/BRIEF.md` answering:

1. **What's the client's positioning opportunity?** (white space from competitor analysis)
2. **What's the site going to do structurally?** (the component shopping list, prioritized)
3. **What's the honesty moment?** (from Step 3 of the DS engagement pattern, what do we think the client has wrong today?)
4. **What's the hero treatment?** (premium motion pipeline? Standard hero? Something bespoke?)
5. **What's the chatbot scope?** (if one, what does it know, what's explicitly out of scope?)
6. **What are the three biggest risks?**

This brief becomes input to the kickoff call.

### Step D, Use it in the kickoff
The kickoff follows the Challenge-first pattern (POSITIONING.md §4):
- Diagnose & challenge → present the competitor landscape + current-site findings
- Say what creates risk → where is the client's current approach underperforming competitors?
- Present alternatives with reasoning → the three biggest options, with trade-offs
- Decision pause → give the client space to decide which direction to go

## Hygiene rules

- **Don't publish research reports on the client's public site.** They live under `public/research/` for agent convenience but must have `noindex` headers.
- **Don't include scraped competitor copy verbatim** in any client-facing deliverable. Summarize, attribute, paraphrase.
- **Don't skip grounding verification.** Two random claims per report must be checked against live DOM (Chrome DevTools MCP).
- **Don't let research go stale.** If an engagement runs more than 3 months, re-run both skills before any major delivery milestone.
- **Time-box synthesis to 30 minutes.** Longer means we're stalling, ship the brief and iterate.

## Confidence scoring convention

Every report header includes confidence, see the individual skill files for the formula. Threshold:
- **≥ 0.8** → ship with full confidence
- **0.6–0.8** → ship, flag any underweighted sections
- **< 0.6** → mark "preliminary" in the header, list explicit gaps, re-run with broader inputs before a paying-client engagement
