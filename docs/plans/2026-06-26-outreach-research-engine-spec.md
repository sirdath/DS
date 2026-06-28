# Outreach Research Engine ("Peitho"), Build Spec (FINAL)

**Status:** Ready to build. Final handoff spec, all decisions locked (see §1). Written 2026-06-26.
**Relationship to other docs:** Extends and supersedes the parked
[2026-06-17-lead-outreach-research.md](2026-06-17-lead-outreach-research.md), which designed the
*email sender*. This doc designs the **deep-research brief engine** that feeds it (and feeds manual
calls). Build the brief engine first (Phases 1–3); the email sender (Phase 4) reuses Plutus.

> **For the implementing session:** every decision is locked, there is nothing to ask the user.
> Follow §1 (decisions) → §13 (build order). All code skeletons are grounded in existing files;
> match the surrounding style exactly (§1.7).

---

## 0. What we're building (one paragraph)

A new **`/admin/outreach`** tab. The admin picks a business from the existing `marketing_leads`
table, picks a model (Opus default / Sonnet cheap toggle), clicks **"Research"**, and the Anthropic
SDK runs a web-grounded research pass (web search) and produces a **structured, readable company
brief**: overview, what they do, ICP/customers, ranked pain points, market environment, competitors,
recent signals, a recommended outreach angle, and call talking points, each with a **confidence
score and cited sources**. The brief is stored (with full history) and rendered in the admin. From a
ready brief the admin can **(a) generate a personalised sales email** (Phase 4: Claude drafts using
the brief as grounding, fact-checked, approval-gated, sent via Resend, reusing the Plutus pipeline)
or **(b) read the talking points and call the business manually**.

It mirrors the proven **Plutus** architecture: a pure engine package (`@ds/peitho`) that owns the
Claude calls + cost accounting + fact-checking, and thin app-side wiring (Supabase table, an admin
page, server actions, a route handler) that owns auth, persistence, and UI.

---

## 1. Locked decisions (read before coding)

1. **Research data source = the Anthropic SDK's server-side web tools**, not Managed Agents, not a
   new scraping stack. Use `web_search_20260209` (and, in the deep profile only, `web_fetch_20260209`)
   on `client.messages.create`. Rationale: same `@anthropic-ai/sdk` already used by `@ds/plutus`,
   `@ds/aegis`, `@ds/argus`, `@ds/fama`, `@ds/xenia`; zero new infra; citations come back natively.
   (Firecrawl exists in `packages/argus/src/observers/firecrawl.ts` and can be added later; **not**
   required.)
2. **Two-stage Claude pipeline** (mirrors aegis/argus "gather facts → one structured call"):
   - **Stage A, Research** (`research()`): `client.messages.create` with the web tool(s) and an
     agentic continuation loop (handle `stop_reason: "pause_turn"`). Produces a cited dossier (text)
     + the list of sources the model actually consulted.
   - **Stage B, Synthesize** (`synthesizeBrief()`): a second call **with no tools** that takes the
     dossier + lead facts and emits the typed `CompanyBrief` JSON via
     `output_config: { format: { type: "json_schema", schema } }`. Toolless so structured output
     works cleanly (it can't combine with an active server-tool loop, and is incompatible with
     citations).
3. **🔒 Model routing, Opus 4.8 default, Sonnet 4.6 toggle.** Default both stages to
   **`claude-opus-4-8`** (deep reasoning, per [CLAUDE.md](../../CLAUDE.md) §"Model routing"). The
   research route accepts a `model` param (`"opus"` | `"sonnet"`); the UI exposes a per-run
   **fast/cheap** switch that maps `"sonnet"` → `claude-sonnet-4-6`. Store the chosen model on the
   brief row. Adaptive thinking + `effort` per the profile (§1.8).
4. **🔒 Storage, keep full history.** `outreach_briefs` is append-only: each research run inserts a
   new row; the newest *ready* row is marked `is_current = true`. There is **no** unique index on
   `lead_id`. A **failed** run never clears the previous good brief (it leaves the old `is_current`
   row intact). The UI shows the current brief and lets you browse prior runs.
5. **🔒 Granularity, one lead per research call; multi-select fires sequentially.** The route handles
   a single lead per request. For a multi-select, the client fires requests **one at a time**
   (await each before the next), gentle on rate limits + cost, each row showing its own spinner.
6. **Shape = admin-only, human-in-the-loop.** Briefs are generated on demand (not a cron spray).
   Email sends (Phase 4) stay approval-gated (Plutus CAS pattern). No tracking pixels.
7. **🔒 Code style by location** (match the surrounding files exactly):
   - **App code** under `apps/ds-site/src/app/**` → **no semicolons, single quotes** (see
     `leads-actions.ts`).
   - **Package code** under `packages/peitho/src/**` → **semicolons, double quotes** (see
     `packages/plutus/src/*`).
   - TS strict, no `any`, functional React, files < 500 lines, components < 200 lines
     ([coding-style.md](../../.claude/rules/coding-style.md)).
8. **🔒 Hosting / runtime, ship the 60s-safe "lean" profile by default; widen to "deep" on Vercel
   Pro.** The Vercel plan is unconfirmed, so the route defaults to `maxDuration = 60` and a **lean**
   research profile sized to finish under 60s. A single constant switches to the **deep** profile;
   when Pro is confirmed, also raise `maxDuration` to `300`. See §1.9. (Package name `@ds/peitho`, 
   Greek goddess of persuasion, matches the deity-named package convention; rename freely.)
