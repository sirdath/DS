/**
 * Fama — review intelligence. Aggregate a business's reviews and read them:
 * sentiment, themes, reply drafts, and the few things to fix next, in Greek and
 * English. Source-agnostic — feed it normalised Review objects from any platform.
 *
 * Primary entry point: `analyzeReviews(reviews, business, opts) → FamaReport`.
 */

export { analyzeReviews } from "./engine";
export type { AnalyzeOptions } from "./engine";

export { buildSystemPrompt, analyzeReview, parseAnalysis } from "./analyze-review";
export type { AnalyzeResult } from "./analyze-review";

export { synthesize } from "./synthesize";
export type { SynthesisResult } from "./synthesize";

export { computeStats, dateRange } from "./stats";
export type { DeterministicStats } from "./stats";

export { getClient, costUsd, PER_REVIEW_MODEL, SYNTHESIS_MODEL } from "./client";
export type { RawUsage } from "./client";

export { THEME_TOPICS, topicLabel } from "./taxonomy";
export type { ThemeTopic } from "./taxonomy";

export { renderReport } from "./report";

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
} from "./types";
