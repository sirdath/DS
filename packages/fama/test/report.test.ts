import { describe, expect, it } from "vitest";
import { renderReport, type FamaReport } from "../src/index.js";

const REPORT: FamaReport = {
  generated_by: "Fama (test)",
  business: { name: "Aetheria Suites", type: "boutique hotel", location: "Plaka" },
  review_count: 4,
  date_range: { from: "2026-01-01", to: "2026-04-01" },
  analyses: [
    {
      id: "r3",
      language: "en",
      sentiment: "negative",
      sentiment_score: -0.8,
      themes: [{ topic: "room_quality", polarity: "negative" }],
      summary: "AC broken for the whole stay",
      reply_draft: "We're so sorry the room was too warm — that's not acceptable and we'll make it right.",
      reply_priority: "high",
    },
  ],
  aggregate: {
    overall_summary: "Loved for location and staff; let down by small rooms and AC reliability.",
    rating_average: 4.1,
    rating_distribution: { "1": 0, "2": 1, "3": 0, "4": 1, "5": 2 },
    rating_trend: -0.5,
    sentiment_breakdown: { positive: 3, neutral: 0, negative: 1 },
    language_breakdown: { el: 2, en: 2, other: 0 },
    themes: [
      { topic: "staff", mentions: 3, positive: 3, negative: 0 },
      { topic: "room_quality", mentions: 2, positive: 0, negative: 2 },
    ],
    strengths: [{ theme: "staff", mentions: 3, example: "Giorgos remembered our names from day one." }],
    issues: [
      {
        theme: "room_quality",
        mentions: 2,
        impact: "Low-rating reviews cite cramped rooms and failing AC, deterring bookings.",
        recommendation: "Service the AC units and set guest expectations on room size at booking.",
      },
    ],
    priorities: [{ rank: 1, action: "Fix the air conditioning", rationale: "Named in the two lowest reviews." }],
  },
  usage: { input_tokens: 12000, output_tokens: 3000, cache_read_tokens: 8000, cache_write_tokens: 500, usd: 0.1234 },
};

describe("renderReport", () => {
  const md = renderReport(REPORT);

  it("should headline the business and rating", () => {
    expect(md).toContain("# Aetheria Suites — review intelligence");
    expect(md).toContain("4.10★ average");
  });

  it("should show the trend as slipping when negative", () => {
    expect(md).toContain("slipping");
  });

  it("should render the overall summary", () => {
    expect(md).toContain("Loved for location and staff");
  });

  it("should list strengths, issues and priorities", () => {
    expect(md).toContain("## What's working");
    expect(md).toContain("Giorgos remembered our names");
    expect(md).toContain("## What's costing you");
    expect(md).toContain("Service the AC units");
    expect(md).toContain("## Do this next");
    expect(md).toContain("Fix the air conditioning");
  });

  it("should queue the high-priority reply with its draft", () => {
    expect(md).toContain("## Reply queue");
    expect(md).toContain("AC broken for the whole stay");
    expect(md).toContain("make it right");
  });

  it("should render a themes table with human labels", () => {
    expect(md).toContain("| Theme | Mentions | Positive | Negative | Net |");
    expect(md).toContain("Room Quality");
  });

  it("should print the cost footer", () => {
    expect(md).toContain("$0.1234");
  });
});
