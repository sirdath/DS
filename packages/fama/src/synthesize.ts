/**
 * Cross-review synthesis — one Opus 4.8 call over the whole batch.
 *
 * The deterministic numbers are already computed (see stats.ts); this call is for
 * the judgment that arithmetic can't give you: what the business does well, what's
 * quietly costing it customers, and the few things to fix next. The model names
 * themes and writes the prose; code owns every count, so the model can't drift the
 * numbers — we join mention counts back from the rollups after it returns.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { costUsd, SYNTHESIS_MODEL, type RawUsage } from "./client";
import type { DeterministicStats } from "./stats";
import { topicLabel } from "./taxonomy";
import type {
  BusinessContext,
  Issue,
  Priority,
  Review,
  ReviewAnalysis,
  Strength,
} from "./types";

const SYNTHESIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    overall_summary: { type: "string" },
    strengths: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          theme: { type: "string" },
          example: { type: "string" },
        },
        required: ["theme", "example"],
      },
    },
    issues: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          theme: { type: "string" },
          impact: { type: "string" },
          recommendation: { type: "string" },
        },
        required: ["theme", "impact", "recommendation"],
      },
    },
    priorities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          action: { type: "string" },
          rationale: { type: "string" },
        },
        required: ["action", "rationale"],
      },
    },
  },
  required: ["overall_summary", "strengths", "issues", "priorities"],
} as const;

const SYNTHESIS_SYSTEM = [
  "You are the analyst behind a review-intelligence tool for small and mid-size businesses (hotels, restaurants, clinics, cafes). You are given a single business's review statistics and a compact list of its analysed reviews. Produce the qualitative read an owner would pay for.",
  "",
  "Return:",
  "- overall_summary: 2–3 sentences. The honest state of play — what the reviews say about this business overall. Specific, not generic; name the dominant theme.",
  "- strengths: the genuine strengths, most-evidenced first. For each, give the theme (use a topic id from the supplied rollups) and one short representative quote drawn from the reviews (verbatim or lightly trimmed — never invented).",
  "- issues: the real problems, most damaging first. For each: the theme (a topic id), the impact (why it costs the business — lost bookings, bad word of mouth, refunds), and a concrete recommendation the owner can act on.",
  "- priorities: the few things to do next, most important first — the short list an owner should act on this month. Each is an action plus a rationale tied to the data.",
  "",
  "Be decisive and concrete. Ground everything in the supplied data — do not invent themes, quotes, or numbers. Three or four well-chosen items beat ten weak ones. Write plainly, for a busy owner.",
].join("\n");

/** A compact, token-bounded view of one review for the synthesis prompt. */
function compactReview(review: Review, analysis: ReviewAnalysis): Record<string, unknown> {
  const themes = analysis.themes.map((t) => `${t.topic}:${t.polarity}`).join(", ");
  const text = review.text.length > 360 ? `${review.text.slice(0, 360)}…` : review.text;
  return {
    rating: review.rating,
    lang: analysis.language,
    sentiment: analysis.sentiment,
    themes,
    text,
  };
}

function buildUserPayload(
  business: BusinessContext,
  stats: DeterministicStats,
  reviews: Review[],
  analyses: ReviewAnalysis[],
): string {
  const byId = new Map(analyses.map((a) => [a.id, a]));
  const compact = reviews
    .map((r) => {
      const a = byId.get(r.id);
      return a ? compactReview(r, a) : null;
    })
    .filter((x): x is Record<string, unknown> => x !== null);

  const themeRollups = stats.themes.map((t) => ({
    topic: t.topic,
    label: topicLabel(t.topic),
    mentions: t.mentions,
    positive: t.positive,
    negative: t.negative,
  }));

  const payload = {
    business,
    stats: {
      rating_average: stats.rating_average,
      rating_distribution: stats.rating_distribution,
      rating_trend: stats.rating_trend,
      sentiment_breakdown: stats.sentiment_breakdown,
      language_breakdown: stats.language_breakdown,
    },
    theme_rollups: themeRollups,
    reviews: compact,
  };

  return [
    "Here is the business, its computed statistics, the theme rollups (with exact mention counts), and the analysed reviews.",
    "",
    "```json",
    JSON.stringify(payload, null, 2),
    "```",
    "",
    "Use the topic ids from theme_rollups when you name a theme. Pick example quotes from the reviews above.",
  ].join("\n");
}

export interface SynthesisResult {
  overall_summary: string;
  strengths: Strength[];
  issues: Issue[];
  priorities: Priority[];
  usage: RawUsage;
  usd: number;
}

interface RawSynthesis {
  overall_summary: string;
  strengths: Array<{ theme: string; example: string }>;
  issues: Array<{ theme: string; impact: string; recommendation: string }>;
  priorities: Array<{ action: string; rationale: string }>;
}

function firstText(content: Anthropic.Messages.ContentBlock[]): string {
  for (const block of content) {
    if (block.type === "text") return block.text;
  }
  throw new Error("no text block in synthesis response");
}

export async function synthesize(
  client: Anthropic,
  business: BusinessContext,
  stats: DeterministicStats,
  reviews: Review[],
  analyses: ReviewAnalysis[],
): Promise<SynthesisResult> {
  const response = await client.messages.create({
    model: SYNTHESIS_MODEL,
    max_tokens: 4000,
    thinking: { type: "adaptive" },
    system: [{ type: "text", text: SYNTHESIS_SYSTEM, cache_control: { type: "ephemeral" } }],
    output_config: { format: { type: "json_schema", schema: SYNTHESIS_SCHEMA } },
    messages: [{ role: "user", content: buildUserPayload(business, stats, reviews, analyses) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("synthesis: model refused");
  }

  const parsed = mergeWithCounts(JSON.parse(firstText(response.content)) as RawSynthesis, stats);
  return {
    ...parsed,
    usage: response.usage,
    usd: costUsd(SYNTHESIS_MODEL, response.usage),
  };
}

/** Join the model's qualitative picks back to the exact mention counts from the rollups. */
function mergeWithCounts(
  raw: RawSynthesis,
  stats: DeterministicStats,
): Pick<SynthesisResult, "overall_summary" | "strengths" | "issues" | "priorities"> {
  const mentionsOf = new Map(stats.themes.map((t) => [t.topic, t.mentions]));

  const strengths: Strength[] = (raw.strengths ?? []).map((s) => ({
    theme: s.theme,
    mentions: mentionsOf.get(s.theme) ?? 0,
    example: s.example,
  }));

  const issues: Issue[] = (raw.issues ?? []).map((i) => ({
    theme: i.theme,
    mentions: mentionsOf.get(i.theme) ?? 0,
    impact: i.impact,
    recommendation: i.recommendation,
  }));

  const priorities: Priority[] = (raw.priorities ?? []).map((p, idx) => ({
    rank: idx + 1,
    action: p.action,
    rationale: p.rationale,
  }));

  return { overall_summary: raw.overall_summary ?? "", strengths, issues, priorities };
}
