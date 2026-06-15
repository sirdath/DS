/**
 * Argus — DS2's competitor-watch engine. Observes a few named competitors weekly,
 * detects what changed with a pure deterministic diff core, scores each change's
 * impact by rules, and uses Claude only to write the weekly briefing + recommendations
 * from the computed facts. Code owns every number; the model owns prose.
 *
 * Primary entry point: `runWeeklyBriefing(opts) → { briefing, snapshots }`.
 */

export { runWeeklyBriefing } from "./engine";
export type { WeeklyBriefingOptions, WeeklyBriefingResult } from "./engine";

export { detectMovements } from "./detect";
export { buildBoard } from "./board";
export { bandFromMagnitude, movementOrder } from "./impact";
export { buildBriefingFacts } from "./facts";
export { writeBriefing } from "./briefing";
export type { BriefingResult, WriteBriefingOptions } from "./briefing";
export { factCheck } from "./factcheck";
export type { FactCheckResult } from "./factcheck";

export { formatMoney, pctChange, asPct } from "./money";

export type { Observer } from "./observer";
export { ExampleObserver } from "./observer";
export { FirecrawlObserver } from "./observers/firecrawl";
export type { FirecrawlObserverOptions } from "./observers/firecrawl";

export { getClient, costUsd, BRIEF_MODEL } from "./client";
export type { RawUsage } from "./client";

export {
  SAMPLE_BUSINESS,
  SAMPLE_COMPETITORS,
  SAMPLE_PREV_SNAPSHOTS,
  SAMPLE_PREV_WEEK,
  SAMPLE_WEEK_OF,
  SAMPLE_CURR,
  getSample,
} from "./samples";

export type {
  Lang,
  Currency,
  Minor,
  IsoDate,
  MovementType,
  Impact,
  BusinessRef,
  CompetitorRef,
  CompetitorMetrics,
  WeeklySnapshot,
  Movement,
  BoardRow,
  Recommendation,
  ArgusUsage,
  BriefingFacts,
  Briefing,
} from "./types";
