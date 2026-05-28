import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { assertAdmin } from "../../../../admin/lib/assert-admin";

export const runtime = "nodejs";
export const maxDuration = 30;

const MODEL = "claude-haiku-4-5-20251001";

const SYSTEM = `You convert a messy block of pasted business "leads" into clean structured data.
The input is free-form: lines, paragraphs, copy-pasted directory rows, anything. Each distinct
business becomes one object. Extract only what is actually present — never invent data.

Output ONLY a JSON array (no prose, no markdown fences) of objects with EXACTLY these keys:
- "name": string (the business name; required — skip entries with no identifiable name)
- "category": string | null (e.g. "restaurant", "lawyer", "plumber"; best guess from context)
- "phone": string | null
- "email": string | null
- "website": string | null (a URL or domain; null if they clearly have none)
- "area": string | null (city/area if mentioned)
- "notes": string | null (anything else useful, e.g. "no website", "referred by X")

Greek text is common — keep Greek names as-is. If a value is missing, use null.`;

interface ParsedLead {
  name: string;
  category: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  area: string | null;
  notes: string | null;
}

/** POST { text } → Claude parses raw text into structured leads (preview only, no insert). */
export async function POST(request: Request): Promise<Response> {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ ok: false, error: "ANTHROPIC_API_KEY not configured." }, { status: 500 });
  }

  let body: { text?: string };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
  const text = (body.text ?? "").trim();
  if (text.length < 3) {
    return NextResponse.json({ ok: false, error: "Paste some leads first." }, { status: 400 });
  }

  try {
    const client = new Anthropic({ apiKey });
    const msg = await client.messages.create({
      model: MODEL,
      max_tokens: 8192,
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages: [
        { role: "user", content: text.slice(0, 60000) },
        { role: "assistant", content: "[" }, // prefill to force a JSON array
      ],
    });
    const out = msg.content.find((b) => b.type === "text");
    const jsonText = "[" + (out && out.type === "text" ? out.text : "");
    let leads: ParsedLead[];
    try {
      leads = JSON.parse(jsonText) as ParsedLead[];
    } catch {
      return NextResponse.json({ ok: false, error: "Couldn't parse that text into leads — try cleaning it up." }, { status: 422 });
    }
    const clean = leads.filter((l) => l && typeof l.name === "string" && l.name.trim().length > 0);
    return NextResponse.json({ ok: true, leads: clean });
  } catch (err) {
    const message = err instanceof Error ? err.message : "parse failed";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
