/**
 * The one model call. Claude turns the frozen facts into a single payment-reminder
 * message — and nothing else. It may not invent or change a number; it must write
 * in the customer's language (Greek in the formal register); it must never threaten
 * or add marketing. The result is fact-checked before it leaves this module, so a
 * drifted draft is flagged rather than trusted.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { createHash } from "node:crypto";
import { DRAFT_MODEL, costUsd, getClient } from "./client";
import { factCheck } from "./factcheck";
import type { ReminderDraft, ReminderFacts } from "./types";

const DRAFT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    subject: { type: "string" },
    body: { type: "string" },
  },
  required: ["subject", "body"],
} as const;

const SYSTEM = [
  "You are the drafting layer of Plutus, an accounts-receivable tool. You write ONE payment-reminder message, from a business to its customer, using only the facts you are given. You are a careful, professional credit-control writer.",
  "",
  "Hard rules — non-negotiable:",
  "1. Use ONLY the facts provided. NEVER invent or change any number, amount, date, or invoice reference. Quote the amount due and the invoice number EXACTLY as given.",
  "2. Write entirely in the requested language. For Greek (el), use the formal register (πληθυντικός ευγενείας / εσείς): open with 'Αξιότιμε κύριε / Αξιότιμη κυρία' (or 'Αγαπητέ/ή' for the warmer tones), close with 'Με εκτίμηση'. For English (en), match UK business tone.",
  "3. Follow the tone exactly: friendly = warm heads-up, assume good faith; neutral = polite and factual; firm = direct, state it is overdue, invite them to flag any problem with the invoice; formal = formal register, summarise the situation and its impact; final = a last notice before escalation — factual and procedural, never angry.",
  "4. NEVER threaten, never imply legal powers you do not have, never mention contacting third parties, and never add ANY marketing, upsell, discount, or promotional content.",
  "5. Make paying easy: ask clearly for payment and offer to resolve any issue. Honour the 'intent' note for this step (e.g. offer a payment plan).",
  "6. If a statutory note is provided, you MAY include it once, stated as a plain fact, only when the tone is formal or final.",
  "7. If pay-to instructions are provided, include them verbatim.",
  "",
  "Output a short email: a subject line (include the business name + invoice number) and a 2–4 sentence body. Sign off from the business by name. Do NOT invent a person's name as signatory.",
].join("\n");

function firstText(content: Anthropic.Messages.ContentBlock[]): string {
  for (const block of content) {
    if (block.type === "text") return block.text;
  }
  throw new Error("no text block in draft response");
}

export interface DraftOptions {
  client?: Anthropic;
  apiKey?: string;
}

export async function draftReminder(facts: ReminderFacts, opts: DraftOptions = {}): Promise<ReminderDraft> {
  const client = opts.client ?? getClient(opts.apiKey);
  const response = await client.messages.create({
    model: DRAFT_MODEL,
    max_tokens: 900,
    thinking: { type: "disabled" },
    system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
    output_config: { format: { type: "json_schema", schema: DRAFT_SCHEMA } },
    messages: [
      {
        role: "user",
        content: ["Write the reminder. Facts (use exactly):", "", "```json", JSON.stringify(facts, null, 2), "```"].join("\n"),
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("draft: model refused");
  }

  const parsed = JSON.parse(firstText(response.content)) as { subject: string; body: string };
  const subject = parsed.subject ?? "";
  const body = parsed.body ?? "";
  const check = factCheck(subject, body, facts);

  return {
    idempotencyKey: "", // assigned by the engine when it attaches the schedule
    customerId: "",
    invoiceId: "",
    stepId: "",
    lang: facts.lang,
    channel: "email",
    subject,
    body,
    bodyHash: createHash("sha256").update(`${subject}\n${body}`).digest("hex").slice(0, 16),
    factCheckPassed: check.passed,
    factCheckIssues: check.issues,
    usage: {
      input_tokens: response.usage.input_tokens ?? 0,
      output_tokens: response.usage.output_tokens ?? 0,
      cache_read_tokens: response.usage.cache_read_input_tokens ?? 0,
      cache_write_tokens: response.usage.cache_creation_input_tokens ?? 0,
      usd: costUsd(DRAFT_MODEL, response.usage),
    },
  };
}
