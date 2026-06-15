import { describe, expect, it } from "vitest";
import {
  parseAvailabilityArgs,
  parseBookingArgs,
  parseHandoffReason,
  XENIA_TOOLS,
} from "../src/index";

describe("XENIA_TOOLS", () => {
  it("should define exactly the three booking tools", () => {
    expect(XENIA_TOOLS.map((t) => t.name)).toEqual(["get_availability", "create_booking", "handoff_to_human"]);
  });

  it("should have a valid schema with required ⊆ properties for each tool", () => {
    for (const tool of XENIA_TOOLS) {
      expect(tool.description).toBeTruthy();
      const schema = tool.input_schema;
      const props = Object.keys((schema.properties ?? {}) as Record<string, unknown>);
      const required = (schema.required ?? []) as string[];
      for (const key of required) {
        expect(props).toContain(key);
      }
    }
  });
});

describe("argument parsers", () => {
  it("should parse valid availability args", () => {
    expect(parseAvailabilityArgs({ service_id: "dinner", date: "2026-06-19" })).toEqual({
      service_id: "dinner",
      date: "2026-06-19",
    });
  });

  it("should reject availability args missing a field", () => {
    expect(() => parseAvailabilityArgs({ service_id: "dinner" })).toThrow();
    expect(() => parseAvailabilityArgs(null)).toThrow();
  });

  it("should parse booking args and coerce a numeric party size", () => {
    const args = parseBookingArgs({
      service_id: "dinner",
      date: "2026-06-19",
      time: "19:00",
      party_size: "2",
      name: "Alex",
      contact: "6900000000",
    });
    expect(args.party_size).toBe(2);
    expect(args.name).toBe("Alex");
  });

  it("should reject booking args with a non-numeric party size", () => {
    expect(() =>
      parseBookingArgs({
        service_id: "dinner",
        date: "2026-06-19",
        time: "19:00",
        party_size: "lots",
        name: "Alex",
        contact: "x",
      }),
    ).toThrow();
  });

  it("should default a missing handoff reason", () => {
    expect(parseHandoffReason({})).toBe("unspecified");
    expect(parseHandoffReason({ reason: "out of scope" })).toBe("out of scope");
  });
});
