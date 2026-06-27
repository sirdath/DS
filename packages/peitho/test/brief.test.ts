import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import {
  buildFacts,
  factCheckBrief,
  renderBriefMarkdown,
  synthesizeBrief,
  type BriefSource,
  type CompanyBrief,
  type LeadInput,
  type ResearchResult,
} from "../src/index";

const LEAD: LeadInput = {
  id: "l1", name: "Acme Cafe", category: "cafe", area: "Athens, Greece", website: "https://acme.gr",
  hasWebsite: true, phone: null, email: null, pitchAngle: null, tags: [], tech: [], ugliness: null,
};
const facts = buildFacts(LEAD);

const BRIEF: CompanyBrief = {
  overview: "Acme Cafe is a family-run espresso bar in Athens.",
  whatTheyDo: "Coffee, pastries, light lunch.",
  idealCustomers: "Local office workers and tourists.",
  painPoints: [{ title: "No online ordering", detail: "Lost takeaway revenue at peak.", severity: "high" }],
  marketEnvironment: "Dense Athens cafe scene.",
  competitors: ["Blue Cup", "Mokka"],
  recentSignals: ["Opened a second location in 2026."],
  outreachAngle: "We noticed there's no way to order ahead — that's leaving peak-hour revenue on the table.",
  talkingPoints: ["Online ordering", "Loyalty", "Google profile"],
  emailSeeds: ["A faster morning rush for Acme"],
  confidence: 0.72,
  gaps: [],
};

const SOURCES: BriefSource[] = [{ title: "Acme Cafe", url: "https://acme.gr" }];
const researchResult: ResearchResult = {
  dossier: "Acme Cafe ... Confidence & gaps: ok",
  sources: SOURCES,
  usage: { input_tokens: 1, output_tokens: 1, cache_read_tokens: 0, cache_write_tokens: 0, search_count: 1, usd: 0.01 },
};

function fakeClient(resp: { stop_reason: string; content: unknown[]; usage: Record<string, number> }): Anthropic {
  return { messages: { create: async () => resp } } as unknown as Anthropic;
}

describe("synthesizeBrief", () => {
  it("should parse schema-valid JSON into a CompanyBrief", async () => {
    const client = fakeClient({
      stop_reason: "end_turn",
      content: [{ type: "text", text: JSON.stringify(BRIEF) }],
      usage: { input_tokens: 500, output_tokens: 600, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 },
    });
    const { brief, usd } = await synthesizeBrief(facts, researchResult, { client });
    expect(brief.overview).toContain("Acme Cafe");
    expect(brief.painPoints[0]?.severity).toBe("high");
    expect(usd).toBeGreaterThan(0);
  });

  it("should throw on a refusal", async () => {
    const client = fakeClient({ stop_reason: "refusal", content: [], usage: {} });
    await expect(synthesizeBrief(facts, researchResult, { client })).rejects.toThrow(/refused/);
  });
});

describe("factCheckBrief", () => {
  it("should pass a grounded brief with sources untouched", () => {
    const r = factCheckBrief(BRIEF, facts, SOURCES);
    expect(r.confidence).toBeCloseTo(0.72, 5);
    expect(r.issues).toHaveLength(0);
  });

  it("should cap confidence at 0.4 and add a gap when no sources were consulted", () => {
    const r = factCheckBrief(BRIEF, facts, []);
    expect(r.confidence).toBeLessThanOrEqual(0.4);
    expect(r.gaps).toContain("no external sources consulted");
    expect(r.issues).toContain("no external sources consulted");
  });

  it("should flag an overview that does not name the business", () => {
    const r = factCheckBrief({ ...BRIEF, overview: "A small espresso bar." }, facts, SOURCES);
    expect(r.issues.join(" ")).toContain("name");
    expect(r.gaps.some((g) => g.includes("name"))).toBe(true);
  });

  it("should clamp out-of-range / non-finite confidence", () => {
    expect(factCheckBrief({ ...BRIEF, confidence: 1.5 }, facts, SOURCES).confidence).toBe(1);
    expect(factCheckBrief({ ...BRIEF, confidence: NaN }, facts, SOURCES).confidence).toBe(0.5);
  });
});

describe("renderBriefMarkdown", () => {
  it("should include confidence, a pain point, and cited sources", () => {
    const md = renderBriefMarkdown(BRIEF, SOURCES);
    expect(md).toContain("**Confidence:** 0.72");
    expect(md).toContain("No online ordering");
    expect(md).toContain("[Acme Cafe](https://acme.gr)");
  });

  it("should show the preliminary banner when confidence < 0.6", () => {
    const md = renderBriefMarkdown({ ...BRIEF, confidence: 0.3 }, [])
    expect(md).toContain("Preliminary")
    expect(md).toContain("No external sources consulted")
  });
});