9. **🔒 Research profiles** (defined once in `@ds/peitho/src/client.ts`, selected by the route):

   | Profile | effort | web tools | `maxSearches` | `maxContinuations` | research `max_tokens` | `maxDuration` | Use when |
   |---|---|---|---|---|---|---|---|
   | **lean** (default) | `medium` | `web_search` only | 4 | 2 | 4000 | 60 | Hobby or unconfirmed plan |
   | **deep** | `high` | `web_search` + `web_fetch` | 8 | 5 | 8000 | 300 | Vercel Pro confirmed |

   Select via `const PROFILE = process.env.OUTREACH_RESEARCH_DEEP === "true" ? DEEP : LEAN`. When you
   flip `OUTREACH_RESEARCH_DEEP=true`, also change the route's `export const maxDuration = 300`.

---

## 2. UX / flow

### The tab
Add **"Outreach"** to the admin top-bar nav and a page at `/admin/outreach`.

### Page layout (`/admin/outreach`)
Two-pane working surface, styled with existing `.admin-*` classes (see
[admin.css](../../apps/ds-site/src/app/admin/admin.css)):

```
┌ DS2 · Outreach ─────────────────────────────────────────────────────────┐
│  Research a prospect, get a grounded brief, then email or call.          │
├──────────────────────────────┬──────────────────────────────────────────┤
│  LEFT: lead picker            │  RIGHT: brief viewer                      │
│  • filter (priority/status/   │  (empty state → "Pick a lead and click   │
│    area/has-brief), search    │   Research")                             │
│  • model toggle: Opus | Sonnet│  When a brief is ready:                   │
│  • table of marketing_leads   │   ▸ Header: name · confidence pill · cost │
│    each row: name · category  │   ▸ Overview                             │
│    · priority · [Research]     │   ▸ What they do / ICP                   │
│    · brief status pill        │   ▸ Pain points (ranked)                 │
│  • multi-select + "Research    │   ▸ Market environment + competitors     │
│    selected" (fires           │   ▸ Recent signals                        │
│    sequentially)              │   ▸ Outreach angle + call talking points  │
│                               │   ▸ Sources (cited links)                 │
│                               │   ▸ History (prior runs, newest first)    │
│                               │   ▸ [Draft sales email]  [Mark contacted] │
└──────────────────────────────┴──────────────────────────────────────────┘
```

### States to design (per [web-interface.md](../../.claude/rules/web-interface.md))
- **No brief** → `[Research]` (primary).
- **Researching** → button shows spinner + keeps its label ("Researching…"); status pill
  `researching`; refresh until ready. Respect the 150–300ms spinner delay.
- **Ready** → render the brief; `[Re-research]` available (creates a new history row).
- **Failed** → red status, show `error`, `[Retry]`, the previous current brief (if any) still shows.
- **Low confidence** (`< 0.6`) → render with a visible "Preliminary, confidence X.XX" banner + the
  `gaps` list (CLAUDE.md §"Research-agent output discipline").
- **History** → list prior runs (date · model · confidence); selecting one shows it read-only.
- Deep-link the selected lead via `?lead=<id>` (URL state, not just `useState`).
- Model toggle (Opus/Sonnet) is a real control; default Opus; persisted in the URL too (`?model=`).

### Voice
On-screen copy follows DS voice (sentence-case, you/we, no "synergy/transformation"). The brief is
internal so it can be blunt; the **email** (Phase 4) must follow the challenge-first brand rhythm in
[CLAUDE.md](../../CLAUDE.md).

---

## 3. Architecture

```
                         apps/ds-site (Next.js 15, App Router)
┌──────────────────────────────────────────────────────────────────────────────┐
│  /admin/(app)/outreach/page.tsx        server component: leads + current briefs│
│        │  renders                                                              │
│        ▼                                                                       │
│  outreach-table.tsx (client)  ──calls──►  outreach-actions.ts ('use server')   │
│  outreach-brief-view.tsx (client)             │ markContacted, deleteBrief     │
│        │ fetch POST {leadId, model}           ▼                                │
│        ▼                                  marketing_leads (existing)           │
│  /api/admin/outreach/research/route.ts    outreach_briefs (NEW, append-only)   │
│        │  assertAdmin → load lead                                              │
│        ▼                                                                       │
│   @ds/peitho  (NEW pure package, mirrors @ds/plutus)                          │
│     buildFacts(lead)  →  research(facts, profile)  →  synthesizeBrief(...)     │
│            │                  │ web_search [+web_fetch]    │ json_schema        │
│            │                  ▼ (Stage A)                  ▼ (Stage B)          │
│            │            Anthropic Messages API (opus-4-8 default / sonnet-4-6) │
│            ▼                                                                    │
│     factCheckBrief(brief, facts)  → confidence, gaps                           │
│                                                                                │
│  Phase 4 (email): /api/admin/outreach/email/{draft,approve} reuse Plutus:      │
│     packages/plutus/.../email-channel.ts (Resend) + CAS approve pattern        │
└──────────────────────────────────────────────────────────────────────────────┘
```

This is the exact shape of Plutus (`packages/plutus` pure engine + app-side wiring in
`app/workspace/(app)/plutus/lib`). Copy the proven pattern; don't invent one.

---

## 4. New package: `@ds/peitho`

Create `packages/peitho/`. Mirror `packages/plutus/`'s structure, `package.json`, and `tsconfig`.

### 4.1 `package.json`
Copy [packages/plutus/package.json](../../packages/plutus/package.json) and rename to `@ds/peitho`.
Depend on `@anthropic-ai/sdk` at the **same version Plutus pins** (`^0.104.1` per
[packages/plutus/src/client.ts](../../packages/plutus/src/client.ts)). Pure TS, no React, no
Supabase (persistence lives in the app layer, exactly like Plutus).

