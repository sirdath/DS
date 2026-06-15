/**
 * Anthropic client + model routing + cost accounting. Writing the weekly briefing
 * is one bounded pass from computed facts, so it runs on Sonnet 4.6 — latency- and
 * cost-sensitive, no cross-set synthesis that would warrant Opus. Prompt caching
 * covers the stable system rubric; the facts are the volatile suffix. The model is
 * used ONLY to write prose — it never computes or invents a number.
 */

import Anthropic from "@anthropic-ai/sdk";

export const BRIEF_MODEL = "claude-sonnet-4-6" as const;

const PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 3, output: 15 },
};

export function getClient(apiKey?: string): Anthropic {
  return apiKey ? new Anthropic({ apiKey }) : new Anthropic();
}

export interface RawUsage {
  input_tokens?: number;
  output_tokens?: number;
  cache_read_input_tokens?: number | null;
  cache_creation_input_tokens?: number | null;
}

/** USD cost of one call: full input + cache-read (~0.1×) + cache-write (~1.25×) + output. */
export function costUsd(model: string, usage: RawUsage): number {
  const p = PRICING[model];
  if (!p) return 0;
  const full = usage.input_tokens ?? 0;
  const cacheRead = usage.cache_read_input_tokens ?? 0;
  const cacheWrite = usage.cache_creation_input_tokens ?? 0;
  const out = usage.output_tokens ?? 0;
  return (full * p.input + cacheRead * p.input * 0.1 + cacheWrite * p.input * 1.25 + out * p.output) / 1_000_000;
}
