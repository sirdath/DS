/**
 * Fama — review intelligence. Aggregate a business's reviews and read them:
 * sentiment, themes, reply drafts, and the few things to fix next, in Greek and
 * English. Source-agnostic — feed it normalised Review objects from any platform.
 *
 * Primary entry point: `analyzeReviews(reviews, business, opts) → FamaReport`.
 */

export { analyzeReviews } from "./engine.js";
export type { AnalyzeOptions } from "./engine.js";

export { buildSystemPrompt, analyzeReview, parseAnalysis } from "./analyze-review.js";
export type { AnalyzeResult } from "./analyze-review.js";

export { synthesize } from "./synthesize.js";
export type { SynthesisResult } from "./synthesize.js";

export { computeStats, dateRange } from "./stats.js";
export type { DeterministicStats } from "./stats.js";

export { getClient, costUsd, PER_REVIEW_MODEL, SYNTHESIS_MODEL } from "./client.js";
export type { RawUsage } from "./client.js";

export { THEME_TOPICS, topicLabel } from "./taxonomy.js";
export type { ThemeTopic } from "./taxonomy.js";

export { renderReport } from "./report.js";

export type {
  Platform,
  Lang,
  Sentiment,
  Review,
  BusinessContext,
  ThemeMention,
  ReviewAnalysis,
  ThemeRollup,
  Strength,
  Issue,
  Priority,
  FamaAggregate,
  FamaUsage,
  FamaReport,
} from "./types.js";
