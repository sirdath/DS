import { NextResponse } from "next/server";
import { assertAdmin } from "../../../../admin/lib/assert-admin";

export const runtime = "nodejs";

/**
 * Compile a pasted blob of raw leads into structured rows — deterministic, no
 * LLM/API key. Splits into entries (blank-line blocks, else one per line) and
 * pulls out email / website / phone with regex; the leftover is the name.
 */
interface ParsedLead {
  name: string;
  category: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  area: string | null;
  notes: string | null;
}

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const URL = /\b(?:https?:\/\/)?(?:www\.)?[a-z0-9][a-z0-9-]*\.(?:gr|com|net|org|eu|io|co|de|uk|cy|info|shop)(?:\.[a-z]{2})?(?:\/[^\s,;|]*)?/i;
const PHONE = /\+?\d[\d().\-\s]{6,}\d/;

function parseEntry(block: string): ParsedLead | null {
  const lines = block.split(/\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return null;

  let rest = block.replace(/\s+/g, " ").trim();

  const email = rest.match(EMAIL)?.[0] ?? null;
  if (email) rest = rest.replace(email, " ");

  // Website only after stripping the email, so we never grab the email's domain.
  const website = rest.match(URL)?.[0] ?? null;
  if (website) rest = rest.replace(website, " ");

  let phone: string | null = null;
  const pm = rest.match(PHONE);
  if (pm) {
    const digits = pm[0].replace(/\D/g, "");
    if (digits.length >= 8 && digits.length <= 15) {
      phone = pm[0].trim().replace(/\s{2,}/g, " ");
      rest = rest.replace(pm[0], " ");
    }
  }

  // Name = first line with the extracted bits removed; fall back to the leftover.
  let name = lines[0]!.replace(EMAIL, "").replace(URL, "");
  if (phone) name = name.replace(phone, "");
  name = name.replace(/[•·|,;:]+/g, " ").replace(/\s{2,}/g, " ").trim().replace(/[-–, •·|,;:]+$/, "").trim();
  if (name.length < 2) {
    name = rest.replace(/[•·|,;:]+/g, " ").replace(/\s{2,}/g, " ").trim();
  }
  if (name.length < 2 || !/[a-zα-ω]/i.test(name)) return null;

  return { name, category: null, phone, email, website, area: null, notes: null };
}

function parseRawLeads(text: string): ParsedLead[] {
  const blocks = /\n\s*\n/.test(text) ? text.split(/\n\s*\n/) : text.split(/\n/);
  const out: ParsedLead[] = [];
  const seen = new Set<string>();
  for (const b of blocks) {
    if (out.length >= 500) break;
    const lead = parseEntry(b);
    if (!lead) continue;
    const key = `${lead.name}|${lead.phone ?? ""}`.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(lead);
  }
  return out;
}

/** POST { text } → structured leads (preview only; insert via server action). */
export async function POST(request: Request): Promise<Response> {
  try {
    await assertAdmin();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
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

  const leads = parseRawLeads(text);
  if (!leads.length) {
    return NextResponse.json({ ok: false, error: "Couldn't pick out any leads, put one business per line." }, { status: 422 });
  }
  return NextResponse.json({ ok: true, leads });
}
