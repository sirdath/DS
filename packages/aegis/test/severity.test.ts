import { describe, expect, it } from "vitest";
import { eaaExposureNote, ratingFromScore, severityFromWeight } from "../src/index";

describe("severityFromWeight", () => {
  it("should map Lighthouse weights to severities", () => {
    expect(severityFromWeight(10)).toBe("critical");
    expect(severityFromWeight(7)).toBe("serious");
    expect(severityFromWeight(3)).toBe("moderate");
    expect(severityFromWeight(1)).toBe("minor");
    expect(severityFromWeight(0)).toBe("minor");
  });
});

describe("ratingFromScore", () => {
  it("should rate a 0–1 metric score", () => {
    expect(ratingFromScore(0.95)).toBe("good");
    expect(ratingFromScore(0.6)).toBe("needs-improvement");
    expect(ratingFromScore(0.2)).toBe("poor");
    expect(ratingFromScore(null)).toBe("needs-improvement");
  });
});

describe("eaaExposureNote", () => {
  it("should escalate exposure as the accessibility score drops", () => {
    expect(eaaExposureNote(95, 0)).toContain("Low exposure");
    expect(eaaExposureNote(75, 2)).toContain("Moderate exposure");
    expect(eaaExposureNote(40, 6)).toContain("High exposure");
  });

  it("should always cite the EU Accessibility Act when exposure is real", () => {
    expect(eaaExposureNote(60, 4)).toContain("EU Accessibility Act");
  });
});
