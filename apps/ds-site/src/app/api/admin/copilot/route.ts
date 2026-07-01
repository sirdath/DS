import Anthropic from "@anthropic-ai/sdk";
import { assertAdmin } from "../../../admin/lib/assert-admin";
import { getFounderCredential, makeAnthropicClient } from "../../../admin/lib/founder-credential";
import { COPILOT_TOOLS, TOOL_LABELS, runCopilotTool } from "../../../admin/lib/copilot-tools";

export const runtime = "nodejs";
export const maxDuration = 300;

/**
 * The admin copilot: an agentic loop over the workspace tools (projects,
 * calendar, deadlines, notes, competitors) that ROUTES between model tiers —
 * Haiku for quick lookups/single actions, Opus for everyday multi-step work,
 * Fable for deep reasoning. "auto" (default) picks the tier per message with a
 * tiny Haiku classification call; the founder can pin a tier from the UI.
 * Streams NDJSON events:
 *   {t:"model",tier,label} {t:"delta",text} {t:"tool",name,label}
 *   {t:"tool_done",name,ok} {t:"done",messages,usage} {t:"error",message}
 * The client echoes `messages` back verbatim next turn (thinking blocks must be
 * replayed unchanged on the same model; cross-model they replay or drop safely),
 * so the whole conversation stays client-held.
 */

const MAX_ITERATIONS = 12;

// $/MTok: in, cache-read (0.1x), cache-write (1.25x), out.
const TIERS = {
  quick: { model: "claude-haiku-4-5", label: "Haiku", price: { in: 1, cr: 0.1, cw: 1.25, out: 5 } },
  smart: { model: "claude-opus-4-8", label: "Opus", price: { in: 5, cr: 0.5, cw: 6.25, out: 25 } },
  deep: { model: "claude-fable-5", label: "Fable", price: { in: 10, cr: 1, cw: 12.5, out: 50 } },
} as const;
type Tier = keyof typeof TIERS;

const CLASSIFY_PROMPT = [
  "You route requests inside an admin-workspace copilot to a model tier. Reply with exactly one word: quick, smart, or deep.",
  "quick — a simple lookup or one small action: what's on today, add one event, mark something done, read one record.",
  "smart — normal multi-step work: updates across a few records, scheduling with constraints, short summaries, drafting.",
  "deep — analysis or strategy: risk assessment, \"review everything\", prioritisation, ambiguous or open-ended asks spanning the workspace.",
  "When unsure, say smart.",
].join("\n");

interface TierPick {
  tier: Tier;
  tokensIn: number;
  tokensOut: number;
  usd: number;
}

async function pickTier(client: Anthropic, message: string): Promise<TierPick> {
  try {
    const res = await client.messages.create({
      model: TIERS.quick.model,
      max_tokens: 8,
      system: CLASSIFY_PROMPT,
      messages: [{ role: "user", content: message.slice(0, 2000) }],
    });
    const text = res.content.find((b): b is Anthropic.TextBlock => b.type === "text")?.text.toLowerCase() ?? "";
    const tier: Tier = text.includes("quick") ? "quick" : text.includes("deep") ? "deep" : "smart";
    // The classifier is billed too — fold it into the turn's cost at Haiku prices.
    const p = TIERS.quick.price;
    const u = res.usage;
    const tokensIn = (u.input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0);
    const usd =
      ((u.input_tokens ?? 0) * p.in +
        (u.cache_read_input_tokens ?? 0) * p.cr +
        (u.cache_creation_input_tokens ?? 0) * p.cw +
        (u.output_tokens ?? 0) * p.out) /
      1_000_000;
    return { tier, tokensIn, tokensOut: u.output_tokens ?? 0, usd };
  } catch {
    return { tier: "smart", tokensIn: 0, tokensOut: 0, usd: 0 };
  }
}

/** Per-tier request params. Haiku: no thinking, no effort (unsupported). Opus:
 *  adaptive thinking + medium effort. Fable: thinking always on (param omitted). */
function turnParams(tier: Tier, systemText: string, messages: Msg[]): Anthropic.MessageStreamParams {
  const base: Record<string, unknown> = {
    model: TIERS[tier].model,
    max_tokens: 8000,
    system: [{ type: "text", text: systemText, cache_control: { type: "ephemeral" } }],
    tools: COPILOT_TOOLS,
    messages,
  };
  if (tier === "smart") {
    base.thinking = { type: "adaptive" };
    base.output_config = { effort: "medium" };
  } else if (tier === "deep") {
    base.output_config = { effort: "medium" };
  }
  return base as unknown as Anthropic.MessageStreamParams;
}

function systemPrompt(): string {
  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Europe/Athens" });
  return [
    "You are the DS2 admin copilot: the reasoning assistant for DS's two founders, Dath and Stel, inside their admin panel. You manage their workspace through tools: projects and leads (the funnel), the shared calendar (events and meetings), planning deadlines (date countdowns and metric goals), notes, and competitor intelligence.",
    "",
    "Ground rules:",
    "- Ground every claim in tool results from this conversation. If you have not looked, look before answering.",
    "- Start broad questions with get_workspace_snapshot; skip it only when the request targets one specific record you already have.",
    "- For reversible changes the user asked for (create, update, log, reschedule), act directly and then report what you did. For deletions, confirm first unless the user explicitly asked to delete in this conversation.",
    "- Assignees are 'dath', 'stel' or 'both'. Money is EUR unless stated otherwise. Dates are Europe/Athens; today is " + today + ".",
    "- Be concise and readable: lead with the outcome, then only the detail that changes what the founders do next. Plain prose over markdown structure; never invent numbers.",
  ].join("\n");
}

