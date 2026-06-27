/**
 * Anthropic client + model routing + cost accounting + research profiles. Both
 * Claude stages default to Opus 4.8 (deep reasoning, per CLAUDE.md routing); a
 * per-run toggle drops to Sonnet 4.6. Adaptive thinking only on this model family;
 * depth via output_config.effort. Web search is billed per search on top of tokens.
 * Copied from @ds/plutus client.ts and extended.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ResearchProfile } from "./types";

export const OPUS = "claude-opus-4-8" as const; // default — deep reasoning (CLAUDE.md routing)
export const SONNET = "claude-sonnet-4-6" as const; // fast/cheap toggle

/** Map the UI/route token to a model id. */
export function resolveModel(model?: "opus" | "sonnet"): string {
  return model === "sonnet" ? SONNET : OPUS;
}

// $ per 1,000,000 tokens
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-opus-4-8": { input: 5, output: 25 },
  "claude-sonnet-4-6": { input: 3, output: 15 },
  "claude-haiku-4-5": { input: 1, output: 5 },
};

/**
 * Anthropic web search is billed per search (~$10 / 1,000). Confirm against the
 * pricing page at build-time; update here if it has changed.
 */
export const WEB_SEARCH_USD_PER_1K = 10;

export const LEAN: ResearchProfile = {
  name: "lean",
  effort: "medium",
  useWebFetch: false,
  maxSearches: 4,
  maxContinuations: 2,
  researchMaxTokens: 4000,
};
export const DEEP: ResearchProfile = {
  name: "deep",
  effort: "high",
  useWebFetch: true,
  maxSearches: 8,
  maxContinuations: 5,
  researchMaxTokens: 8000,
};

/**
 * Default lean (60s-safe). Set OUTREACH_RESEARCH_DEEP=true once on Vercel Pro (and
 * bump the route's maxDuration to 300).
 */
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
