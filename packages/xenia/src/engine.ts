/**
 * The engine — one customer turn in, one reply out, with a Claude tool-use loop
 * in between. This is the house convention for agentic loops in this monorepo
 * (Fama is a batch pipeline; Xenia is the first tool-use agent).
 *
 * Per turn: build the cached system prompt, replay the conversation, then loop —
 * if Claude asks for a tool, run it against the store and feed the result back;
 * when Claude replies with text, fold state and return. The loop is hop-capped so
 * a misbehaving turn can never spin unbounded (a cost and abuse guard).
 */

import type Anthropic from "@anthropic-ai/sdk";
import { costUsd, getClient, type RawUsage, TURN_MODEL } from "./client";
import { dispatchTool } from "./dispatch";
import { buildSystemPrompt } from "./persona";
import { reduceState } from "./slots";
import type { AvailabilityProvider, BookingStore } from "./store";
import { XENIA_TOOLS } from "./tools";
import type {
  BusinessConfig,
  ChatMessage,
  ConversationState,
  RespondResult,
  XeniaUsage,
} from "./types";

export interface RespondOptions {
  client?: Anthropic;
  apiKey?: string;
  store: BookingStore & AvailabilityProvider;
  maxToolHops?: number;
  today?: string; // ISO date anchoring relative dates; defaults to actual today
}

const DEFAULT_MAX_HOPS = 4;

function emptyUsage(): XeniaUsage {
  return { input_tokens: 0, output_tokens: 0, cache_read_tokens: 0, cache_write_tokens: 0, usd: 0 };
}

function addUsage(acc: XeniaUsage, usage: RawUsage, usd: number): void {
  acc.input_tokens += usage.input_tokens ?? 0;
  acc.output_tokens += usage.output_tokens ?? 0;
  acc.cache_read_tokens += usage.cache_read_input_tokens ?? 0;
  acc.cache_write_tokens += usage.cache_creation_input_tokens ?? 0;
  acc.usd += usd;
}

function historyToMessages(history: ChatMessage[]): Anthropic.Messages.MessageParam[] {
  return history.map((m) => ({ role: m.role, content: m.text }));
}

function firstText(content: Anthropic.Messages.ContentBlock[]): string | null {
  for (const block of content) {
    if (block.type === "text") return block.text;
  }
  return null;
}

function fallbackReply(business: BusinessConfig): string {
  const primary = business.languages[0] ?? "en";
  return primary === "el"
    ? "Συγγνώμη, θα σας συνδέσω με έναν συνάδελφο για να σας βοηθήσει. Θα επικοινωνήσουμε σύντομα."
    : "Sorry — let me pass you to a colleague who can help. We'll be in touch shortly.";
}

function finalize(
  state: ConversationState,
  userText: string,
  reply: string,
  usage: XeniaUsage,
  handoff?: { reason: string },
): RespondResult {
  const ts = new Date().toISOString();
  const history: ChatMessage[] = [
    ...state.history,
    { role: "user", text: userText, ts },
    { role: "assistant", text: reply, ts },
  ];
  return { reply, state: { ...state, history }, usage, ...(handoff ? { handoff } : {}) };
}

interface ToolTurn {
  state: ConversationState;
  handoff?: { reason: string };
}

/** Run every tool the model requested, push the plumbing onto `messages`, fold state. */
async function handleToolUse(
  res: Anthropic.Messages.Message,
  business: BusinessConfig,
  store: BookingStore & AvailabilityProvider,
  messages: Anthropic.Messages.MessageParam[],
  state: ConversationState,
): Promise<ToolTurn> {
  messages.push({ role: "assistant", content: res.content });
  const toolUses = res.content.filter(
    (b): b is Anthropic.Messages.ToolUseBlock => b.type === "tool_use",
  );
  const results: Anthropic.Messages.ToolResultBlockParam[] = [];
  let nextState = state;
  let handoff: { reason: string } | undefined;
  for (const toolUse of toolUses) {
    const outcome = await dispatchTool(toolUse, business, store);
    results.push(outcome.result);
    if (outcome.action) nextState = reduceState(nextState, outcome.action);
    if (outcome.handoff) handoff = outcome.handoff;
  }
  messages.push({ role: "user", content: results });
  return { state: nextState, handoff };
}

/** Handle one customer message: returns the reply, the next state, and the cost. */
export async function respond(
  business: BusinessConfig,
  state: ConversationState,
  userText: string,
  opts: RespondOptions,
): Promise<RespondResult> {
  const client = opts.client ?? getClient(opts.apiKey);
  const maxHops = opts.maxToolHops ?? DEFAULT_MAX_HOPS;
  const today = opts.today ?? new Date().toISOString().slice(0, 10);
  const system: Anthropic.Messages.TextBlockParam[] = [
    { type: "text", text: buildSystemPrompt(business, today), cache_control: { type: "ephemeral" } },
  ];
  const usage = emptyUsage();
  const messages = historyToMessages(state.history);
  messages.push({ role: "user", content: userText });

  let nextState = state;
  let handoff: { reason: string } | undefined;

  for (let hop = 0; hop < maxHops; hop++) {
    const res = await client.messages.create({
      model: TURN_MODEL,
      max_tokens: 1024,
      thinking: { type: "disabled" },
      system,
      tools: XENIA_TOOLS,
      messages,
    });
    addUsage(usage, res.usage, costUsd(TURN_MODEL, res.usage));

    if (res.stop_reason === "refusal") {
      return finalize(nextState, userText, fallbackReply(business), usage, handoff);
    }
    if (res.stop_reason === "tool_use") {
      const turn = await handleToolUse(res, business, opts.store, messages, nextState);
      nextState = turn.state;
      if (turn.handoff) handoff = turn.handoff;
      continue;
    }
    const reply = firstText(res.content) ?? fallbackReply(business);
    return finalize(nextState, userText, reply, usage, handoff);
  }

  // Hop cap reached — terminate safely with a handoff rather than loop.
  const handed = reduceState(nextState, { type: "handoff" });
  return finalize(handed, userText, fallbackReply(business), usage, handoff ?? { reason: "max tool hops reached" });
}
