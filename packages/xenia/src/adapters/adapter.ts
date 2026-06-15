/**
 * The channel seam. A channel (text playground, Telegram, WhatsApp, phone) only
 * has to turn its provider's payload into an InboundMessage and turn a reply into
 * its provider's outbound shape. Everything between — understanding, availability,
 * booking — is the engine's job and is identical across channels.
 */

export interface InboundMessage {
  businessId: string;
  conversationId: string;
  text: string;
  channel: string;
}

export interface OutboundMessage {
  conversationId: string;
  text: string;
  channel: string;
}

export interface ChannelAdapter {
  readonly channel: string;
  /** Turn a raw provider payload into the engine's input. Validate at this boundary. */
  normaliseInbound(raw: unknown): InboundMessage;
  /** Turn the engine's reply into the provider's outbound shape. */
  formatOutbound(reply: string, ctx: InboundMessage): OutboundMessage;
}
