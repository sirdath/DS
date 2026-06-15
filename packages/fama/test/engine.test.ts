import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { analyzeReviews, PER_REVIEW_MODEL, SYNTHESIS_MODEL, type BusinessContext, type Review } from "../src/index.js";

const BUSINESS: BusinessContext = { name: "Test Cafe", type: "cafe", location: "Athens" };

const REVIEWS: Review[] = [
  { id: "r1", platform: "google", author: "A", rating: 5, text: "Great coffee, lovely staff.", date: "2026-01-01", language: "en" },
  { id: "r2", platform: "google", author: "B", rating: 4, text: "Good but slow service.", date: "2026-02-01", language: "en" },
  { id: "r3", platform: "google", author: "C", rating: 2, text: "Too noisy and pricey.", date: "2026-03-01", language: "en" },
];

const PER_REVIEW_JSON = JSON.stringify({
  language: "en",
  sentiment: "positive",
  sentiment_score: 0.5,
  themes: [{ topic: "staff", polarity: "positive" }],
  summary: "A happy customer",
  reply_draft: "Thank you so much!",
  reply_priority: "normal",
});

const SYNTHESIS_JSON = JSON.stringify({
  overall_summary: "Well liked for staff; watch service speed.",
  strengths: [{ theme: "staff", example: "lovely staff" }],
  issues: [{ theme: "service_speed", impact: "slow service frustrates customers", recommendation: "add a barista at peak" }],
  priorities: [{ action: "Hire peak-hour help", rationale: "Service speed recurs in mid reviews." }],
});

/** A fake Anthropic client that returns canned JSON depending on the model called. */
function fakeClient(): Anthropic {
  const create = (params: { model: string }) => {
    const text = params.model === SYNTHESIS_MODEL ? SYNTHESIS_JSON : PER_REVIEW_JSON;
    return Promise.resolve({
      stop_reason: "end_turn",
      content: [{ type: "text", text }],
      usage: {
        input_tokens: 100,
        output_tokens: 50,
        cache_read_input_tokens: 10,
        cache_creation_input_tokens: 5,
      },
    });
  };
  return { messages: { create } } as unknown as Anthropic;
}

describe("analyzeReviews", () => {
  it("should orchestrate per-review analysis + synthesis into a full report", async () => {
    const report = await analyzeReviews(REVIEWS, BUSINESS, { client: fakeClient() });

    expect(report.review_count).toBe(3);
    expect(report.analyses).toHaveLength(3);
    expect(report.analyses.map((a) => a.id)).toEqual(["r1", "r2", "r3"]); // input order preserved
    expect(report.business).toEqual(BUSINESS);
    expect(report.date_range).toEqual({ from: "2026-01-01", to: "2026-03-01" });
    expect(report.generated_by).toContain(PER_REVIEW_MODEL);
    expect(report.generated_by).toContain(SYNTHESIS_MODEL);
  });

  it("should compute the deterministic aggregate from the analyses", async () => {
    const report = await analyzeReviews(REVIEWS, BUSINESS, { client: fakeClient() });
    const agg = report.aggregate;

    expect(agg.rating_average).toBeCloseTo(3.67, 2);
    expect(agg.rating_distribution).toEqual({ "1": 0, "2": 1, "3": 0, "4": 1, "5": 1 });
    expect(agg.sentiment_breakdown).toEqual({ positive: 3, neutral: 0, negative: 0 });
    expect(agg.overall_summary).toContain("Well liked for staff");
    expect(agg.strengths[0]?.theme).toBe("staff");
    expect(agg.strengths[0]?.mentions).toBe(3); // joined from the rollup, not the model
    expect(agg.priorities[0]?.rank).toBe(1);
  });

  it("should sum token usage and cost across every call", async () => {
    const report = await analyzeReviews(REVIEWS, BUSINESS, { client: fakeClient() });
    // 3 per-review calls + 1 synthesis = 4 calls
    expect(report.usage.input_tokens).toBe(400);
    expect(report.usage.output_tokens).toBe(200);
    expect(report.usage.cache_read_tokens).toBe(40);
    expect(report.usage.cache_write_tokens).toBe(20);
    expect(report.usage.usd).toBeGreaterThan(0);
  });

  it("should report progress for each review", async () => {
    const seen: Array<[number, number]> = [];
    await analyzeReviews(REVIEWS, BUSINESS, {
      client: fakeClient(),
      onProgress: (done, total) => seen.push([done, total]),
    });
    expect(seen).toHaveLength(3);
    expect(seen.at(-1)).toEqual([3, 3]);
  });

  it("should reject an empty review list", async () => {
    await expect(analyzeReviews([], BUSINESS, { client: fakeClient() })).rejects.toThrow(/no reviews/);
  });
});
