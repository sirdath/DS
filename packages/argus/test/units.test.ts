import { describe, expect, it } from "vitest";
import {
  asPct,
  bandFromMagnitude,
  buildBoard,
  costUsd,
  detectMovements,
  factCheck,
  formatMoney,
  getSample,
  pctChange,
  type BriefingFacts,
  type CompetitorRef,
  type WeeklySnapshot,
} from "../src/index";

const COMP: CompetitorRef[] = [{ id: "c1", name: "Rival Co", url: "rival.gr" }];
const week = "2026-06-08";
const prevWeek = "2026-06-01";

function snap(metrics: WeeklySnapshot["metrics"], weekOf = week): WeeklySnapshot {
  return { competitorId: "c1", weekOf, metrics };
}

describe("money + ratios", () => {
  it("should format minor units and compute percentage change", () => {
    expect(formatMoney(12500, "EUR")).toBe("€125");
    expect(formatMoney(12550, "EUR")).toBe("€125.50");
    expect(asPct(pctChange(14200, 12500))).toBe(-12);
    expect(pctChange(0, 0)).toBe(0);
  });
});

describe("impact — bandFromMagnitude", () => {
  it("should band by thresholds and cap weak signals", () => {
    expect(bandFromMagnitude(0.8, "pricing")).toBe("high");
    expect(bandFromMagnitude(0.4, "pricing")).toBe("medium");
    expect(bandFromMagnitude(0.1, "pricing")).toBe("low");
    // social is ceilinged at medium however large.
    expect(bandFromMagnitude(0.95, "social")).toBe("medium");
    expect(bandFromMagnitude(0.95, "hiring")).toBe("low");
  });
});

describe("detect — per-signal movements", () => {
  it("should detect a price cut with a computed delta", () => {
    const m = detectMovements([snap({ avgRate: 14200, currency: "EUR" }, prevWeek)], [snap({ avgRate: 12500, currency: "EUR" })], COMP, week);
    expect(m).toHaveLength(1);
    expect(m[0]?.type).toBe("pricing");
    expect(m[0]?.impact).toBe("high");
    expect(m[0]?.headline).toContain("-12%");
  });

  it("should ignore sub-threshold price noise", () => {
    const m = detectMovements([snap({ avgRate: 10000 }, prevWeek)], [snap({ avgRate: 10100 })], COMP, week);
    expect(m).toHaveLength(0);
  });

  it("should detect an SEO swing into #1 as high impact", () => {
    const m = detectMovements(
      [snap({ seoRanks: { "boutique hotel": 4 } }, prevWeek)],
      [snap({ seoRanks: { "boutique hotel": 1 } })],
      COMP,
      week,
    );
    expect(m[0]?.type).toBe("seo");
    expect(m[0]?.impact).toBe("high");
  });

  it("should detect a launched offer and a review surge", () => {
    const offer = detectMovements([snap({ offers: [] }, prevWeek)], [snap({ offers: ["Free transfer"] })], COMP, week);
    expect(offer[0]?.type).toBe("offer");

    const reviews = detectMovements([snap({ reviewCount: 593, rating: 4.7 }, prevWeek)], [snap({ reviewCount: 612, rating: 4.7 })], COMP, week);
    expect(reviews[0]?.type).toBe("reviews");
    expect(reviews[0]?.detail).toContain("612");
  });

  it("should only diff signals present in both weeks", () => {
    // avgRate appears only this week → no false movement.
    const m = detectMovements([snap({ reviewCount: 100 }, prevWeek)], [snap({ reviewCount: 100, avgRate: 9999 })], COMP, week);
    expect(m).toHaveLength(0);
  });

  it("should NOT emit an SEO movement when the rank is unchanged (incl. pinned #1)", () => {
    const pinned = detectMovements([snap({ seoRanks: { kw: 1 } }, prevWeek)], [snap({ seoRanks: { kw: 1 } })], COMP, week);
    expect(pinned).toHaveLength(0);
    const same = detectMovements([snap({ seoRanks: { kw: 5 } }, prevWeek)], [snap({ seoRanks: { kw: 5 } })], COMP, week);
    expect(same).toHaveLength(0);
  });

  it("should frame a review drop as a rating story, never as negative 'new reviews'", () => {
    const m = detectMovements(
      [snap({ reviewCount: 120, rating: 4.6 }, prevWeek)],
      [snap({ reviewCount: 118, rating: 4.3 })],
      COMP,
      week,
    );
    expect(m[0]?.type).toBe("reviews");
    expect(m[0]?.headline).not.toContain("-");
    expect(m[0]?.headline.toLowerCase()).toContain("rating");
  });
});

