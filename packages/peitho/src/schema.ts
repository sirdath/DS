/**
 * JSON Schema for CompanyBrief, used by the toolless synthesis call's
 * output_config.format. Schema rules (Anthropic structured output): every object
 * needs additionalProperties:false + required; no minLength/maxLength/minimum/
 * maximum, no recursion; enums OK.
 */

export const BRIEF_SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    overview: { type: "string" },
    whatTheyDo: { type: "string" },
    idealCustomers: { type: "string" },
    painPoints: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          title: { type: "string" },
          detail: { type: "string" },
          severity: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["title", "detail", "severity"],
      },
    },
    marketEnvironment: { type: "string" },
    competitors: { type: "array", items: { type: "string" } },
    recentSignals: { type: "array", items: { type: "string" } },
    outreachAngle: { type: "string" },
    talkingPoints: { type: "array", items: { type: "string" } },
    emailSeeds: { type: "array", items: { type: "string" } },
    confidence: { type: "number" },
    gaps: { type: "array", items: { type: "string" } },
  },
  required: [
    "overview",
    "whatTheyDo",
    "idealCustomers",
    "painPoints",
    "marketEnvironment",
    "competitors",
    "recentSignals",
    "outreachAngle",
    "talkingPoints",
    "emailSeeds",
    "confidence",
    "gaps",
  ],
} as const;
