/**
 * The console adapter — real, and the simplest possible implementation of the
 * seam. It drives the local text playground (scripts/demo.ts) and serves as the
 * reference an inbound webhook adapter (Telegram/WhatsApp/voice) is modelled on.
 */

import type { ChannelAdapter, InboundMessage, OutboundMessage } from "./adapter";

export interface ConsoleInbound {
  businessId: string;
  conversationId: string;
  text: string;
}

export class ConsoleAdapter implements ChannelAdapter {
  readonly channel = "console";

  normaliseInbound(raw: unknown): InboundMessage {
    if (typeof raw !== "object" || raw === null) {
      throw new Error("console adapter: payload is not an object");
    }
    const r = raw as Partial<ConsoleInbound>;
    if (!r.businessId || !r.conversationId || typeof r.text !== "string") {
      throw new Error("console adapter: missing businessId, conversationId or text");
    }
    return { businessId: r.businessId, conversationId: r.conversationId, text: r.text, channel: this.channel };
  }

  formatOutbound(reply: string, ctx: InboundMessage): OutboundMessage {
    return { conversationId: ctx.conversationId, text: reply, channel: this.channel };
  }
}
