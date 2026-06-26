/**
 * Stage B — Synthesize. A second, TOOLLESS call that turns the research dossier +
 * facts into the typed CompanyBrief via output_config json_schema. Toolless because
 * structured output can't combine with an active server-tool loop (or citations) —
 * hence the clean split from Stage A. Refusal throws (the route records `failed`).
 */

import Anthropic from "@anthropic-ai/sdk";
import { OPUS, costUsd, getClient } from "./client";
import { SYNTH_SYSTEM } from "./prompts";
import { BRIEF_SCHEMA } from "./schema";
import { firstText } from "./util";
import type { CompanyBrief, OutreachFacts, ResearchResult } from "./types";

export interface SynthesizeOptions {
  client?: Anthropic;
  apiKey?: string;
  model?: string; // default OPUS
}

export async function synthesizeBrief(
  facts: OutreachFacts,
  researchResult: ResearchResult,
  opts: SynthesizeOptions = {},
): Promise<{ brief: CompanyBrief; usd: number }> {
  const client = opts.client ?? getClient(opts.apiKey);
  const model = opts.model ?? OPUS;

  const res = await client.messages.create({
    model,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    output_config: { effort: "high", format: { type: "json_schema", schema: BRIEF_SCHEMA } },
    system: [{ type: "text", text: SYNTH_SYSTEM, cache_control: { type: "ephemeral" } }],
    messages: [
      {
        role: "user",
        content: [
          "Synthesize the company brief. Facts (use exactly, never contradict):",
          "```json",
          JSON.stringify(facts, null, 2),
          "```",
          "Research dossier (your only evidence — do not invent beyond it):",
          researchResult.dossier,
        ].join("\n"),
      },
    ],
  });

  if (res.stop_reason === "refusal") throw new Error("synthesize: model refused");
  const brief = JSON.parse(firstText(res.content)) as CompanyBrief;
  return { brief, usd: costUsd(model, res.usage) };
}
