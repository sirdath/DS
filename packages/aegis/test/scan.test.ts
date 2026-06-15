import { describe, expect, it } from "vitest";
import { parseScan } from "../src/index";
import { PSI_FIXTURE } from "./fixture";

describe("parseScan", () => {
  const scan = parseScan(PSI_FIXTURE, "example.com", "mobile");

  it("should read the four category scores as 0–100", () => {
    expect(scan.scores).toEqual([
      { key: "performance", score: 45 },
      { key: "accessibility", score: 72 },
      { key: "seo", score: 83 },
      { key: "best-practices", score: 75 },
    ]);
  });

  it("should surface Core Web Vitals with ratings", () => {
    const lcp = scan.vitals.find((v) => v.id === "largest-contentful-paint");
    expect(lcp?.displayValue).toBe("4.2 s");
    expect(lcp?.rating).toBe("poor");
    expect(scan.vitals.find((v) => v.id === "cumulative-layout-shift")?.rating).toBe("good");
  });

  it("should keep only failing, non-vital, scorable audits as findings", () => {
    const ids = scan.findings.map((f) => f.id);
    expect(ids).toContain("image-alt");
    expect(ids).toContain("color-contrast");
    expect(ids).not.toContain("document-title"); // passing (score 1)
    expect(ids).not.toContain("uses-https"); // passing
    expect(ids).not.toContain("largest-contentful-paint"); // shown as a vital
    expect(scan.findings).toHaveLength(7);
  });

  it("should map audit weights to severities and sort most-severe first", () => {
    expect(scan.findings[0]?.id).toBe("image-alt"); // weight 10 → critical
    expect(scan.findings[0]?.severity).toBe("critical");
    expect(scan.findings.find((f) => f.id === "color-contrast")?.severity).toBe("serious"); // weight 7
    expect(scan.findings.find((f) => f.id === "meta-description")?.severity).toBe("minor"); // weight 1
  });

  it("should carry the finding's displayValue when present", () => {
    expect(scan.findings.find((f) => f.id === "image-alt")?.displayValue).toBe("3 elements");
  });

  it("should resolve the final URL", () => {
    expect(scan.finalUrl).toBe("https://example.com/");
  });

  it("should throw on a response with no lighthouseResult", () => {
    expect(() => parseScan({}, "x", "mobile")).toThrow(/lighthouseResult/);
  });
});
