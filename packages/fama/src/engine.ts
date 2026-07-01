/**
 * The engine — turn a batch of reviews into a FamaReport.
 *
 * Two passes: a bounded-concurrency per-review read (Sonnet, cheap, cached system
 * prompt) followed by one cross-review synthesis (Opus). Deterministic stats are
 * computed in code between the two. Every call's token usage and cost is summed so
 * the report carries an exact, auditable price tag.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { analyzeReview, buildSystemPrompt } from "./analyze-review";
import { getClient, PER_REVIEW_MODEL, SYNTHESIS_MODEL, type RawUsage } from "./client";
import { computeStats, dateRange } from "./stats";
import { synthesize } from "./synthesize";
import type {
  BusinessContext,
  FamaAggregate,
  FamaReport,
  FamaUsage,
  Review,
  ReviewAnalysis,
} from "./types";

export interface AnalyzeOptions {
  /** Explicit Anthropic client (e.g. with a custom key). Defaults to a fresh one. */
  client?: Anthropic;
  /** API key, used only when `client` is not supplied. Falls back to env when both absent. */
  apiKey?: string;
  /** Max concurrent per-review calls. Default 5 — polite to rate limits, still fast. */
  concurrency?: number;
  /** Called after each review is analysed, for progress UIs. */
  onProgress?: (done: number, total: number) => void;
}

const DEFAULT_CONCURRENCY = 5;

/** Map over items with a fixed concurrency ceiling, preserving input order. */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  async function worker(): Promise<void> {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      const item = items[i] as T;
      results[i] = await fn(item, i);
    }
  }
  const workerCount = Math.max(1, Math.min(limit, items.length));
  await Promise.all(Array.from({ length: workerCount }, () => worker()));
  return results;
}

function emptyUsage(): FamaUsage {
  return { input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_write_tokens: 0, usd: 0 };
}

function addUsage(acc: FamaUsage, usage: RawUsage, usd: number): void {
  acc.input_tokens += usage.input_tokens ?? 0;
  acc.output_tokens += usage.output_tokens ?? 0;
  acc.cache_read_tokens += usage.cache_read_input_tokens ?? 0;
  acc.cache_write_tokens += usage.cache_creation_input_tokens ?? 0;
  acc.usd += usd;
}

/**
 * Analyse a batch of reviews for one business and return the full report:
 * every per-review read, the aggregate (deterministic stats + model synthesis),
 * and the summed token usage and cost.
 */
export async function analyzeReviews(
  reviews: Review[],
  business: BusinessContext,
  opts: AnalyzeOptions = {},
): Promise<FamaReport> {
  if (reviews.length === 0) {
    throw new Error("analyzeReviews: no reviews supplied");
  }

  const client = opts.client ?? getClient(opts.apiKey);
  const concurrency = opts.concurrency ?? DEFAULT_CONCURRENCY;
  const systemPrompt = buildSystemPrompt(business);
  const usage = emptyUsage();

  let done = 0;
  const perReview = await mapWithConcurrency(reviews, concurrency, async (review) => {
    const result = await analyzeReview(client, review, systemPrompt);
    addUsage(usage, result.usage, result.usd);
    done += 1;
    opts.onProgress?.(done, reviews.length);
    return result.analysis;
  });

  const analyses: ReviewAnalysis[] = perReview;
  const stats = computeStats(reviews, analyses);
  const synth = await synthesize(client, business, stats, reviews, analyses);
  addUsage(usage, synth.usage, synth.usd);

  const aggregate: FamaAggregate = {
    overall_summary: synth.overall_summary,
    rating_average: stats.rating_average,
    rating_distribution: stats.rating_distribution,
    rating_trend: stats.rating_trend,
    sentiment_breakdown: stats.sentiment_breakdown,
    language_breakdown: stats.language_breakdown,
    themes: stats.themes,
    strengths: synth.strengths,
    issues: synth.issues,
    priorities: synth.priorities,
  };

  return {
    generated_by: `Fama (${PER_REVIEW_MODEL} + ${SYNTHESIS_MODEL})`,
    business,
    review_count: reviews.length,
    date_range: dateRange(reviews),
    analyses,
    aggregate,
    usage,
  };
}
