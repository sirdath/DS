import { assertAdmin } from "../../../../admin/lib/assert-admin";
import { COPILOT_TOOLS, runCopilotTool } from "../../../../admin/lib/copilot-tools";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Executes ONE copilot action the founder confirmed in the chat. The agent loop
 * in ../route.ts intercepts destructive tools and never runs them; instead it
 * emits a confirm card, and only if the founder taps Confirm does the client
 * POST here to actually run it. Admin-gated; the name must be a real copilot tool.
 */
const TOOL_NAMES = new Set(COPILOT_TOOLS.map((t) => t.name));

export async function POST(req: Request): Promise<Response> {
  try {
    await assertAdmin();
  } catch {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = (await req.json().catch(() => ({}))) as { name?: unknown; input?: unknown };
  const name = typeof body.name === "string" ? body.name : "";
  if (!name || !TOOL_NAMES.has(name)) {
    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400 });
  }
  const input = (body.input && typeof body.input === "object" ? body.input : {}) as Record<string, unknown>;

  try {
    const result = await runCopilotTool(name, input);
    return new Response(JSON.stringify({ ok: true, result }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Action failed";
    return new Response(JSON.stringify({ ok: false, error: message }), { status: 500 });
  }
}
