import { describe, expect, it } from "vitest";
import { costUsd, renderReport, type AegisReport } from "../src/index";

const REPORT: AegisReport = {
  generated_by: "Aegis (test)",
  url: "example.com",
  final_url: "https://example.com/",
  strategy: "mobile",
  scores: [
    { key: "performance", score: 45 },
    { key: "accessibility", score: 72 },
    { key: "seo", score: 83 },
    { key: "best-practices", score: 75 },
  ],
  vitals: [{ id: "largest-contentful-paint", label: "Largest Contentful Paint", numericValue: 4200, displayValue: "4.2 s", rating: "poor" }],
  severity_counts: { critical: 1, serious: 2, moderate: 0, minor: 4 },
  accessibility_issue_count: 3,
  overall_verdict: "Slow on mobile and not fully accessible.",
  headline_risks: [{ area: "performance", risk: "Slow first load", why_it_matters: "Mobile visitors abandon over 3 seconds." }],
  priorities: [{ rank: 1, area: "accessibility", action: "Add alt text to images", rationale: "3 images fail.", effort: "quick" }],
  accessibility_statement: "This site targets WCAG 2.1 AA. Known limitations: missing alt text.",
  eaa_exposure_note: "Moderate exposure — there are real accessibility gaps.",
  findings: [{ id: "image-alt", category: "accessibility", title: "Images have [alt]", description: "", severity: "critical", displayValue: "3 elements" }],
  usage: { input_tokens: 1000, output_tokens: 400, cache_read_tokens: 0, cache_write_tokens: 0, usd: 0.0042 },
};

describe("renderReport", () => {
  const md = renderReport(REPORT);

  it("should headline the audited URL and scores", () => {
    expect(md).toContain("# Site audit — https://example.com/");
    expect(md).toContain("Performance");
    expect(md).toContain("Accessibility");
  });

  it("should render the verdict, risks and priorities", () => {
    expect(md).toContain("## The read");
    expect(md).toContain("Slow on mobile");
    expect(md).toContain("## What this is costing you");
    expect(md).toContain("## Fix these first");
    expect(md).toContain("Add alt text to images");
    expect(md).toContain("(quick)");
  });

  it("should render the EAA exposure + draft statement", () => {
    expect(md).toContain("EU Accessibility Act");
    expect(md).toContain("WCAG 2.1 AA");
    expect(md).toContain("3 accessibility issues found");
  });

  it("should render the findings table and severity footer", () => {
    expect(md).toContain("| Severity | Area | Issue |");
    expect(md).toContain("1 critical · 2 serious");
  });
});

describe("costUsd", () => {
  it("should price a Sonnet call", () => {
    const usd = costUsd("claude-sonnet-4-6", { input_tokens: 1000, output_tokens: 500 });
    expect(usd).toBeCloseTo((1000 * 3 + 500 * 15) / 1e6, 6);
  });
});
