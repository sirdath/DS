/**
 * Stage A — Research. One web-grounded Claude call that may run several searches,
 * driven by a ResearchProfile. The server runs its own tool loop and returns
 * stop_reason "pause_turn" when it hits its internal cap; we resume by appending the
 * assistant content and re-sending (no "Continue." message), up to maxContinuations.
 * Produces a cited dossier (text) + the sources the model actually consulted + usage.
 * Never throws on a refusal — the route records `failed`.
 */

import Anthropic from "@anthropic-ai/sdk";
import { OPUS, costUsd, getClient } from "./client";
import { RESEARCH_SYSTEM } from "./prompts";
import { accumulateUsage, buildResearchPrompt, collectSources, countSearches, extractText, newUsageAgg } from "./util";
import type { BriefSource, OutreachFacts, ResearchProfile, ResearchResult } from "./types";

export interface ResearchOptions {
  client?: Anthropic;
  apiKey?: string;
  model?: string; // default OPUS
  profile: ResearchProfile; // LEAN or DEEP (passed by the route from ACTIVE_PROFILE)
}

export async function research(facts: OutreachFacts, opts: ResearchOptions): Promise<ResearchResult> {
  const client = opts.client ?? getClient(opts.apiKey);
  const model = opts.model ?? OPUS;
  const { effort, useWebFetch, maxSearches, maxContinuations, researchMaxTokens } = opts.profile;

  const tools: Anthropic.Messages.ToolUnion[] = [{ type: "web_search_20260209", name: "web_search", max_uses: maxSearches }];
  if (useWebFetch) tools.push({ type: "web_fetch_20260209", name: "web_fetch", max_uses: maxSearches });

  const messages: Anthropic.Messages.MessageParam[] = [{ role: "user", content: buildResearchPrompt(facts) }];
  const agg = newUsageAgg();
  const sources = new Map<string, BriefSource>();
  let lastText = "";

  for (let hop = 0; hop <= maxContinuations; hop++) {
    const res = await client.messages.create({
      model,
      max_tokens: researchMaxTokens,
      thinking: { type: "adaptive" }, // Opus 4.8 / Sonnet 4.6: adaptive only
      output_config: { effort },
      system: [{ type: "text", text: RESEARCH_SYSTEM, cache_control: { type: "ephemeral" } }],
      tools,
      messages,
    });

    accumulateUsage(agg, res.usage, model, costUsd);
    collectSources(res.content, sources); // web_search_result url/title (handles error block)
    countSearches(res.content, agg); // server_tool_use web_search blocks
    lastText = extractText(res.content) || lastText;

    if (res.stop_reason === "refusal") break; // route records `failed`; don't throw here
    if (res.stop_reason !== "pause_turn") break; // end_turn / max_tokens — done
    messages.push({ role: "assistant", content: res.content }); // resume; NO "continue" user msg
  }

  return {
    dossier: lastText,
    sources: [...sources.values()],
    usage: {
      input_tokens: agg.input,
      output_tokens: agg.output,
      cache_read_tokens: agg.cacheRead,
      cache_write_tokens: agg.cacheWrite,
      search_count: agg.searches,
      usd: agg.usd,
    },
  };
}
