/**
 * Channel adapter stubs — the seams for the channels we will wire next, kept
 * deliberately unbuilt so the engine ships channel-ready without committing to a
 * provider. Each documents exactly what wiring it involves; each throws until then.
 *
 * Security note: when these are built, inbound webhooks MUST verify the provider's
 * signature before trusting a payload, rate-limit per sender, and never log message
 * bodies (PII) — mirror apps/ds-site/src/app/api/contact/route.ts.
 */

import type { ChannelAdapter, InboundMessage, OutboundMessage } from "./adapter";

function notWired(channel: string): never {
  throw new Error(`${channel} adapter not wired — provider pending`);
}

/**
 * Telegram Bot API. Inbound: a webhook receives an `Update` (message.text,
 * message.chat.id). Verify via a secret path token or `X-Telegram-Bot-Api-Secret-Token`.
 * Outbound: POST sendMessage with the bot token. See api/contact/route.ts for the
 * outbound-to-Telegram shape already used elsewhere in the repo.
 */
export const telegramAdapter: ChannelAdapter = {
  channel: "telegram",
  normaliseInbound: () => notWired("telegram"),
  formatOutbound: (reply: string, ctx: InboundMessage): OutboundMessage => ({
    conversationId: ctx.conversationId,
    text: reply,
    channel: "telegram",
  }),
};

/**
 * WhatsApp Cloud API (Meta). Inbound: GET verify handshake (hub.verify_token),
 * then POST `messages` payloads — verify `X-Hub-Signature-256` (HMAC-SHA256 with
 * the app secret) before trusting. Outbound: POST to the Graph API messages
 * endpoint with the phone-number id + access token.
 */
export const whatsappAdapter: ChannelAdapter = {
  channel: "whatsapp",
  normaliseInbound: () => notWired("whatsapp"),
  formatOutbound: (reply: string, ctx: InboundMessage): OutboundMessage => ({
    conversationId: ctx.conversationId,
    text: reply,
    channel: "whatsapp",
  }),
};

/**
 * Phone voice. The same engine drives a call: speech-to-text turns the caller's
 * audio into `text` → respond() → text-to-speech speaks the reply. The provider
 * (managed: Vapi/Retell/Bland, or Twilio Media Streams + Deepgram/ElevenLabs) is
 * the seam — decided when we build voice for real. `conversationId` is the call id.
 */
export const voiceAdapter: ChannelAdapter = {
  channel: "voice",
  normaliseInbound: () => notWired("voice"),
  formatOutbound: (reply: string, ctx: InboundMessage): OutboundMessage => ({
    conversationId: ctx.conversationId,
    text: reply,
    channel: "voice",
  }),
};
