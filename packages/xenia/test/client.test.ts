import { describe, expect, it } from "vitest";
import { costUsd } from "../src/index";

describe("costUsd", () => {
  it("should price input, output and cache reads for Sonnet", () => {
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
