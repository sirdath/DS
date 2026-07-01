/**
 * Per-review analysis — one Sonnet 4.6 call per review.
 *
 * The system prompt (task + taxonomy + business context) is identical for every
 * review in a batch, so it is built once and cached; each review is the small
 * volatile suffix. Structured output guarantees a parseable result.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { costUsd, PER_REVIEW_MODEL, type RawUsage } from "./client";
import { THEME_TOPICS } from "./taxonomy";
import type { BusinessContext, Lang, Review, ReviewAnalysis, Sentiment } from "./types";

const ANALYSIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    language: { type: "string", enum: ["el", "en", "other"] },
    sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
    sentiment_score: { type: "number" },
    themes: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          topic: { type: "string" },
          polarity: { type: "string", enum: ["positive", "neutral", "negative"] },
        },
        required: ["topic", "polarity"],
      },
    },
    summary: { type: "string" },
    reply_draft: { type: "string" },
    reply_priority: { type: "string", enum: ["high", "normal", "none"] },
  },
  required: ["language", "sentiment", "sentiment_score", "themes", "summary", "reply_draft", "reply_priority"],
} as const;

export function buildSystemPrompt(business: BusinessContext): string {
  const voice =
    business.voice ??
    "warm, genuine and specific — the voice of an owner who reads every review and cares, never corporate or defensive";
  return [
    `You analyse a single customer review for "${business.name}", a ${business.type}${business.location ? ` in ${business.location}` : ""}, for an owner-facing review-intelligence tool. Greek and English reviews both occur; treat them equally.`,
    "",
    "For the review, return:",
    "- language: el, en, or other.",
    "- sentiment: positive | neutral | negative — the reviewer's overall stance.",
    "- sentiment_score: a number from -1 (furious) to 1 (delighted).",
    "- themes: every distinct aspect the review raises. Map each to the closest of these normalised topics; only invent a short snake_case topic if none fit:",
    `  ${THEME_TOPICS.join(", ")}.`,
    "  Each theme has its own polarity — a review can praise one thing and criticise another.",
    "- summary: one plain-English line capturing the review (for a dashboard).",
    `- reply_draft: a reply written IN THE REVIEW'S OWN LANGUAGE, in a ${voice} tone. Address the specific points raised, by name where the reviewer named staff or dishes. For criticism, acknowledge it sincerely and offer to make it right — never argue. 2–4 sentences. Sound human; do NOT leave placeholder brackets like [name].`,
    "- reply_priority: high (negative or low-rating — needs prompt damage control), normal (positive, worth a warm acknowledgement), or none (a reply would add nothing).",
    "",
    "Ground every theme in the actual text. Be precise, not generous.",
  ].join("\n");
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

function firstText(content: Anthropic.Messages.ContentBlock[]): string {
  for (const block of content) {
    if (block.type === "text") return block.text;
  }
  throw new Error("no text block in response");
}

export interface AnalyzeResult {
  analysis: ReviewAnalysis;
  usage: RawUsage;
  usd: number;
}

export async function analyzeReview(
  client: Anthropic,
  review: Review,
  systemPrompt: string,
): Promise<AnalyzeResult> {
  const response = await client.messages.create({
    model: PER_REVIEW_MODEL,
    max_tokens: 1200,
    thinking: { type: "disabled" },
    system: [{ type: "text", text: systemPrompt, cache_control: { type: "ephemeral" } }],
    output_config: { format: { type: "json_schema", schema: ANALYSIS_SCHEMA } },
    messages: [
      {
        role: "user",
        content: `Review (platform: ${review.platform}, rating: ${review.rating}/5, date: ${review.date}):\n\n${review.text}`,
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(`review ${review.id}: model refused`);
  }
  const parsed = parseAnalysis(firstText(response.content), review);
  return { analysis: parsed, usage: response.usage, usd: costUsd(PER_REVIEW_MODEL, response.usage) };
}

/** Parse + defensively normalise the model's JSON into a ReviewAnalysis. */
export function parseAnalysis(jsonText: string, review: Review): ReviewAnalysis {
  const raw = JSON.parse(jsonText) as Record<string, unknown>;
  const themes = Array.isArray(raw["themes"])
    ? (raw["themes"] as Array<Record<string, unknown>>).map((t) => ({
        topic: String(t["topic"] ?? "other"),
        polarity: normSentiment(t["polarity"]),
      }))
    : [];
  return {
    id: review.id,
    language: normLang(raw["language"], review.language),
    sentiment: normSentiment(raw["sentiment"]),
    sentiment_score: clamp(Number(raw["sentiment_score"] ?? 0), -1, 1),
    themes,
    summary: String(raw["summary"] ?? ""),
    reply_draft: String(raw["reply_draft"] ?? ""),
    reply_priority: normPriority(raw["reply_priority"]),
  };
}

function normSentiment(v: unknown): Sentiment {
  return v === "positive" || v === "negative" ? v : "neutral";
}
function normLang(v: unknown, fallback?: Lang): Lang {
  if (v === "el" || v === "en" || v === "other") return v;
  return fallback ?? "other";
}
function normPriority(v: unknown): ReviewAnalysis["reply_priority"] {
  return v === "high" || v === "none" ? v : "normal";
}
