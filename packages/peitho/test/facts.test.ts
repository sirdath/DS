import { describe, expect, it } from "vitest";
import { buildFacts, type LeadInput } from "../src/index";

function lead(overrides: Partial<LeadInput> = {}): LeadInput {
  return {
    id: "l1",
    name: "Acme Cafe",
    category: "cafe",
    area: "Kifisia, Greece",
    website: "https://acme.gr",
    hasWebsite: true,
    phone: "+30 210 1234567",
    email: "hi@acme.gr",
    pitchAngle: "no online ordering",
    tags: ["not-mobile-friendly"],
    tech: ["jQuery 1.11"],
    ugliness: 70,
    ...overrides,
  };
}

describe("facts — buildFacts", () => {
  it("should pick Greek for a .gr website", () => {
    expect(buildFacts(lead({ website: "https://shop.gr/x", area: "London" })).lang).toBe("el");
  });

  it("should pick Greek for a Greek area even without a .gr site", () => {
    expect(buildFacts(lead({ website: "https://acme.com", area: "Athens, Greece" })).lang).toBe("el");
    expect(buildFacts(lead({ website: null, area: "Ελλάδα" })).lang).toBe("el");
  });

  it("should pick English otherwise", () => {
    expect(buildFacts(lead({ website: "https://acme.com", area: "Shoreditch, London" })).lang).toBe("en");
    expect(buildFacts(lead({ website: "https://greenhouse.com", area: "Berlin" })).lang).toBe("en");
  });

  it("should map id/name + the mined signals straight through", () => {
    const f = buildFacts(lead());
    expect(f.leadId).toBe("l1");
    expect(f.businessName).toBe("Acme Cafe");
    expect(f.pitchAngle).toBe("no online ordering");
    expect(f.tags).toEqual(["not-mobile-friendly"]);
    expect(f.tech).toEqual(["jQuery 1.11"]);
    expect(f.ugliness).toBe(70);
    expect(f.hasWebsite).toBe(true);
  });

  it("should default missing arrays to empty", () => {
    const f = buildFacts(lead({ tags: undefined as unknown as string[], tech: undefined as unknown as string[] }));
    expect(f.tags).toEqual([]);
    expect(f.tech).toEqual([]);
  });
});