### 4.2 File map
```
packages/peitho/src/
  index.ts          re-exports the public API
  client.ts         Anthropic client + model constants + costUsd() + PROFILES   (copy from plutus/client.ts)
  types.ts          OutreachFacts, ResearchResult, CompanyBrief, BriefSource, PeithoUsage, ResearchProfile
  schema.ts         BRIEF_SCHEMA (json_schema for CompanyBrief)
  facts.ts          buildFacts(lead): OutreachFacts                              (pure, code-computed)
  research.ts       research(facts, opts): ResearchResult                       (Stage A, web tools loop)
  synthesize.ts     synthesizeBrief(facts, dossier, opts): { brief, usage, usd } (Stage B, json_schema)
  factcheck.ts      factCheckBrief(brief, facts): { confidence, gaps, issues }
  render.ts         renderBriefMarkdown(brief, sources): string                 (brief → markdown, like aegis/report.ts)
  prompts.ts        RESEARCH_SYSTEM, SYNTH_SYSTEM
  util.ts           small helpers (extractText, firstText, accumulateUsage, collectSources, countSearches)
```

### 4.3 `client.ts` (copy Plutus, add Opus 4.8 + profiles + web price)
[packages/plutus/src/client.ts](../../packages/plutus/src/client.ts) already implements
`getClient()`, `RawUsage`, `costUsd()` and a `PRICING` map. Reuse it and extend:

```typescript
// packages/peitho/src/client.ts
import Anthropic from "@anthropic-ai/sdk";
import type { ResearchProfile } from "./types.js";

export const OPUS   = "claude-opus-4-8" as const;    // default, deep reasoning (CLAUDE.md routing)
export const SONNET = "claude-sonnet-4-6" as const;  // fast/cheap toggle

/** Map the UI/route token to a model id. */
export function resolveModel(model?: "opus" | "sonnet"): string {
  return model === "sonnet" ? SONNET : OPUS;
}

// $ per 1,000,000 tokens
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-8":   { input: 5, output: 25 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5":  { input: 1, output: 5 },
};

/** 🔒 Anthropic web search is billed per search (~$10 / 1,000). Confirm vs the pricing page at
 *  build-time; update here if it has changed. */
export const WEB_SEARCH_USD_PER_1K = 10;

export const LEAN: ResearchProfile = {
  name: "lean", effort: "medium", useWebFetch: false, maxSearches: 4, maxContinuations: 2, researchMaxTokens: 4000,
};
export const DEEP: ResearchProfile = {
  name: "deep", effort: "high", useWebFetch: true, maxSearches: 8, maxContinuations: 5, researchMaxTokens: 8000,
};
/** Default lean (60s-safe). Set OUTREACH_RESEARCH_DEEP=true once on Vercel Pro (and bump the
 *  route's maxDuration to 300). */
export const ACTIVE_PROFILE: ResearchProfile = process.env.OUTREACH_RESEARCH_DEEP === "true" ? DEEP : LEAN;

export function getClient(apiKey?: string): Anthropic {
  return apiKey ? new Anthropic({ apiKey }) : new Anthropic(); // reads ANTHROPIC_API_KEY
}

export interface RawUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

/** Token cost only. Add web-search cost in the route: searchCount * WEB_SEARCH_USD_PER_1K / 1000. */
export function costUsd(model: string, usage: RawUsage): number {
  const p = PRICING[model];
  if (!p) return 0;
  const full = usage.input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const out = usage.output_tokens ?? 0;
  return (full * p.input + cacheRead * p.input * 0.1 + cacheWrite * p.input * 1.25 + out * p.output) / 1_000_000;
}
```

### 4.4 `types.ts`
```typescript
export type Lang = "en" | "el";

export interface ResearchProfile {
  name: "lean" | "deep";
  effort: "low" | "medium" | "high" | "xhigh" | "max";
  useWebFetch: boolean;
  maxSearches: number;
  maxContinuations: number;
  researchMaxTokens: number;
}

/** Deterministic, code-computed inputs the model must not contradict. */
export interface OutreachFacts {
  leadId: string;
  businessName: string;
  category: string | null;
  area: string | null;          // e.g. "Kifisia, Greece"
  website: string | null;
  hasWebsite: boolean;
  phone: string | null;
  email: string | null;
  lang: Lang;                   // el for .gr / Greek area, else en (facts.ts)
  // Signals already mined by the lead-finder, give the model a head start:
  pitchAngle: string | null;   // marketing_leads.pitch_angle
  tags: string[];              // marketing_leads.tags  (e.g. "not-mobile-friendly")
  tech: string[];              // marketing_leads.tech  (e.g. "jQuery 1.11")
  ugliness: number | null;     // marketing_leads.ugliness
}

export interface BriefSource { title: string; url: string; }

/** The structured, readable brief, what the UI renders and what the email (Phase 4) uses. */
export interface CompanyBrief {
  overview: string;                 // 2–4 sentences: who they are
  whatTheyDo: string;               // products/services
  idealCustomers: string;           // who they sell to (ICP)
  painPoints: { title: string; detail: string; severity: "high" | "medium" | "low" }[];
  marketEnvironment: string;        // competition, trends, local market
  competitors: string[];            // named competitors if found
  recentSignals: string[];          // news, hiring, launches, review trends, recency matters
  outreachAngle: string;            // the ONE honest hook DS leads with (challenge-first)
  talkingPoints: string[];          // 3–6 bullets for a manual call
  emailSeeds: string[];             // 2–3 candidate subject/opening ideas (input to Phase 4)
  confidence: number;               // 0..1, the model's self-assessed grounding
  gaps: string[];                   // what it couldn't verify
}

export interface PeithoUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  search_count: number;             // # web_search calls (for cost)
  usd: number;                      // token cost only; route adds search cost
}

export interface ResearchResult {
  dossier: string;                  // the model's cited research write-up (Stage A output)
  sources: BriefSource[];           // URLs it actually consulted
  usage: PeithoUsage;
}
```

