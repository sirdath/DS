/**
 * Anthropic client + model routing + cost accounting.
 *
 * The synthesis is one bounded pass over a single site's scan, so it runs on
 * Sonnet 4.6 (everyday-development tier per the DS monorepo convention). Prompt
 * caching covers the stable instruction + rubric prefix; the scan is the volatile
 * suffix. There is no Opus path — an audit is not cross-set reasoning.
 */

import Anthropic from "@anthropic-ai/sdk";

export const AUDIT_MODEL = "claude-sonnet-4-6" as const;

/** $ per 1M tokens (input / output), from the Claude pricing table. */
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
  return (
    (full * p.input + cacheRead * p.input * 0.1 + cacheWrite * p.input * 1.25 + out * p.output) /
    1_000_000
  );
}