describe("board — week-over-week deltas", () => {
  it("should compute rate, rating, velocity and follower deltas", () => {
    const prev: WeeklySnapshot[] = [snap({ avgRate: 14200, rating: 4.5, reviewCount: 477, instagramFollowers: 6100 }, prevWeek)];
    const curr: WeeklySnapshot[] = [snap({ avgRate: 12500, rating: 4.6, reviewCount: 481, instagramFollowers: 6200 })];
    const board = buildBoard(prev, curr, COMP);
    expect(board[0]?.rateDeltaPct).toBe(-12);
    expect(board[0]?.ratingDelta).toBe(0.1);
    expect(board[0]?.reviewVelocity).toBe(4);
  });
});

describe("factCheck — briefing guard", () => {
  const facts: BriefingFacts = {
    business: "Aetheria Suites",
    location: "Plaka",
    weekOf: week,
    lang: "en",
    competitorNames: ["Rival Co"],
    movements: [{ competitor: "Rival Co", type: "pricing", impact: "high", headline: "Cut rates -12%", detail: "€142 → €125." }],
    board: [{ name: "Rival Co", line: "rate €125" }],
  };

  it("should pass a grounded, well-formed briefing", () => {
    const r = factCheck("Rival Co cut midweek rates 12%.", [{ action: "Hold rate", rationale: "Defend ADR." }], facts);
    expect(r.passed).toBe(true);
  });

  it("should fail when the summary names no tracked competitor", () => {
    const r = factCheck("Some generic market commentary.", [{ action: "Do x", rationale: "Because y." }], facts);
    expect(r.passed).toBe(false);
    expect(r.issues.join(" ")).toContain("competitor");
  });

  it("should fail an empty summary or malformed recommendation", () => {
    expect(factCheck("", [], facts).passed).toBe(false);
    expect(factCheck("Rival Co moved.", [{ action: "", rationale: "y" }], facts).passed).toBe(false);
  });

  it("should fail when the summary cites a figure not in the facts", () => {
    const r = factCheck("Rival Co slashed rates to €99 — a 35% cut.", [{ action: "Hold", rationale: "Defend ADR." }], facts);
    expect(r.passed).toBe(false);
    expect(r.issues.join(" ")).toContain("figures not in the facts");
  });

  it("should allow figures that do appear in the facts", () => {
    // "12%" is grounded in the movement headline "Cut rates -12%"; "#1" is a bare digit (not checked).
    const r = factCheck("Rival Co cut rates 12% and reached #1.", [{ action: "Hold", rationale: "Defend ADR." }], facts);
    expect(r.passed).toBe(true);
  });
});

describe("client — costUsd", () => {
  it("should price Sonnet input + output", () => {
    const usd = costUsd("claude-sonnet-4-6", { input_tokens: 1_000_000, output_tokens: 0 });
    expect(usd).toBeCloseTo(3, 5);
  });
});

describe("samples — shape", () => {
  it("should expose a four-competitor demo tenant", () => {
    const s = getSample();
    expect(s.competitors).toHaveLength(4);
    expect(Object.keys(s.currMetrics)).toHaveLength(4);
  });
});
