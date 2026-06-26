/**
 * Small, pure helpers for the research loop — content-block extraction, usage
 * accumulation across continuation hops, source collection (handling the list-vs-
 * error-object shape of web_search_tool_result), and search counting. No `any`:
 * content blocks arrive as `unknown` and are narrowed with guards.
 */

import type { RawUsage } from "./client";
import type { BriefSource, OutreachFacts } from "./types";

export interface UsageAgg {
  input: number;
  output: number;
  cacheRead: number;
  cacheWrite: number;
  searches: number;
  usd: number;
}

export function newUsageAgg(): UsageAgg {
  return { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, searches: 0, usd: 0 };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

/** All text blocks joined — the model's prose (the dossier). */
export function extractText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  const parts: string[] = [];
  for (const b of content) if (isObj(b) && b.type === "text" && typeof b.text === "string") parts.push(b.text);
  return parts.join("\n").trim();
}

/** The first text block — the structured-output JSON from the synthesis call. */
export function firstText(content: unknown): string {
  if (Array.isArray(content)) {
    for (const b of content) if (isObj(b) && b.type === "text" && typeof b.text === "string") return b.text;
  }
  throw new Error("no text block in response");
}

export function accumulateUsage(
  agg: UsageAgg,
  usage: RawUsage | null | undefined,
  model: string,
  cost: (m: string, u: RawUsage) => number,
): void {
  const u: RawUsage = usage ?? {};
  agg.input += u.input_tokens ?? 0;
  agg.output += u.output_tokens ?? 0;
  agg.cacheRead += u.cache_read_input_tokens ?? 0;
  agg.cacheWrite += u.cache_creation_input_tokens ?? 0;
  agg.usd += cost(model, u);
}

/** Count server_tool_use web_search blocks — one per search the model ran (for cost). */
export function countSearches(content: unknown, agg: UsageAgg): void {
  if (!Array.isArray(content)) return;
  for (const b of content) if (isObj(b) && b.type === "server_tool_use" && b.name === "web_search") agg.searches += 1;
}

/**
 * Pull web_search_result url/title into the sources map (deduped by url). On a
 * tool error the result `.content` is a single object (e.g. { error_code }) rather
 * than a list — guarded by the Array.isArray check, so an error never throws.
 */
export function collectSources(content: unknown, out: Map<string, BriefSource>): void {
  if (!Array.isArray(content)) return;
  for (const b of content) {
    if (!isObj(b) || b.type !== "web_search_tool_result") continue;
    const c = b.content;
    if (!Array.isArray(c)) continue; // error object → skip
    for (const r of c) {
      if (isObj(r) && r.type === "web_search_result" && typeof r.url === "string") {
        out.set(r.url, { url: r.url, title: typeof r.title === "string" && r.title ? r.title : r.url });
      }
    }
  }
}

export function buildResearchPrompt(facts: OutreachFacts): string {
  return [
    "Research this business and produce a current, cited dossier. Facts (use exactly, never contradict):",
    "```json",
    JSON.stringify(facts, null, 2),
    "```",
    "Begin by searching the business name + area, then its website. Build the dossier per your instructions; end with 'Confidence & gaps'.",
  ].join("\n");
}
