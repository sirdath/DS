import type Anthropic from "@anthropic-ai/sdk";
import { describe, expect, it } from "vitest";
import { buildFacts, DEEP, LEAN, research, type LeadInput } from "../src/index";

const LEAD: LeadInput = {
  id: "l1", name: "Acme Cafe", category: "cafe", area: "Athens, Greece", website: "https://acme.gr",
  hasWebsite: true, phone: null, email: null, pitchAngle: null, tags: [], tech: [], ugliness: null,
};
const facts = buildFacts(LEAD);

interface FakeResp {
  stop_reason: string;
  content: unknown[];
  usage: Record<string, number>;
}

/** A fake Anthropic client: replays a queue of responses, recording each call's params. */
function fakeClient(responses: FakeResp[]) {
  const calls: Record<string, unknown>[] = [];
  let i = 0;
  const client = {
    messages: {
      create: async (params: Record<string, unknown>) => {
        calls.push(params);
        return responses[Math.min(i++, responses.length - 1)];
      },
    },
  } as unknown as Anthropic;
  return { client, calls };
}

const usage = (inp: number, out: number) => ({ input_tokens: inp, output_tokens: out, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 });

const searchResp: FakeResp = {
  stop_reason: "pause_turn",
  content: [
    { type: "server_tool_use", name: "web_search", id: "s1", input: { query: "Acme Cafe Athens" } },
    { type: "web_search_tool_result", content: [
      { type: "web_search_result", url: "https://acme.gr", title: "Acme Cafe" },
      { type: "web_search_result", url: "https://maps.example/acme", title: "Acme on Maps" },
    ] },
    { type: "text", text: "interim notes" },
  ],
  usage: usage(100, 50),
};
const finalResp: FakeResp = {
  stop_reason: "end_turn",
  content: [{ type: "text", text: "FINAL DOSSIER about Acme Cafe.\nConfidence & gaps: well grounded." }],
  usage: usage(80, 200),
};

describe("research — Stage A loop", () => {
  it("should loop on pause_turn, aggregate usage + sources, and return the final dossier", async () => {
    const { client, calls } = fakeClient([searchResp, finalResp]);
    const r = await research(facts, { client, profile: LEAN });

    expect(calls).toHaveLength(2);
    expect(r.dossier).toContain("FINAL DOSSIER");
    expect(r.sources.map((s) => s.url).sort()).toEqual(["https://acme.gr", "https://maps.example/acme"]);
    expect(r.usage.search_count).toBe(1);
    expect(r.usage.input_tokens).toBe(180);
    expect(r.usage.output_tokens).toBe(250);
    expect(r.usage.usd).toBeGreaterThan(0);
  });

  it("should resume by appending assistant content, not a 'Continue' user message", async () => {
    const { client, calls } = fakeClient([searchResp, finalResp]);
    await research(facts, { client, profile: LEAN });
    const secondMessages = calls[1]?.messages as Array<{ role: string }>;
    expect(secondMessages).toHaveLength(2);
    expect(secondMessages[1]?.role).toBe("assistant");
  });

  it("should not throw on a web_search_tool_result error block (object content)", async () => {
    const errResp: FakeResp = {
      stop_reason: "pause_turn",
      content: [
        { type: "server_tool_use", name: "web_search", id: "s2" },
        { type: "web_search_tool_result", content: { error_code: "max_uses_exceeded" } },
      ],
      usage: usage(10, 5),
    };
    const { client } = fakeClient([errResp, finalResp]);
    const r = await research(facts, { client, profile: LEAN });
    expect(r.sources).toHaveLength(0);
    expect(r.usage.search_count).toBe(1);
    expect(r.dossier).toContain("FINAL DOSSIER");
  });

  it("should respect maxContinuations when the model never finishes", async () => {
    const everPause: FakeResp = { stop_reason: "pause_turn", content: [{ type: "text", text: "still going" }], usage: usage(5, 5) };
    const { client, calls } = fakeClient([everPause]); // always pause_turn
    await research(facts, { client, profile: LEAN }); // maxContinuations = 2 → 3 calls
    expect(calls).toHaveLength(3);
  });

  it("should add web_fetch only in the deep profile", async () => {
    const lean = fakeClient([finalResp]);
    await research(facts, { client: lean.client, profile: LEAN });
    expect((lean.calls[0]?.tools as unknown[]).length).toBe(1);

    const deep = fakeClient([finalResp]);
    await research(facts, { client: deep.client, profile: DEEP });
    const tools = deep.calls[0]?.tools as Array<{ type: string }>;
    expect(tools).toHaveLength(2);
    expect(tools.some((t) => t.type === "web_fetch_20260209")).toBe(true);
  });

  it("should stop without resuming on a refusal", async () => {
    const refusal: FakeResp = { stop_reason: "refusal", content: [], usage: usage(5, 0) };
    const { client, calls } = fakeClient([refusal, finalResp]);
    const r = await research(facts, { client, profile: LEAN });
    expect(calls).toHaveLength(1);
    expect(r.dossier).toBe("");
  });
});
