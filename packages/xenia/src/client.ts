/**
 * Anthropic client + model routing + cost accounting.
 *
 * Every conversational turn uses Sonnet 4.6: turns are latency-sensitive, short,
 * and tool-driven — the customer is waiting on the other end of a chat or a call.
 * There is no Opus path here (unlike Fama, Xenia does no cross-set synthesis).
 * Prompt caching is mandatory — the persona + business config system prompt is
 * stable across a conversation, so we cache it and pay full price only on each turn.
 */

import Anthropic from "@anthropic-ai/sdk";

export const TURN_MODEL = "claude-sonnet-4-6" as const;

/** $ per 1M tokens (input / output), from the Claude pricing table. */
const PRICING: Record<string, { input: number; output: number }> = {
  "claude-sonnet-4-6": { input: 3, output: 15 },
};

export function getClient(apiKey?: string): Anthropic {
  // Falls back to ANTHROPIC_API_KEY / an `ant auth login` profile when omitted.
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
    (full * p.input +
      cacheRead * p.input * 0.1 +
      cacheWrite * p.input * 1.25 +
      out * p.output) /
    1_000_000
  );
}
