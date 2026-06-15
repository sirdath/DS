/**
 * Fama data contract — the shapes that flow review-source → engine → report → UI.
 * Source-agnostic: a Review is whatever a platform (Google, Booking, …) yields,
 * normalised to this shape. The engine never knows where reviews came from.
 */

export type Platform = "google" | "booking" | "tripadvisor" | "other";
export type Lang = "el" | "en" | "other";
export type Sentiment = "positive" | "neutral" | "negative";

/** One incoming review, normalised from its source platform. */
export interface Review {
  id: string;
  platform: Platform;
  author: string;
  rating: number; // 1–5
  text: string;
  date: string; // ISO YYYY-MM-DD
  language?: Lang; // detected by the analyzer when absent
}

/** Who the reviews are about — shapes tone, theme relevance and reply voice. */
export interface BusinessContext {
  name: string;
  type: string; // "boutique hotel", "taverna", "dental clinic", …
  location?: string;
  voice?: string; // optional brand-voice note for reply drafts
}

/** A normalised topic mentioned in a review, with the reviewer's stance on it. */
export interface ThemeMention {
  topic: string; // from THEME_TOPICS where possible
  polarity: Sentiment;
}

/** The model's per-review read. */
export interface ReviewAnalysis {
  id: string;
  language: Lang;
  sentiment: Sentiment;
  sentiment_score: number; // -1 … 1
  themes: ThemeMention[];
  summary: string; // one line, English, for the dashboard
  reply_draft: string; // in the review's language, in the business's voice
  reply_priority: "high" | "normal" | "none"; // worth a reply, and how urgently
}

export interface ThemeRollup {
  topic: string;
  mentions: number;
  positive: number;
  negative: number;
}

export interface Strength {
  theme: string;
  mentions: number;
  example: string; // a representative quote
}

export interface Issue {
  theme: string;
  mentions: number;
  impact: string; // why it costs the business
  recommendation: string; // the fix
}

export interface Priority {
  rank: number;
  action: string; // the thing to do next
  rationale: string; // tied to the data
}

/** Deterministic stats computed in code + the model's qualitative synthesis. */
export interface FamaAggregate {
  overall_summary: string;
  rating_average: number;
  rating_distribution: Record<string, number>; // "1"…"5" → count
  rating_trend: number; // recent-avg − older-avg (negative = slipping)
  sentiment_breakdown: { positive: number; neutral: number; negative: number };
  language_breakdown: { el: number; en: number; other: number };
  themes: ThemeRollup[];
  strengths: Strength[];
  issues: Issue[];
  priorities: Priority[]; // the few things to fix next, ranked
}

export interface FamaUsage {
  input_tokens: number;
  output_tokens: number;
  cache_read_tokens: number;
  cache_write_tokens: number;
  usd: number;
}

/** The deliverable: everything a client digest / portal dashboard needs. */
export interface FamaReport {
  generated_by: string;
  business: BusinessContext;
  review_count: number;
  date_range: { from: string; to: string };
  analyses: ReviewAnalysis[];
  aggregate: FamaAggregate;
  usage: FamaUsage;
}
