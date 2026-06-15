/**
 * The send seam. A reminder only leaves the building after human approval, through
 * one of these channels (email first; SMS/Viber/WhatsApp later, all behind this
 * interface). `dispatch` enforces the last safety net: a dispatch-time balance
 * re-check, so we never chase money that landed between approval and send.
 */

import type { IsoInstant, Minor } from "./types";

export interface OutboundMessage {
  to: string;
  subject: string;
  body: string;
}

export interface SendResult {
  providerMessageId: string;
  acceptedAt: IsoInstant;
}

export interface Channel {
  readonly kind: string;
  /** Idempotency key is passed through to the provider where it dedupes too. */
  send(message: OutboundMessage, idempotencyKey: string): Promise<SendResult>;
}

/** Records and returns a fake id — never sends. Default in dev/tests. */
export class StubChannel implements Channel {
  readonly kind = "stub";
  async send(_message: OutboundMessage, idempotencyKey: string): Promise<SendResult> {
    return { providerMessageId: `stub-${idempotencyKey}`, acceptedAt: new Date().toISOString() };
  }
}

/** Records every send so tests can assert exactly-once. */
export class SpyChannel implements Channel {
  readonly kind = "spy";
  readonly sends: Array<{ message: OutboundMessage; idempotencyKey: string }> = [];
  async send(message: OutboundMessage, idempotencyKey: string): Promise<SendResult> {
    this.sends.push({ message, idempotencyKey });
    return { providerMessageId: `spy-${this.sends.length}`, acceptedAt: new Date().toISOString() };
  }
}

export interface DispatchOutcome {
  sent: boolean;
  reason?: string;
  result?: SendResult;
}

/**
 * Send through a channel, but only after re-checking the live balance. If cash has
 * landed since approval (chaseableDue ≤ 0), abort — this is the final stop-on-payment
 * guard. `recheckChaseableDue` reads the current outstanding for the invoice.
 */
export async function dispatch(
  channel: Channel,
  message: OutboundMessage,
  idempotencyKey: string,
  recheckChaseableDue: () => Promise<Minor>,
): Promise<DispatchOutcome> {
  const due = await recheckChaseableDue();
  if (due <= 0) return { sent: false, reason: "invoice settled before send" };
  const result = await channel.send(message, idempotencyKey);
  return { sent: true, result };
}