### 4.5 `facts.ts`
Pure. Map a `marketing_leads` row → `OutreachFacts`. Language pick: `el` when `website` ends in
`.gr` OR `area` contains "Greece"/"Ελλ", else `en` (parked-doc locked decision #3). On the app side,
use the existing `rowToLead` mapper in
[apps/ds-site/src/app/admin/lib/leads-types.ts](../../apps/ds-site/src/app/admin/lib/leads-types.ts),
then pass the `MarketingLead` into `buildFacts`.

### 4.6 `research.ts` (Stage A)
Server-tool continuation loop, driven by a `ResearchProfile`. Exact Claude shapes in §6.

```typescript
import { getClient, OPUS, costUsd } from "./client.js";
import { RESEARCH_SYSTEM } from "./prompts.js";
import { accumulateUsage, collectSources, countSearches, extractText, buildResearchPrompt } from "./util.js";
import type { OutreachFacts, ResearchResult, ResearchProfile, BriefSource } from "./types.js";

export interface ResearchOptions {
  client?: ReturnType<typeof getClient>;
  apiKey?: string;
  model?: string;            // default OPUS
  profile: ResearchProfile;  // LEAN or DEEP (passed by the route from ACTIVE_PROFILE)
}

export async function research(facts: OutreachFacts, opts: ResearchOptions): Promise<ResearchResult> {
  const client = opts.client ?? getClient(opts.apiKey);
  const model = opts.model ?? OPUS;
  const { effort, useWebFetch, maxSearches, maxContinuations, researchMaxTokens } = opts.profile;

  const tools: any[] = [{ type: "web_search_20260209", name: "web_search", max_uses: maxSearches }];
  if (useWebFetch) tools.push({ type: "web_fetch_20260209", name: "web_fetch", max_uses: maxSearches });

  const messages: any[] = [{ role: "user", content: buildResearchPrompt(facts) }];
  const agg = { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, searches: 0, usd: 0 };
  const sources = new Map<string, BriefSource>();
  let lastText = "";

  for (let hop = 0; hop <= maxContinuations; hop++) {
    const res = await client.messages.create({
      model,
      max_tokens: researchMaxTokens,
      thinking: { type: "adaptive" },                 // Opus 4.8 / Sonnet 4.6: adaptive only
      output_config: { effort },
      system: [{ type: "text", text: RESEARCH_SYSTEM, cache_control: { type: "ephemeral" } }],
      tools,
      messages,
    });

    accumulateUsage(agg, res.usage, model, costUsd);
    collectSources(res.content, sources);             // pull web_search_result url/title (handle error block)
    countSearches(res.content, agg);                  // count server_tool_use web_search blocks
    lastText = extractText(res.content) || lastText;

    if (res.stop_reason === "refusal") break;         // route records `failed`; don't throw here
    if (res.stop_reason !== "pause_turn") break;      // end_turn / max_tokens, done
    messages.push({ role: "assistant", content: res.content }); // resume; NO "continue" user msg
  }

  return {
    dossier: lastText,
    sources: [...sources.values()],
    usage: { input_tokens: agg.input, output_tokens: agg.output, cache_read_tokens: agg.cacheRead,
             cache_write_tokens: agg.cacheWrite, search_count: agg.searches, usd: agg.usd },
  };
}
```

### 4.7 `synthesize.ts` (Stage B, structured)
```typescript
import { getClient, OPUS, costUsd } from "./client.js";
import { SYNTH_SYSTEM } from "./prompts.js";
import { BRIEF_SCHEMA } from "./schema.js";
import { firstText } from "./util.js";
import type { OutreachFacts, CompanyBrief, ResearchResult } from "./types.js";

export async function synthesizeBrief(
  facts: OutreachFacts,
  research: ResearchResult,
  opts: { client?: ReturnType<typeof getClient>; apiKey?: string; model?: string } = {},
): Promise<{ brief: CompanyBrief; usd: number }> {
  const client = opts.client ?? getClient(opts.apiKey);
  const model = opts.model ?? OPUS;

  const res = await client.messages.create({
    model,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: { type: "json_schema", schema: BRIEF_SCHEMA } },
    system: [{ type: "text", text: SYNTH_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [{
      role: "user",
      content: [
        "Synthesize the company brief. Facts (use exactly, never contradict):",
        "```json", JSON.stringify(facts, null, 2), "```",
        "Research dossier (your only evidence, do not invent beyond it):",
        research.dossier,
      ].join("\n"),
    }],
  });

  if (res.stop_reason === "refusal") throw new Error("synthesize: model refused");
  const brief = JSON.parse(firstText(res.content)) as CompanyBrief;
  return { brief, usd: costUsd(model, res.usage) };
}
```

### 4.8 `schema.ts`
`BRIEF_SCHEMA` is the JSON Schema for `CompanyBrief`. **Rules** (from §6.3): every object needs
`additionalProperties: false` + `required`; **no** `minLength`/`maxLength`/`minimum`/`maximum`, no
recursion; enums OK.

```typescript
export const BRIEF_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    overview: { type: "string" },
    whatTheyDo: { type: "string" },
    idealCustomers: { type: "string" },
    painPoints: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          severity: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["title", "detail", "severity"],
      },
    },
    marketEnvironment: { type: "string" },
    competitors: { type: "array", items: { type: "string" } },
    recentSignals: { type: "array", items: { type: "string" } },
    outreachAngle: { type: "string" },
    talkingPoints: { type: "array", items: { type: "string" } },
    emailSeeds: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
    gaps: { type: "array", items: { type: "string" } },
  },
  required: ["overview", "whatTheyDo", "idealCustomers", "painPoints", "marketEnvironment",
             "competitors", "recentSignals", "outreachAngle", "talkingPoints", "emailSeeds",
             "confidence", "gaps"],
} as const;
```

### 4.9 `factcheck.ts`
Pure, cheap guard (mirrors [packages/plutus/src/factcheck.ts](../../packages/plutus/src/factcheck.ts)).
No Claude call. It:
- Confirms `brief.overview` mentions the business name (else add a gap).
- Clamps `confidence` to `[0,1]`; if `research.sources.length === 0`, force `confidence ≤ 0.4` and
  add gap "no external sources consulted".
- Returns `{ confidence, gaps, issues }`. Route stores `confidence`; if `< 0.6` the UI shows the
  "Preliminary" banner.

### 4.10 `prompts.ts`
Two careful, cache-stable system prompts. Tune per the Opus 4.8 guidance in §6 (it under-reaches for
tools by default, be explicit about *when* to search; it narrates a lot, ask for a tight dossier).
- **`RESEARCH_SYSTEM`**, "You are the research layer of DS's outreach engine. Use web search to
  build an accurate, current dossier about a business." Rules: search the business name + area +
  website first; verify what they do, who they serve, their market, named competitors, recent
  signals (news/hiring/reviews); **never invent**, say so if not found; prefer primary sources;
  cite every nontrivial claim with its URL; keep the dossier under ~1200 words (lean) ; end with an
  explicit "Confidence & gaps" section. Include a `<search_first>` instruction (Opus 4.8 needs it).
- **`SYNTH_SYSTEM`**, "You convert a research dossier into a structured outreach brief for a
  digital-solutions consultancy (DS) that sells websites, apps, data/ML, and chatbots and works
  challenge-first." Rules: use ONLY the dossier + facts; `outreachAngle` = one honest, specific hook
  tied to a real observed problem (protective framing, never "your site is bad"); rank `painPoints`;
  `confidence` reflects dossier support; output strictly matches the schema.

### 4.11 `render.ts`
`renderBriefMarkdown(brief, sources)` → markdown (mirrors
[packages/aegis/src/report.ts](../../packages/aegis/src/report.ts)). Populates
`outreach_briefs.brief_md` for reading/exporting/copy-to-clipboard; the UI renders the structured
JSON directly.

---

## 5. Data model (new migration, append-only with history)

Create `apps/ds-site/supabase/migrations/20260626120000_outreach_briefs.sql` (timestamp after the
latest, `20260617_admin_notes.sql`). Follow the conventions in
[20260526190000_marketing_leads.sql](../../apps/ds-site/supabase/migrations/20260526190000_marketing_leads.sql)
and [20260519154207_admin_panel_init.sql](../../apps/ds-site/supabase/migrations/20260519154207_admin_panel_init.sql)
(`is_admin()` RLS, `set_updated_at()`, admin + service_role grants).

```sql
-- Outreach research briefs, append-only history of deep-research briefs per marketing lead.
-- Each research run inserts a row; the newest ready row has is_current = true. A failed run does
-- NOT clear the previous current brief. Admin-only (mirrors marketing_leads).

create type outreach_brief_status as enum ('researching', 'ready', 'failed');

create table public.outreach_briefs (
  id            uuid primary key default gen_random_uuid(),
  lead_id       uuid not null references public.marketing_leads (id) on delete cascade,
  is_current    boolean not null default false,    -- the brief shown for this lead (latest ready)
  status        outreach_brief_status not null default 'researching',
  lang          text not null default 'en' check (lang in ('en', 'el')),
  model         text,                              -- claude-opus-4-8 | claude-sonnet-4-6
  profile       text,                              -- lean | deep
  brief_json    jsonb,                             -- CompanyBrief
  brief_md      text,                              -- rendered markdown (renderBriefMarkdown)
  sources       jsonb not null default '[]',       -- BriefSource[]
  confidence    numeric,                           -- 0..1
  gaps          text[] not null default '{}',
  input_tokens  int not null default 0,
  output_tokens int not null default 0,
  search_count  int not null default 0,
  cost_usd      numeric not null default 0,
  error         text,
  created_by    uuid references auth.users (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index outreach_briefs_lead_created_idx on public.outreach_briefs (lead_id, created_at desc);
-- At most one current brief per lead.
create unique index outreach_briefs_current_uniq on public.outreach_briefs (lead_id) where is_current;
create index outreach_briefs_status_idx on public.outreach_briefs (status);

create trigger outreach_briefs_set_updated_at
  before update on public.outreach_briefs
  for each row execute function public.set_updated_at();

alter table public.outreach_briefs enable row level security;

create policy outreach_briefs_admin_all on public.outreach_briefs
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant select, insert, update, delete on public.outreach_briefs to authenticated, service_role;
```

Types are **hand-written** in this repo (no codegen), extend the app-side TS interfaces by hand.

**Phase 4 tables** (`outreach_emails`, `outreach_suppressions`) come from the parked
[2026-06-17 doc](2026-06-17-lead-outreach-research.md), create them only when building the sender.

---

## 6. Claude API specifics (authoritative, verified 2026-06-26 against the in-repo `claude-api` ref)

### 6.1 Models & pricing
- **`claude-opus-4-8`** (default), $5 / $25 per 1M (in/out). 1M context, 128K max out.
- **`claude-sonnet-4-6`** (cheap toggle + Phase-4 email), $3 / $15 per 1M.
- Use **bare** model id strings, never append a date suffix.

### 6.2 Web search / web fetch (server tools)
- Tool types: **`web_search_20260209`** (always) and **`web_fetch_20260209`** (deep profile only).
  Declare in `tools`; no beta header.
- **Do NOT also declare `code_execution`** alongside the `_20260209` web tools, dynamic filtering
  runs code under the hood; a second exec env confuses the model.
- `web_fetch` only fetches URLs already in the conversation (i.e. ones search surfaced). Params used:
  `max_uses`.
- **Results:** a `web_search_tool_result` block whose `.content` is a **list** of `web_search_result`
  (`url`, `title`). On error its `.content` is a single object (e.g.
  `{ error_code: "max_uses_exceeded" }`), branch on list-vs-object before indexing. Collect into
  `ResearchResult.sources`.
- **Continuation:** the server runs its own loop; on its cap it returns `stop_reason: "pause_turn"`.
  To continue: append the assistant `content` and re-send, **do not** add a "Continue." user
  message. Cap with `maxContinuations`.
- Server-tool errors return HTTP 200 with an error block, not an exception.

### 6.3 Thinking, effort, structured output
- Opus 4.8 / Sonnet 4.6 = **adaptive thinking only**: `thinking: { type: "adaptive" }`. **Never** send
  `budget_tokens` / `temperature` / `top_p` / `top_k` → they 400.
- Depth via `output_config: { effort: <profile.effort> }`.
- Structured output: `output_config: { format: { type: "json_schema", schema } }` on the **toolless**
  synthesis call. Schema rules in §4.8. Incompatible with citations and with an active server-tool
  loop, hence the separate synthesis call.
- Prompt caching: stable system prompt in `system: [{ type, text, cache_control: { type:
  "ephemeral" } }]`; per-lead facts go last. Verify `usage.cache_read_input_tokens > 0` on the 2nd+
  call. (Plutus already does this.)

### 6.4 Cost accounting
- Token cost via `costUsd(model, res.usage)` summed across continuation hops.
- **🔒 Web search billed per search**, `searchCostUsd = search_count * WEB_SEARCH_USD_PER_1K / 1000`
  with `WEB_SEARCH_USD_PER_1K = 10` (§4.3). Store `tokenCost + searchCost` in
  `outreach_briefs.cost_usd`.
- `max_tokens`: profile `researchMaxTokens` (4000 lean / 8000 deep), 4000 synthesis, under the
  non-streaming ~16K timeout guidance; no streaming needed.
- `stop_reason: "refusal"` → record `failed`, don't crash. Rare for ordinary SMEs.

---

## 7. App-side wiring (exact files)

### 7.1 Register the tab
Edit [apps/ds-site/src/app/admin/(app)/layout.tsx](../../apps/ds-site/src/app/admin/(app)/layout.tsx).
Add, after "Hunt" and before "Workspace":
```tsx
<Link href="/admin/outreach" className="admin-topbar__link">
  Outreach
</Link>
```

### 7.2 The page (server component)
Create `apps/ds-site/src/app/admin/(app)/outreach/page.tsx`. Copy the shape of
[leads/page.tsx](../../apps/ds-site/src/app/admin/(app)/leads/page.tsx):
- `export const dynamic = 'force-dynamic'`.
- `searchParams: Promise<...>` → read `?lead=`, `?model=`, filters.
- `hasSupabase` guard; `getSupabaseServerClient()`.
- Query `marketing_leads` (map with `rowToLead`) and, in parallel,
  `outreach_briefs` where `is_current` (current brief per lead). Merge by `lead_id` in code so each
  lead row knows its current brief status. For the selected lead, also fetch its full history
  (`select * ... where lead_id = ? order by created_at desc`).
- Render `.admin-container` > `.admin-page-header` (eyebrow `DS2 · Outreach`) then the two panes.

### 7.3 Client components
- `outreach-table.tsx` (`'use client'`): left lead picker. Mirrors
  [leads-table.tsx](../../apps/ds-site/src/app/admin/leads-table.tsx), `useTransition`, the
  Opus/Sonnet toggle, multi-select. Per-row `[Research]` POSTs `{ leadId, model }` to
  `/api/admin/outreach/research`; **"Research selected" awaits each request before the next** (locked
  decision #5). After each success, `router.refresh()`.
- `outreach-brief-view.tsx` (`'use client'`): right pane. Renders a `CompanyBrief` (sections in §2),
  confidence pill, sources as real `<a>` links, a **History** list (prior runs), and
  `[Draft sales email]` (Phase 4) / `[Mark contacted]`.
- Add to [admin.css](../../apps/ds-site/src/app/admin/admin.css) only if existing `.admin-*` classes
  don't cover it; keep the amber accent + tokens.

### 7.4 Server actions
Create `apps/ds-site/src/app/admin/outreach-actions.ts` (`'use server'`). Mirror
[leads-actions.ts](../../apps/ds-site/src/app/admin/leads-actions.ts):
```ts
'use server'
import { revalidatePath } from 'next/cache'
import { assertAdmin } from './lib/assert-admin'
import { getSupabaseServerClient } from './lib/supabase-server'

const PATH = '/admin/outreach'
async function db() { await assertAdmin(); return getSupabaseServerClient() }

export async function markContacted(leadId: string): Promise<void> { /* update marketing_leads.contacted = true; revalidatePath(PATH) */ }
export async function deleteBrief(briefId: string): Promise<void> { /* delete outreach_briefs by id; revalidatePath(PATH) */ }
```
(The heavy research work runs in a route handler, not a server action, it's long-running and needs
`maxDuration`.)

### 7.5 Route handler, research (history-aware)
Create `apps/ds-site/src/app/api/admin/outreach/research/route.ts`. Auth pattern from
[find-area/route.ts](../../apps/ds-site/src/app/api/admin/leads/find-area/route.ts):
```ts
import { NextResponse } from "next/server"
import { assertAdmin } from "../../../../admin/lib/assert-admin"
import { getSupabaseServerClient } from "../../../../admin/lib/supabase-server"
import { rowToLead } from "../../../../admin/lib/leads-types"
import {
  buildFacts, research, synthesizeBrief, factCheckBrief, renderBriefMarkdown,
  resolveModel, ACTIVE_PROFILE, WEB_SEARCH_USD_PER_1K,
} from "@ds/peitho"

export const runtime = "nodejs"
export const maxDuration = 60   // 🔒 lean profile. Raise to 300 AND set OUTREACH_RESEARCH_DEEP=true on Vercel Pro.

export async function POST(request: Request): Promise<Response> {
  try { await assertAdmin() } catch { return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }) }
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ ok: false, error: "Research is not configured." }, { status: 503 })

  const body = await request.json() as { leadId?: string; model?: "opus" | "sonnet" }
  if (!body.leadId) return NextResponse.json({ ok: false, error: "Missing leadId" }, { status: 400 })
  const model = resolveModel(body.model)

  const supabase = await getSupabaseServerClient()
  const { data: row, error } = await supabase.from("marketing_leads").select("*").eq("id", body.leadId).single()
  if (error || !row) return NextResponse.json({ ok: false, error: "Lead not found" }, { status: 404 })

  // Insert a new history row (NOT current yet).
  const { data: created, error: insErr } = await supabase
    .from("outreach_briefs")
    .insert({ lead_id: body.leadId, status: "researching", model, profile: ACTIVE_PROFILE.name, is_current: false })
    .select("id").single()
  if (insErr || !created) return NextResponse.json({ ok: false, error: insErr?.message ?? "insert failed" }, { status: 500 })
  const briefId = created.id

  try {
    const facts = buildFacts(rowToLead(row))
    const r = await research(facts, { model, profile: ACTIVE_PROFILE })
    const { brief, usd } = await synthesizeBrief(facts, r, { model })
    const checked = factCheckBrief(brief, facts)
    const finalBrief = { ...brief, confidence: checked.confidence, gaps: checked.gaps }
    const md = renderBriefMarkdown(finalBrief, r.sources)
    const cost = usd + r.usage.usd + (r.usage.search_count * WEB_SEARCH_USD_PER_1K) / 1000

    // Mark this row ready+current, then demote any other current brief for the lead.
    await supabase.from("outreach_briefs").update({
      status: "ready", is_current: true, lang: facts.lang,
      brief_json: finalBrief, brief_md: md, sources: r.sources,
      confidence: checked.confidence, gaps: checked.gaps,
      input_tokens: r.usage.input_tokens, output_tokens: r.usage.output_tokens,
      search_count: r.usage.search_count, cost_usd: cost,
    }).eq("id", briefId)
    await supabase.from("outreach_briefs").update({ is_current: false })
      .eq("lead_id", body.leadId).eq("is_current", true).neq("id", briefId)

    return NextResponse.json({ ok: true, briefId })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "research failed"
    // Failure leaves any prior current brief intact.
    await supabase.from("outreach_briefs").update({ status: "failed", error: msg }).eq("id", briefId)
    return NextResponse.json({ ok: false, error: msg }, { status: 500 })
  }
}
```
> **Note on the partial unique index** `where is_current`: set the new row current *before* clearing
> the old one and there's a momentary 2-current overlap that the unique index would reject. The order
> above (set new current, then clear others `neq id`) is fine because the *update that would
> conflict* is the demotion, which only ever sets `is_current=false`, never two trues. If Postgres
> still flags it under your isolation level, swap to: clear existing current first
> (`update ... set is_current=false where lead_id=? and is_current`), then set the new row current.

**Long-running caveat:** if a single request approaches `maxDuration`, the row stays `researching`
and the UI offers Retry. Hardening later = enqueue (e.g. Inngest) + poll; not needed for v1.

### 7.6 Workspace alias
Confirm `@ds/peitho` resolves: `pnpm-workspace.yaml` already globs `packages/*`; add the path/
reference in the app `tsconfig` the same way `@ds/plutus` is wired, and add the package to
`turbo.json` if other `@ds/*` packages are listed there.

---

## 8. Phase 4, sales email from the brief (reuse Plutus)

Only after Phases 1–3 ship. Realises "use the brief as context for a sales email for automated
outreach", the parked [2026-06-17 doc](2026-06-17-lead-outreach-research.md) made concrete by a real
brief.

- **Draft:** add `draftEmail(facts, brief, opts)` to `@ds/peitho`, one `claude-sonnet-4-6` call
  (mirrors [packages/plutus/src/draft.ts](../../packages/plutus/src/draft.ts)) with a challenge-first
  DS system prompt, `output_config.format` = `{ subject, body }` json_schema, the brief's
  `outreachAngle` + `painPoints` + `emailSeeds` as grounding, language = `facts.lang`. Add
  `factCheckEmail` (must contain business name; must NOT fabricate; must include unsubscribe footer).
- **Persist + send:** create `outreach_emails` (+ `outreach_suppressions`) per the parked doc; reuse
  the **exact** Resend channel + CAS approve pattern from
  [email-channel.ts](../../apps/ds-site/src/app/workspace/(app)/plutus/lib/email-channel.ts) and
  [approve.ts](../../apps/ds-site/src/app/workspace/(app)/plutus/lib/approve.ts) (the `claimPending`
  compare-and-swap = exactly-once send). New env: `OUTREACH_EMAIL_FROM`, `OUTREACH_REPLY_TO` (reuse
  `RESEND_API_KEY`).
- **Manual call path needs no code**, the brief's `talkingPoints` + `phone` are already on screen.

---

## 9. Environment variables

Already present (verify in `apps/ds-site/.env.example`): `ANTHROPIC_API_KEY`,
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`,
`ADMIN_ALLOWED_EMAILS`, `RESEND_API_KEY`.

Add now: `OUTREACH_RESEARCH_DEEP` (optional, `"true"` to enable the deep profile, leave unset for
lean). Add for Phase 4: `OUTREACH_EMAIL_FROM`, `OUTREACH_REPLY_TO`. (Optional later:
`FIRECRAWL_API_KEY` for a deep-fetch observer, already used by `@ds/argus`.) Document all in
`.env.example`. Never commit secrets.

---

## 10. Security & conduct

- Every route + action calls `assertAdmin()` first (see
  [assert-admin.ts](../../apps/ds-site/src/app/admin/lib/assert-admin.ts)). RLS via `is_admin()` is a
  second gate. The RLS client is sufficient here; no service-role needed.
- Validate `leadId` / `model` at the boundary; parameterised Supabase queries only.
- Don't log brief bodies or PII ([security.md](../../.claude/rules/security.md)). Costs/tokens are
  fine to log.
- Research uses only public web data via official Anthropic tools; the brief is internal sales
  intel. The **email** (Phase 4) must carry sender identity + one-click unsubscribe and respect the
  suppression list (parked doc, locked decision #2), that's where compliance bites, not the brief.

---

## 11. Testing (per coding-style.md "AAA"; behaviour, not implementation)

Pure-engine units (no network, inject a fake Anthropic `client` via `opts.client`, like Plutus does
with `StubChannel`/`SpyChannel`):
- `facts.ts`: language pick (`.gr` → el; "Athens, Greece" → el; "Shoreditch, London" → en); maps
  tags/tech/pitchAngle through.
- `research.ts`: with a fake client returning `pause_turn` then `end_turn`, it loops and aggregates
  usage + sources; respects `maxContinuations`; handles a `web_search_tool_result` error block
  (object content) without throwing; deep profile adds `web_fetch` to `tools`.
- `synthesize.ts`: parses schema-valid JSON; throws on `refusal`.
- `factcheck.ts`: forces `confidence ≤ 0.4` when `sources` empty; flags missing business name.
- `render.ts`: includes confidence + sources.

App integration:
- research route: 401 without admin; 503 without `ANTHROPIC_API_KEY`; inserts a `researching` row;
  on success sets it `ready`+`is_current` and demotes the prior current; on failure leaves the prior
  current intact.

---

## 12. Decisions locked (summary)

| # | Decision | Locked value |
|---|---|---|
| Data source | research backend | Anthropic SDK web tools (`web_search_20260209` [+ `web_fetch` deep]) |
| Pipeline | stages | Research (tools) → Synthesize (toolless json_schema) |
| Model | default + toggle | **Opus 4.8** default; **Sonnet 4.6** per-run toggle |
| Storage | history | **Append-only with `is_current`**; failed run keeps prior brief |
| Granularity | per call | One lead per call; multi-select fires **sequentially** |
| Hosting | runtime | **Lean profile, `maxDuration=60`** by default; deep + 300 via `OUTREACH_RESEARCH_DEEP=true` on Pro |
| Web price | constant | `WEB_SEARCH_USD_PER_1K = 10` (confirm vs pricing page) |
| Access | gating | admin-only (`assertAdmin` + `is_admin()` RLS) |
| Package | name | `@ds/peitho` |

---

## 13. Build order (for the implementing session)

1. **Scaffold `@ds/peitho`** (`package.json`, `tsconfig`, `index.ts`, `client.ts` copied from
   Plutus + `OPUS`/`SONNET`/`resolveModel`/`LEAN`/`DEEP`/`ACTIVE_PROFILE`/`WEB_SEARCH_USD_PER_1K`).
   Typecheck; import from the app.
2. **`types.ts` + `schema.ts` + `facts.ts` + `prompts.ts` + `util.ts`** (no network). Unit-test
   `facts`.
3. **`research.ts`** with a fake client; unit-test the `pause_turn` loop, profile tool selection, and
   source/usage aggregation (incl. the error-block case). Then one real-key smoke test.
4. **`synthesize.ts` + `factcheck.ts` + `render.ts`**; unit-test schema parse + confidence clamp.
5. **Migration** `20260626120000_outreach_briefs.sql`; apply; verify RLS with a non-admin and the
   partial unique index behaviour.
6. **Route** `/api/admin/outreach/research`; verify 401/503, history insert, ready+current flip,
   failure keeps prior current.
7. **Nav link + page + table (with model toggle) + brief view (with history)**; wire the Research
   button (sequential multi-select); verify end-to-end on one lead.
8. **States & polish** (spinner timing, confidence/preliminary banner, deep-link `?lead=`/`?model=`,
   empty/error/history states).
9. **Phase 4 (email)**, only if approved: `draftEmail` + `outreach_emails`/`outreach_suppressions`
   + reuse Plutus Resend/CAS.

**Definition of done (Phases 1–3):** from `/admin/outreach`, selecting a real lead, choosing a model,
and clicking Research produces, within the lean time budget, a stored brief (new history row marked
current) with non-empty overview, ≥1 pain point, an outreach angle, ≥3 talking points, a confidence
score, and ≥1 cited source, rendered in the right pane, with cost/tokens recorded; a failed run
leaves any prior brief intact.
