/**
 * The one model call. Claude turns the frozen fact sheet into a weekly briefing:
 * a short narrative of what changed and what it means, plus 2–4 concrete
 * recommendations — and nothing else. It may not invent or change any number, name,
 * or movement; it must write in the business's language. The result is fact-checked
 * before it leaves this module, so a drifted briefing is flagged, not trusted.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { BRIEF_MODEL, costUsd, getClient } from "./client";
import { factCheck } from "./factcheck";
import type { ArgusUsage, BriefingFacts, Recommendation } from "./types";

const BRIEF_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: { action: { type: "string" }, rationale: { type: "string" } },
        required: ["action", "rationale"],
      },
    },
  },
  required: ["summary", "recommendations"],
} as const;

const SYSTEM = [
  "You are the briefing layer of Argus, a competitor-intelligence tool for small businesses. You write ONE weekly briefing, for a business owner, using only the facts you are given. You are a sharp, plain-spoken commercial analyst.",
  "",
  "Hard rules — non-negotiable:",
  "1. Use ONLY the facts provided (the movements and the competitor board). NEVER invent or change a number, name, rate, percentage, rating, or review count. NEVER mention a competitor not in the list.",
  "2. Write entirely in the requested language. For Greek (el) use natural business Greek; for English (en) use UK business tone.",
  "3. The summary is 2–4 sentences: lead with the most important change, say who moved and why it matters to THIS business, and be specific. No hype, no filler, no generic advice.",
  "4. Recommendations: 2–4 items, each a concrete action the owner can take this week plus a one-sentence rationale grounded in the movements. Prefer defending margin over price wars; prefer the business's own strengths. Never recommend anything unethical or anti-competitive.",
  "5. Never fabricate causes you cannot support; if a cause is a likely inference, phrase it as 'likely' or 'reads as'.",
].join("\n");

function firstText(content: Anthropic.Messages.ContentBlock[]): string {
  for (const block of content) if (block.type === "text") return block.text;
  throw new Error("no text block in briefing response");
}

export interface BriefingResult {
  summary: string;
  recommendations: Recommendation[];
  factCheckPassed: boolean;
  factCheckIssues: string[];
  usage: ArgusUsage;
}

export interface WriteBriefingOptions {
  client?: Anthropic;
  apiKey?: string;
}

export async function writeBriefing(facts: BriefingFacts, opts: WriteBriefingOptions = {}): Promise<BriefingResult> {
  const client = opts.client ?? getClient(opts.apiKey);
  const response = await client.messages.create({
    model: BRIEF_MODEL,
    max_tokens: 1200,
    thinking: { type: "disabled" },
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    output_config: { format: { type: "json_schema", schema: BRIEF_SCHEMA } },
    messages: [
      {
        role: "user",
        content: ["Write this week's briefing. Facts (use exactly):", "", "```json", JSON.stringify(facts, null, 2), "```"].join("\n"),
      },
    ],
  });

  if (response.stop_reason === "refusal") throw new Error("briefing: model refused");

  const parsed = JSON.parse(firstText(response.content)) as { summary?: string; recommendations?: Recommendation[] };
  const summary = parsed.summary ?? "";
  const recommendations = Array.isArray(parsed.recommendations) ? parsed.recommendations : [];
  const check = factCheck(summary, recommendations, facts);

  return {
    summary,
    recommendations,
    factCheckPassed: check.passed,
    factCheckIssues: check.issues,
    usage: {
      input_tokens: response.usage.input_tokens ?? 0,
      output_tokens: response.usage.output_tokens ?? 0,
      cache_read_tokens: response.usage.cache_read_input_tokens ?? 0,
      cache_write_tokens: response.usage.cache_creation_input_tokens ?? 0,
      usd: costUsd(BRIEF_MODEL, response.usage),
    },
  };
}
