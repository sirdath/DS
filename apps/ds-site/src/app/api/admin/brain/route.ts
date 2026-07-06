import { NextResponse } from "next/server";
import { rememberFact, recallFacts, listFacts, forgetFact } from "@/app/admin/lib/brain";

// The brain bridge — lets LOCAL Claude Code agents (on the founders' laptops)
// share the same pgvector brain the deployed copilot uses. A tiny stdio MCP shim
// forwards its tool calls here over HTTPS. Path is /api/admin/* so the /admin/*
// login middleware does NOT gate it; the route guards itself with a narrow
// BRAIN_BRIDGE_TOKEN instead — so the powerful service-role key never leaves the
// server, and laptops hold only this scoped token.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BRIDGE_TOKEN = process.env.BRAIN_BRIDGE_TOKEN;

function authorized(req: Request): boolean {
  if (!BRIDGE_TOKEN) return false; // never run unguarded
  const bearer = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  const token = bearer || new URL(req.url).searchParams.get("token");
  return !!token && token === BRIDGE_TOKEN;
}

const asStr = (v: unknown): string | undefined => (typeof v === "string" ? v : undefined);
const asStrArr = (v: unknown): string[] =>
  Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];

export async function POST(req: Request) {
  if (!BRIDGE_TOKEN) {
    return NextResponse.json({ error: "brain bridge not configured" }, { status: 503 });
  }
  if (!authorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const action = asStr(body.action);
  try {
    switch (action) {
      case "recall": {
        const query = asStr(body.query)?.trim();
        if (!query) return NextResponse.json({ error: "query required" }, { status: 400 });
        const kRaw = typeof body.k === "number" ? body.k : 6;
        const k = Math.min(20, Math.max(1, Math.floor(kRaw)));
        const facts = await recallFacts(query, k);
        return NextResponse.json({ facts });
      }
      case "remember": {
        const content = asStr(body.content)?.trim();
        if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });
        const fact = await rememberFact({
          content,
          kind: asStr(body.kind) ?? "fact",
          tags: asStrArr(body.tags),
          source: asStr(body.source) ?? "local-agent",
          createdBy: asStr(body.createdBy) ?? "",
        });
        return NextResponse.json({ fact });
      }
      case "list": {
        const limRaw = typeof body.limit === "number" ? body.limit : 100;
        const limit = Math.min(500, Math.max(1, Math.floor(limRaw)));
        const facts = await listFacts(limit);
        return NextResponse.json({ facts });
      }
      case "forget": {
        const id = asStr(body.id)?.trim();
        if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
        await forgetFact(id);
        return NextResponse.json({ ok: true });
      }
      default:
        return NextResponse.json(
          { error: "action must be one of: recall, remember, list, forget" },
          { status: 400 },
        );
    }
  } catch (err) {
    return NextResponse.json(
      { error: String((err as Error)?.message ?? err) },
      { status: 500 },
    );
  }
}
