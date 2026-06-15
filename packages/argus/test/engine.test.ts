import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { ExampleObserver, getSample, runWeeklyBriefing } from "../src/index";

/**
 * A fake Anthropic client: returns a JSON briefing as a single text block, echoing a
 * real competitor name so the fact-check passes. Mirrors the fama/plutus test stub.
 */
function fakeClient(summary: string): Anthropic {
  return {
    messages: {
      create: async () => ({
        stop_reason: "end_turn",
        content: [
          {
            type: "text",
            text: JSON.stringify({
              summary,
              recommendations: [
                { action: "Defend midweek without a price war", rationale: "Matching the cut erodes ADR." },
                { action: "Reclaim the search ranking", rationale: "#1 vs #2 is a large click share." },
              ],
            }),
          },
        ],
        usage: { input_tokens: 1200, output_tokens: 300, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
      }),
    },
  } as unknown as Anthropic;
}

describe("runWeeklyBriefing — full cycle on the sample", () => {
  it("should compute movements + board and narrate from facts", async () => {
    const s = getSample();
    const observer = new ExampleObserver(s.currMetrics);
    const { briefing, snapshots } = await runWeeklyBriefing({
      business: s.business,
      competitors: s.competitors,
      observer,
      prevSnapshots: s.prevSnapshots,
      weekOf: s.weekOf,
      client: fakeClient("Plaka Central Suites cut weeknight rates 12% and took #1 for boutique hotel Plaka."),
    });

    // Deterministic core produced movements + a full board.
    expect(briefing.movements.length).toBeGreaterThanOrEqual(5);
    expect(briefing.board).toHaveLength(4);
    expect(briefing.competitorCount).toBe(4);

    // The strongest movements lead.
    expect(briefing.movements[0]?.impact).toBe("high");

    // The price cut is detected with the right number.
    const priceCut = briefing.movements.find((m) => m.type === "pricing" && m.competitorName === "Plaka Central Suites");
    expect(priceCut?.headline).toContain("-12%");

    // The launched offer is detected.
    expect(briefing.movements.some((m) => m.type === "offer")).toBe(true);

    // Prose came through and is grounded (fact-check passed).
    expect(briefing.summary).toContain("Plaka Central");
    expect(briefing.recommendations).toHaveLength(2);
    expect(briefing.factCheckPassed).toBe(true);
    expect(briefing.usage.usd).toBeGreaterThan(0);

    // Snapshots are returned for persistence as next week's baseline.
    expect(snapshots).toHaveLength(4);
    expect(snapshots[0]?.weekOf).toBe(s.weekOf);
  });

  it("scan-only should skip the model and still produce movements", async () => {
    const s = getSample();
    const { briefing } = await runWeeklyBriefing({
      business: s.business,
      competitors: s.competitors,
      observer: new ExampleObserver(s.currMetrics),
      prevSnapshots: s.prevSnapshots,
      weekOf: s.weekOf,
      scanOnly: true,
    });
    expect(briefing.movements.length).toBeGreaterThan(0);
    expect(briefing.summary).toBe("");
    expect(briefing.recommendations).toHaveLength(0);
    expect(briefing.usage.usd).toBe(0);
  });
});

describe("FirecrawlObserver — defensive mapping", () => {
  it("should map a scrape response to metrics and never throw on failure", async () => {
    const { FirecrawlObserver } = await import("../src/observers/firecrawl");
    const okFetch = (async () =>
      ({
        ok: true,
        json: async () => ({ success: true, data: { json: { headlineRate: 125, currency: "EUR", offers: ["Free transfer"], hiring: [] } } }),
      }) as unknown as Response) as typeof fetch;

    const obs = new FirecrawlObserver({ apiKey: "fc-test", fetchImpl: okFetch });
    const m = await obs.observe({ id: "c1", name: "Rival", url: "rival.gr" }, getSample().business);
    expect(m.avgRate).toBe(12500);
    expect(m.currency).toBe("EUR");
    expect(m.offers).toEqual(["Free transfer"]);

    const badFetch = (async () => {
      throw new Error("network");
    }) as unknown as typeof fetch;
    const obs2 = new FirecrawlObserver({ apiKey: "fc-test", fetchImpl: badFetch });
    expect(await obs2.observe({ id: "c1", name: "Rival", url: "rival.gr" }, getSample().business)).toEqual({});
  });
});
