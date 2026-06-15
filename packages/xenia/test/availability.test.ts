import { describe, expect, it } from "vitest";
import { dayOfWeek, synthesizeSlots } from "../src/index";
import type { OpeningHours } from "../src/index";

describe("dayOfWeek", () => {
  it("should map ISO dates to weekdays", () => {
    expect(dayOfWeek("2024-01-01")).toBe("mon");
    expect(dayOfWeek("2024-01-06")).toBe("sat");
    expect(dayOfWeek("2024-01-07")).toBe("sun");
  });
});

describe("synthesizeSlots", () => {
  const date = "2024-01-01"; // a Monday
  const hours: OpeningHours[] = [{ day: "mon", open: "09:00", close: "11:00" }];

  it("should lay a grid over the opening window", () => {
    const slots = synthesizeSlots(hours, 30, date);
    expect(slots.map((s) => s.time)).toEqual(["09:00", "09:30", "10:00", "10:30"]);
  });

  it("should exclude times already held", () => {
    const slots = synthesizeSlots(hours, 30, date, new Set(["09:30"]));
    expect(slots.map((s) => s.time)).toEqual(["09:00", "10:00", "10:30"]);
  });

  it("should return nothing for a closed day", () => {
    expect(synthesizeSlots(hours, 30, "2024-01-02")).toEqual([]); // a Tuesday
  });

  it("should never offer a slot that runs past closing", () => {
    const slots = synthesizeSlots([{ day: "mon", open: "09:00", close: "09:40" }], 30, date);
    expect(slots.map((s) => s.time)).toEqual(["09:00"]); // 09:30 + 30 = 10:00 > 09:40
  });
});
