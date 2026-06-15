/**
 * The dedupe key. Derived from the business event (tenant + invoice + step +
 * scheduled date), never from a retry counter — so two independent code paths
 * that decide "send step r2 for invoice X on 2026-06-20" produce the SAME key and
 * collapse to one send. This is the contract the outbox unique index enforces.
 */

import { createHash } from "node:crypto";
import type { IsoDate } from "./types";

export function deriveKey(tenantId: string, invoiceId: string, stepId: string, scheduledFor: IsoDate): string {
  return createHash("sha256").update(`${tenantId}:${invoiceId}:${stepId}:${scheduledFor}`).digest("hex").slice(0, 24);
}