interface TurnRequest {
  history?: unknown;
  message?: unknown;
  model?: unknown;
}

type Msg = Anthropic.MessageParam;

/** Keep roughly the last `cap` messages, but never start mid-turn (the first kept
 *  message must be a plain-string user turn so tool_use/tool_result pairs stay intact). */
function trimHistory(history: Msg[], cap = 30): Msg[] {
  if (history.length <= cap) return history;
  for (let i = history.length - cap; i < history.length; i++) {
    const m = history[i];
    if (m && m.role === "user" && typeof m.content === "string") return history.slice(i);
  }
  return [];
}

export async function POST(req: Request): Promise<Response> {
  try {
    await assertAdmin();
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as TurnRequest;
  const message = typeof body.message === "string" ? body.message.slice(0, 8000).trim() : "";
  if (!message) return new Response(JSON.stringify({ error: "Empty message" }), { status: 400 });
  const history = trimHistory(Array.isArray(body.history) ? (body.history as Msg[]) : []);
  const requested =
    typeof body.model === "string" && (body.model === "quick" || body.model === "smart" || body.model === "deep")
      ? (body.model as Tier)
      : "auto";

  const credential = await getFounderCredential();
  if (!credential) {
    return new Response(
      JSON.stringify({ error: "No Anthropic credential — add yours in the Competitors tab (Your Anthropic key card)." }),
      { status: 400 },
    );
  }
  const client = makeAnthropicClient(credential);

  const encoder = new TextEncoder();
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (obj: Record<string, unknown>) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      const usage = { in: 0, cr: 0, cw: 0, out: 0 };
      const newMessages: Msg[] = [];
      const messages: Msg[] = [...history, { role: "user", content: message }];

      try {
        const picked: TierPick =
          requested === "auto"
            ? await pickTier(client, message)
            : { tier: requested, tokensIn: 0, tokensOut: 0, usd: 0 };
        const tier = picked.tier;
        emit({ t: "model", tier, label: TIERS[tier].label });
        const system = systemPrompt();

        for (let iter = 0; iter < MAX_ITERATIONS; iter++) {
          const msgStream = client.messages.stream(turnParams(tier, system, messages));
          msgStream.on("text", (delta) => emit({ t: "delta", text: delta }));
          const final = await msgStream.finalMessage();

          usage.in += final.usage.input_tokens ?? 0;
          usage.cr += final.usage.cache_read_input_tokens ?? 0;
          usage.cw += final.usage.cache_creation_input_tokens ?? 0;
          usage.out += final.usage.output_tokens ?? 0;

          newMessages.push({ role: "assistant", content: final.content });
          messages.push({ role: "assistant", content: final.content });

          if (final.stop_reason === "refusal") {
            emit({ t: "error", message: "The model declined that request. Try rephrasing it." });
            break;
          }
          // pause_turn = the model paused a long turn; replaying the conversation
          // as-is (it already ends with the assistant content) resumes it.
          if (final.stop_reason === "pause_turn") continue;
          if (final.stop_reason !== "tool_use") {
            if (final.stop_reason === "max_tokens") emit({ t: "delta", text: "\n\n[Response was cut short.]" });
            break;
          }

          const toolUses = final.content.filter((b): b is Anthropic.ToolUseBlock => b.type === "tool_use");
          const results: Anthropic.ToolResultBlockParam[] = [];
          for (const tu of toolUses) {
            emit({ t: "tool", name: tu.name, label: TOOL_LABELS[tu.name] ?? tu.name });
            try {
              const out = await runCopilotTool(tu.name, (tu.input ?? {}) as Record<string, unknown>);
              results.push({ type: "tool_result", tool_use_id: tu.id, content: out });
              emit({ t: "tool_done", name: tu.name, ok: true });
            } catch (err) {
              const msg = err instanceof Error ? err.message : "Tool failed";
              results.push({ type: "tool_result", tool_use_id: tu.id, content: msg, is_error: true });
              emit({ t: "tool_done", name: tu.name, ok: false });
            }
          }
          const resultMsg: Msg = { role: "user", content: results };
          newMessages.push(resultMsg);
          messages.push(resultMsg);

          if (iter === MAX_ITERATIONS - 1) {
            emit({ t: "error", message: "Stopped after too many steps — ask me to continue if the task is not finished." });
          }
        }

        const price = TIERS[tier].price;
        const usd =
          picked.usd +
          (usage.in * price.in + usage.cr * price.cr + usage.cw * price.cw + usage.out * price.out) / 1_000_000;
        emit({
          t: "done",
          messages: newMessages,
          usage: {
            inputTokens: usage.in + usage.cr + usage.cw + picked.tokensIn,
            outputTokens: usage.out + picked.tokensOut,
            usd,
          },
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Something went wrong.";
        try {
          emit({ t: "error", message: msg });
        } catch {
          // client disconnected — nothing to report to
        }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/x-ndjson; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      "X-Accel-Buffering": "no",
    },
  });
}
