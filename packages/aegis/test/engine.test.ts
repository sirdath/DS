import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { auditSite } from "../src/index";
import { PSI_FIXTURE } from "./fixture";

const SYNTH = {
  overall_verdict: "Loved for its content but let down by a slow, hard-to-use page on mobile.",
  headline_risks: [
    { area: "accessibility", risk: "Images have no alt text", why_it_matters: "Locks out screen-reader users and is an EU Accessibility Act liability." },
  ],
  priorities: [
    { area: "accessibility", action: "Add alt text to every image", rationale: "3 images fail; this is the most-litigated WCAG issue.", effort: "quick" },
    { area: "performance", action: "Remove render-blocking resources", rationale: "LCP is 4.2s on mobile; ~53% abandon over 3s.", effort: "moderate" },
  ],
  accessibility_statement: "This site targets WCAG 2.1 AA. Known limitations: missing image alt text and low colour contrast. Report issues to…",
};

const USAGE = { input_tokens: 1000, output_tokens: 400, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };

function fakeClient(): Anthropic {
  const create = () =>
    Promise.resolve({ stop_reason: "end_turn", content: [{ type: "text", text: JSON.stringify(SYNTH) }], usage: USAGE });
  return { messages: { create } } as unknown as Anthropic;
}

describe("auditSite — scan-only (no model)", () => {
  it("should compute the deterministic scorecard from injected PSI", async () => {
    const report = await auditSite("example.com", { psi: PSI_FIXTURE, scanOnly: true });

    expect(report.scores.find((s) => s.key === "accessibility")?.score).toBe(72);
    expect(report.severity_counts).toEqual({ critical: 1, serious: 2, moderate: 0, minor: 4 });
    expect(report.accessibility_issue_count).toBe(3);
    expect(report.eaa_exposure_note).toContain("Moderate exposure");
    expect(report.overall_verdict).toContain("Scan complete");
    expect(report.priorities).toHaveLength(0);
    expect(report.usage.usd).toBe(0);
  });
});

describe("auditSite — with synthesis", () => {
  it("should run the model and merge the narrative into the report", async () => {
    const report = await auditSite("example.com", { psi: PSI_FIXTURE, client: fakeClient() });

    expect(report.overall_verdict).toBe(SYNTH.overall_verdict);
    expect(report.headline_risks).toHaveLength(1);
    expect(report.priorities[0]?.rank).toBe(1);
    expect(report.priorities[1]?.rank).toBe(2);
    expect(report.priorities[0]?.action).toContain("alt text");
    expect(report.accessibility_statement).toContain("WCAG 2.1 AA");
    expect(report.usage.usd).toBeGreaterThan(0);
    // deterministic facts still present alongside the narrative
    expect(report.severity_counts.critical).toBe(1);
    expect(report.generated_by).toContain("claude-sonnet-4-6");
  });
});
