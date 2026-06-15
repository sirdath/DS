/**
 * The synthesis — one Sonnet pass that turns the technical scan into the read a
 * business owner pays attention to. The numbers are already computed (scan.ts);
 * this writes the challenge-first verdict, the few prioritised fixes, and a draft
 * accessibility statement. DS2's voice: protective, never judgmental — "this
 * creates risk because…", paired with a fix and the trade-off.
 */

import type Anthropic from "@anthropic-ai/sdk";
import { AUDIT_MODEL, costUsd, getClient, type RawUsage } from "./client";
import { categoryLabel } from "./severity";
import type { HeadlineRisk, Priority, ScanResult } from "./types";

const AREAS = ["performance", "accessibility", "seo", "best-practices", "conversion"] as const;

const SYNTHESIS_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    overall_verdict: { type: "string" },
    headline_risks: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          area: { type: "string", enum: AREAS },
          risk: { type: "string" },
          why_it_matters: { type: "string" },
        },
        required: ["area", "risk", "why_it_matters"],
      },
    },
    priorities: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          area: { type: "string", enum: AREAS },
          action: { type: "string" },
          rationale: { type: "string" },
          effort: { type: "string", enum: ["quick", "moderate", "project"] },
        },
        required: ["area", "action", "rationale", "effort"],
      },
    },
    accessibility_statement: { type: "string" },
  },
  required: ["overall_verdict", "headline_risks", "priorities", "accessibility_statement"],
} as const;

const SYNTHESIS_SYSTEM = [
  "You are the analyst behind Aegis, a website-audit tool for DS2, a digital solutions consultancy. DS2's voice is challenge-first and protective: never \"this is wrong\", always \"this creates risk because…\", and every critique is paired with a constructive fix and its trade-off. You leave the decision with the owner.",
  "",
  "You are given a single page's technical scan: category scores (0–100), Core Web Vitals, and the failing audits. Produce the read a busy business owner needs.",
  "",
  "- overall_verdict: 2–3 sentences. The honest state of the page; name the dominant problem. Protective, specific, not alarmist.",
  "- headline_risks: the 3–5 issues that actually cost money or carry liability. Frame each as the risk it creates and why it matters — tie it to real impact: slow mobile pages lose visitors (≈53% abandon a load over 3 seconds); accessibility failures are a legal liability under the EU Accessibility Act (in force since June 2025; Greek fines reach €100,000); weak SEO/best-practices costs discovery and trust.",
  "- priorities: the few fixes that move the needle most, most important first (3–6). Each: a concrete action, a rationale tied to the scan, and an effort estimate (quick = hours, moderate = days, project = weeks). Be decisive.",
  "- accessibility_statement: a short DRAFT accessibility statement for this site in the EU-Accessibility-Act style — state the conformance target (WCAG 2.1 AA), list the known limitations drawn from the actual findings, and include a line inviting users to report problems. Make clear it is a draft to be reviewed, never a certification.",
  "",
  "Ground everything in the scan — do not invent issues or numbers. Plain language, for an owner, not a developer.",
].join("\n");

function firstText(content: Anthropic.Messages.ContentBlock[]): string {
  for (const block of content) {
    if (block.type === "text") return block.text;
  }
  throw new Error("no text block in synthesis response");
}

function buildUserPayload(scan: ScanResult): string {
  const payload = {
    url: scan.finalUrl,
    strategy: scan.strategy,
    scores: scan.scores.map((s) => ({ area: categoryLabel(s.key), score: s.score })),
    core_web_vitals: scan.vitals.map((v) => ({ metric: v.label, value: v.displayValue, rating: v.rating })),
    failing_audits: scan.findings.slice(0, 18).map((f) => ({
      area: f.category,
      severity: f.severity,
      issue: f.title,
      detail: f.displayValue ?? "",
    })),
  };
  return [
    "Here is the page scan. Use only what's here.",
    "",
    "```json",
    JSON.stringify(payload, null, 2),
    "```",
  ].join("\n");
}

export interface SynthesisResult {
  overall_verdict: string;
  headline_risks: HeadlineRisk[];
  priorities: Priority[];
  accessibility_statement: string;
  usage: RawUsage;
  usd: number;
}

interface RawSynthesis {
  overall_verdict: string;
  headline_risks: HeadlineRisk[];
  priorities: Array<Omit<Priority, "rank">>;
  accessibility_statement: string;
}

export async function synthesize(
  scan: ScanResult,
  opts: { client?: Anthropic; apiKey?: string } = {},
): Promise<SynthesisResult> {
  const client = opts.client ?? getClient(opts.apiKey);
  const response = await client.messages.create({
    model: AUDIT_MODEL,
    max_tokens: 2500,
    thinking: { type: "disabled" },
    system: [{ type: "text", text: SYNTHESIS_SYSTEM, cache_control: { type: "ephemeral" } }],
    output_config: { format: { type: "json_schema", schema: SYNTHESIS_SCHEMA } },
    messages: [{ role: "user", content: buildUserPayload(scan) }],
  });

  if (response.stop_reason === "refusal") {
    throw new Error("synthesis: model refused");
  }

  const raw = JSON.parse(firstText(response.content)) as RawSynthesis;
  const priorities: Priority[] = (raw.priorities ?? []).map((p, i) => ({ ...p, rank: i + 1 }));
  return {
    overall_verdict: raw.overall_verdict ?? "",
    headline_risks: raw.headline_risks ?? [],
    priorities,
    accessibility_statement: raw.accessibility_statement ?? "",
    usage: response.usage,
    usd: costUsd(AUDIT_MODEL, response.usage),
  };
}
