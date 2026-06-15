import { describe, expect, it } from "vitest";
import { mergeSlots, reduceState } from "../src/index";
import type { ConversationState } from "../src/index";

const BASE: ConversationState = {
  businessId: "b",
  lang: "en",
  status: "collecting",
  slots: {},
  history: [],
};

describe("mergeSlots", () => {
  it("should merge defined values over the existing slots", () => {
    expect(mergeSlots({ serviceId: "dinner" }, { date: "2026-06-19" })).toEqual({
      serviceId: "dinner",
      date: "2026-06-19",
    });
  });

  it("should ignore undefined values rather than blank a slot", () => {
    expect(mergeSlots({ serviceId: "dinner" }, { serviceId: undefined, time: "19:00" })).toEqual({
      serviceId: "dinner",
      time: "19:00",
    });
  });
});

describe("reduceState", () => {
  it("should stay 'collecting' until a concrete time is on the table", () => {
    const next = reduceState(BASE, { type: "collect", patch: { serviceId: "dinner", date: "2026-06-19" } });
    expect(next.status).toBe("collecting");
  });

  it("should move to 'proposing' once service, date and time are known", () => {
    const next = reduceState(BASE, {
      type: "collect",
      patch: { serviceId: "dinner", date: "2026-06-19", time: "19:00" },
    });
    expect(next.status).toBe("proposing");
  });

  it("should confirm with an appointment id", () => {
    const next = reduceState(BASE, {
      type: "confirm",
      slots: { serviceId: "dinner", date: "2026-06-19", time: "19:00", partySize: 2, name: "Alex", contact: "x" },
      appointmentId: "appt_1",
    });
    expect(next.status).toBe("confirmed");
    expect(next.appointmentId).toBe("appt_1");
    expect(next.slots.name).toBe("Alex");
  });

  it("should hand off", () => {
    expect(reduceState(BASE, { type: "handoff" }).status).toBe("handoff");
  });

  it("should not mutate the input state", () => {
    const before = JSON.stringify(BASE);
    reduceState(BASE, { type: "collect", patch: { serviceId: "dinner" } });
    expect(JSON.stringify(BASE)).toBe(before);
  });
});
