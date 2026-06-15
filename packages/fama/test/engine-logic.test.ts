import { describe, expect, it } from "vitest";
import {
  buildSystemPrompt,
  computeStats,
  costUsd,
  dateRange,
  parseAnalysis,
  type BusinessContext,
  type Review,
  type ReviewAnalysis,
} from "../src/index.js";

const REVIEWS: Review[] = [
  { id: "r1", platform: "google", author: "A", rating: 5, text: "x", date: "2026-01-01" },
  { id: "r2", platform: "google", author: "B", rating: 4, text: "x", date: "2026-02-01" },
  { id: "r3", platform: "google", author: "C", rating: 2, text: "x", date: "2026-03-01" },
  { id: "r4", platform: "google", author: "D", rating: 5, text: "x", date: "2026-04-01" },
];

const ANALYSES: ReviewAnalysis[] = [
  {
    id: "r1",
    language: "el",
    sentiment: "positive",
    sentiment_score: 0.9,
    themes: [
      { topic: "staff", polarity: "positive" },
      { topic: "location", polarity: "positive" },
    ],
    summary: "",
    reply_draft: "",
    reply_priority: "normal",
  },
  {
    id: "r2",
    language: "en",
    sentiment: "positive",
    sentiment_score: 0.6,
    themes: [{ topic: "staff", polarity: "positive" }],
    summary: "",
    reply_draft: "",
    reply_priority: "normal",
  },
  {
    id: "r3",
    language: "el",
    sentiment: "negative",
    sentiment_score: -0.7,
    themes: [
      { topic: "wait_time", polarity: "negative" },
      { topic: "staff", polarity: "negative" },
    ],
    summary: "",
    reply_draft: "",
    reply_priority: "high",
  },
  {
    id: "r4",
    language: "en",
    sentiment: "positive",
    sentiment_score: 0.8,
    themes: [{ topic: "location", polarity: "positive" }],
    summary: "",
    reply_draft: "",
    reply_priority: "normal",
  },
];

describe("computeStats", () => {
  const stats = computeStats(REVIEWS, ANALYSES);

  it("should average the ratings", () => {
    expect(stats.rating_average).toBe(4);
  });

  it("should count the rating distribution by star", () => {
    expect(stats.rating_distribution).toEqual({ "1": 0, "2": 1, "3": 0, "4": 1, "5": 2 });
  });

  it("should compute a recent-minus-older trend", () => {
    // sorted by date ratings = [5,4,2,5]; older avg 4.5, recent avg 3.5 → -1
    expect(stats.rating_trend).toBe(-1);
  });

  it("should break sentiment down", () => {
    expect(stats.sentiment_breakdown).toEqual({ positive: 3, neutral: 0, negative: 1 });
  });

  it("should break language down", () => {
    expect(stats.language_breakdown).toEqual({ el: 2, en: 2, other: 0 });
  });

  it("should roll themes up by topic, sorted by mentions", () => {
    expect(stats.themes).toEqual([
      { topic: "staff", mentions: 3, positive: 2, negative: 1 },
      { topic: "location", mentions: 2, positive: 2, negative: 0 },
      { topic: "wait_time", mentions: 1, positive: 0, negative: 1 },
    ]);
  });

  it("should return a flat trend when there are too few reviews", () => {
    const few = computeStats(REVIEWS.slice(0, 2), ANALYSES.slice(0, 2));
    expect(few.rating_trend).toBe(0);
  });
});

describe("dateRange", () => {
  it("should return the earliest and latest dates", () => {
    expect(dateRange(REVIEWS)).toEqual({ from: "2026-01-01", to: "2026-04-01" });
  });

  it("should return empty strings for no reviews", () => {
    expect(dateRange([])).toEqual({ from: "", to: "" });
  });
});

describe("parseAnalysis", () => {
  const review: Review = { id: "r9", platform: "google", author: "Z", rating: 1, text: "x", date: "2026-01-01" };

  it("should normalise out-of-range and invalid values", () => {
    const json = JSON.stringify({
      language: "fr",
      sentiment: "glowing",
      sentiment_score: 2.5,
      themes: [
        { topic: "staff", polarity: "positive" },
        { topic: "x", polarity: "bad" },
      ],
      summary: "good",
      reply_draft: "thanks",
      reply_priority: "urgent",
    });
    const out = parseAnalysis(json, review);

    expect(out.id).toBe("r9");
    expect(out.language).toBe("other"); // "fr" is not a valid Lang
    expect(out.sentiment).toBe("neutral"); // "glowing" → neutral
    expect(out.sentiment_score).toBe(1); // clamped from 2.5
    expect(out.themes).toEqual([
      { topic: "staff", polarity: "positive" },
      { topic: "x", polarity: "neutral" }, // "bad" → neutral
    ]);
    expect(out.reply_priority).toBe("normal"); // "urgent" → normal
  });

  it("should fall back to the review's declared language", () => {
    const out = parseAnalysis(JSON.stringify({ sentiment: "positive" }), { ...review, language: "el" });
    expect(out.language).toBe("el");
  });

  it("should tolerate missing themes", () => {
    const out = parseAnalysis(JSON.stringify({ sentiment: "positive" }), review);
    expect(out.themes).toEqual([]);
  });
});

describe("buildSystemPrompt", () => {
  const business: BusinessContext = { name: "Aetheria Suites", type: "boutique hotel", location: "Plaka" };

  it("should embed the business identity and theme taxonomy", () => {
    const prompt = buildSystemPrompt(business);
    expect(prompt).toContain("Aetheria Suites");
    expect(prompt).toContain("boutique hotel");
    expect(prompt).toContain("Plaka");
    expect(prompt).toContain("staff"); // a taxonomy topic
  });

  it("should use the default voice when none is supplied", () => {
    expect(buildSystemPrompt(business)).toContain("warm, genuine");
  });

  it("should use a custom voice when supplied", () => {
    const prompt = buildSystemPrompt({ ...business, voice: "crisp and clinical" });
    expect(prompt).toContain("crisp and clinical");
  });
});

describe("costUsd", () => {
  it("should price input, output and cache reads", () => {
    const usd = costUsd("claude-sonnet-4-6", {
      input_tokens: 1000,
      output_tokens: 500,
      cache_read_input_tokens: 2000,
      cache_creation_input_tokens: 0,
    });
    // (1000*3 + 2000*3*0.1 + 500*15) / 1e6 = 11100/1e6
    expect(usd).toBeCloseTo(0.0111, 6);
  });

  it("should return 0 for an unknown model", () => {
    expect(costUsd("not-a-model", { input_tokens: 1000 })).toBe(0);
  });
});
