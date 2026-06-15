import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import {
  createConversation,
  InMemoryStore,
  respond,
  type BusinessConfig,
  type DayOfWeek,
} from "../src/index";

const ALL_DAYS: DayOfWeek[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

const BUSINESS: BusinessConfig = {
  id: "t",
  name: "Test Taverna",
  type: "taverna",
  languages: ["en"],
  services: [{ id: "dinner", name: "Dinner table", durationMin: 120 }],
  openingHours: ALL_DAYS.map((day) => ({ day, open: "18:00", close: "22:00" })),
  policy: { slotIntervalMin: 30, minPartySize: 1, maxPartySize: 10, leadTimeMin: 60, maxAdvanceDays: 30 },
};

const USAGE = { input_tokens: 100, output_tokens: 30, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 };

interface FakeResponse {
  stop_reason: string;
  usage: typeof USAGE;
  content: unknown[];
}

/** A client that replays a fixed script of responses, one per create() call. */
function scriptedClient(responses: FakeResponse[]): Anthropic {
  let i = 0;
  const create = (): Promise<FakeResponse> => {
    const res = responses[Math.min(i, responses.length - 1)];
    i += 1;
    return Promise.resolve(res as FakeResponse);
  };
  return { messages: { create } } as unknown as Anthropic;
}

/** Records which store methods the loop actually invoked. */
class SpyStore extends InMemoryStore {
  readonly calls: string[] = [];
  override async getAvailability(b: BusinessConfig, serviceId: string, date: string) {
    this.calls.push("getAvailability");
    return super.getAvailability(b, serviceId, date);
  }
  override async createBooking(input: Parameters<InMemoryStore["createBooking"]>[0]) {
    this.calls.push("createBooking");
    return super.createBooking(input);
  }
}

const BOOKING_FLOW: FakeResponse[] = [
  {
    stop_reason: "tool_use",
    usage: USAGE,
    content: [{ type: "tool_use", id: "t1", name: "get_availability", input: { service_id: "dinner", date: "2026-06-19" } }],
  },
  {
    stop_reason: "tool_use",
    usage: USAGE,
    content: [
      {
        type: "tool_use",
        id: "t2",
        name: "create_booking",
        input: { service_id: "dinner", date: "2026-06-19", time: "19:00", party_size: 2, name: "Alex", contact: "6900000000" },
      },
    ],
  },
  {
    stop_reason: "end_turn",
    usage: USAGE,
    content: [{ type: "text", text: "All booked, Alex — a table for two at 19:00 on the 19th. See you then!" }],
  },
];

describe("respond — the tool-use loop", () => {
  it("should run availability → booking → confirmation in order", async () => {
    const store = new SpyStore();
    const state = createConversation(BUSINESS);
    const result = await respond(BUSINESS, state, "Table for two on the 19th at 7pm, name Alex.", {
      client: scriptedClient(BOOKING_FLOW),
      store,
      today: "2026-06-15",
    });

    expect(store.calls).toEqual(["getAvailability", "createBooking"]);
    expect(result.state.status).toBe("confirmed");
    expect(result.state.appointmentId).toBeTruthy();
    expect(result.reply).toContain("Alex");

    const appt = await store.getBooking(result.state.appointmentId ?? "");
    expect(appt?.partySize).toBe(2);
    expect(appt?.time).toBe("19:00");
  });

  it("should record the collected slots from the booking", async () => {
    const store = new SpyStore();
    const result = await respond(BUSINESS, createConversation(BUSINESS), "book it", {
      client: scriptedClient(BOOKING_FLOW),
      store,
      today: "2026-06-15",
    });
    expect(result.state.slots).toMatchObject({ serviceId: "dinner", time: "19:00", partySize: 2, name: "Alex" });
  });

  it("should sum token usage across every call in the loop", async () => {
    const store = new SpyStore();
    const result = await respond(BUSINESS, createConversation(BUSINESS), "book it", {
      client: scriptedClient(BOOKING_FLOW),
      store,
      today: "2026-06-15",
    });
    // 3 calls × 100 input / 30 output
    expect(result.usage.input_tokens).toBe(300);
    expect(result.usage.output_tokens).toBe(90);
    expect(result.usage.usd).toBeGreaterThan(0);
  });

  it("should append the user turn and assistant reply to history", async () => {
    const result = await respond(BUSINESS, createConversation(BUSINESS), "book it", {
      client: scriptedClient(BOOKING_FLOW),
      store: new InMemoryStore(),
      today: "2026-06-15",
    });
    expect(result.state.history).toHaveLength(2);
    expect(result.state.history[0]?.role).toBe("user");
    expect(result.state.history[1]?.role).toBe("assistant");
  });

  it("should escalate to a human on handoff_to_human", async () => {
    const flow: FakeResponse[] = [
      { stop_reason: "tool_use", usage: USAGE, content: [{ type: "tool_use", id: "h1", name: "handoff_to_human", input: { reason: "complaint about a previous visit" } }] },
      { stop_reason: "end_turn", usage: USAGE, content: [{ type: "text", text: "I'll have a colleague call you back." }] },
    ];
    const result = await respond(BUSINESS, createConversation(BUSINESS), "I want to complain", {
      client: scriptedClient(flow),
      store: new InMemoryStore(),
      today: "2026-06-15",
    });
    expect(result.state.status).toBe("handoff");
    expect(result.handoff?.reason).toContain("complaint");
  });

  it("should terminate safely when the hop cap is reached", async () => {
    const loop: FakeResponse[] = [
      { stop_reason: "tool_use", usage: USAGE, content: [{ type: "tool_use", id: "x", name: "get_availability", input: { service_id: "dinner", date: "2026-06-19" } }] },
    ];
    const result = await respond(BUSINESS, createConversation(BUSINESS), "loop forever", {
      client: scriptedClient(loop),
      store: new InMemoryStore(),
      maxToolHops: 2,
      today: "2026-06-15",
    });
    expect(result.state.status).toBe("handoff");
    expect(result.usage.input_tokens).toBe(200); // exactly maxToolHops calls
  });

  it("should fall back gracefully on a refusal without throwing", async () => {
    const refusal: FakeResponse[] = [{ stop_reason: "refusal", usage: USAGE, content: [] }];
    const result = await respond(BUSINESS, createConversation(BUSINESS), "…", {
      client: scriptedClient(refusal),
      store: new InMemoryStore(),
      today: "2026-06-15",
    });
    expect(result.reply).toContain("colleague");
    expect(result.state.status).toBe("collecting");
  });
});
