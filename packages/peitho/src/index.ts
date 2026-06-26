/**
 * Peitho — DS2's outreach research engine. Given a marketing lead, runs a web-
 * grounded Claude research pass (Stage A, web tools) and synthesizes a structured,
 * cited company brief (Stage B, toolless json_schema), fact-checked, with cost
 * accounting. Pure engine; persistence + auth live app-side (mirrors @ds/plutus).
 */

export { getClient, costUsd, resolveModel, OPUS, SONNET, LEAN, DEEP, ACTIVE_PROFILE, WEB_SEARCH_USD_PER_1K } from "./client";
export type { RawUsage } from "./client";

export { buildFacts } from "./facts";
export type { LeadInput } from "./facts";

export { BRIEF_SCHEMA } from "./schema";
export { RESEARCH_SYSTEM, SYNTH_SYSTEM } from "./prompts";

export { research } from "./research";
export type { ResearchOptions } from "./research";

export { synthesizeBrief } from "./synthesize";
export type { SynthesizeOptions } from "./synthesize";

export { factCheckBrief } from "./factcheck";
export type { FactCheckResult } from "./factcheck";

export { renderBriefMarkdown } from "./render";

export type {
  Lang,
  ResearchProfile,
  OutreachFacts,
  BriefSource,
  PainSeverity,
  PainPoint,
  CompanyBrief,
  PeithoUsage,
  ResearchResult,
} from "./types";
