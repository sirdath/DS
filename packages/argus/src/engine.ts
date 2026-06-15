/**
 * The orchestrator — one business, one week. Observe each competitor's current
 * metrics → diff against last week → score the movements → build the board → (unless
 * scan-only) write the briefing prose from the computed facts. It returns both the
 * briefing and this week's snapshots, which the caller persists to become next
 * week's baseline. Deterministic in, deterministic out; the only non-determinism is
 * the single quarantined prose call.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { buildBoard } from "./board";
import { writeBriefing } from "./briefing";
import { detectMovements } from "./detect";
import { buildBriefingFacts } from "./facts";
import type { Observer } from "./observer";
import type { ArgusUsage, Briefing, BusinessRef, CompetitorRef, IsoDate, WeeklySnapshot } from "./types";

export interface WeeklyBriefingOptions {
  business: BusinessRef;
  competitors: CompetitorRef[];
  observer: Observer;
  prevSnapshots: WeeklySnapshot[];
  weekOf: IsoDate;
  client?: Anthropic;
  apiKey?: string;
  /** Skip the model call — compute movements + board only (no key needed). */
  scanOnly?: boolean;
}

export interface WeeklyBriefingResult {
  briefing: Briefing;
  /** This week's snapshots — persist as next week's prevSnapshots. */
  snapshots: WeeklySnapshot[];
}

const emptyUsage = (): ArgusUsage => ({ input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_write_tokens: 0, usd: 0 });

export async function runWeeklyBriefing(opts: WeeklyBriefingOptions): Promise<WeeklyBriefingResult> {
  const { business, competitors, observer, prevSnapshots, weekOf } = opts;

  const snapshots: WeeklySnapshot[] = await Promise.all(
    competitors.map(async (c) => ({ competitorId: c.id, weekOf, metrics: await observer.observe(c, business) })),
  );

  const movements = detectMovements(prevSnapshots, snapshots, competitors, weekOf);
  const board = buildBoard(prevSnapshots, snapshots, competitors);

  let summary = "";
  let recommendations: Briefing["recommendations"] = [];
  let usage = emptyUsage();
  let factCheckPassed = true;
  let factCheckIssues: string[] = [];

  if (!opts.scanOnly) {
    const facts = buildBriefingFacts(business, weekOf, movements, board);
    const result = await writeBriefing(facts, { client: opts.client, apiKey: opts.apiKey });
    summary = result.summary;
    recommendations = result.recommendations;
    usage = result.usage;
    factCheckPassed = result.factCheckPassed;
    factCheckIssues = result.factCheckIssues;
  }

  const briefing: Briefing = {
    business: business.name,
    location: business.location,
    weekOf,
    competitorCount: competitors.length,
    summary,
    recommendations,
    movements,
    board,
    factCheckPassed,
    factCheckIssues,
    usage,
  };

  return { briefing, snapshots };
}
