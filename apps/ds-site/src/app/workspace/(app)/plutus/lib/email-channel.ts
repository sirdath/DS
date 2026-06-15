/**
 * The email send seam, app-side. Implements the @ds/plutus `Channel` interface so
 * the engine's `dispatch()` (which re-checks the live balance first) can send an
 * approved reminder. Uses the Resend REST API over HTTPS — no SDK dependency, key
 * read server-side only. When no key is configured `getChannel()` returns the
 * engine's StubChannel, so the approval flow still works end-to-end in dev without
 * sending anything real.
 */

import 'server-only'

import { StubChannel, type Channel, type OutboundMessage, type SendResult } from '@ds/plutus'

const RESEND_ENDPOINT = 'https://api.resend.com/emails'

class ResendChannel implements Channel {
  readonly kind = 'resend'

  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(message: OutboundMessage, idempotencyKey: string): Promise<SendResult> {
    const res = await fetch(RESEND_ENDPOINT, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        // Resend honours this header for provider-side dedupe.
        'Idempotency-Key': idempotencyKey,
      },
      body: JSON.stringify({
        from: this.from,
        to: message.to,
        subject: message.subject,
        text: message.body,
      }),
    })

    if (!res.ok) {
      throw new Error(`Resend send failed (${res.status})`)
    }
    const json = (await res.json()) as { id?: string }
    return {
      providerMessageId: json.id ?? `resend-${idempotencyKey}`,
      acceptedAt: new Date().toISOString(),
    }
  }
}

/** Resend when configured, otherwise a no-op stub so the flow is always testable. */
export function getChannel(): Channel {
  const apiKey = process.env.RESEND_API_KEY
  const from = process.env.PLUTUS_EMAIL_FROM
  if (apiKey && from) return new ResendChannel(apiKey, from)
  return new StubChannel()
}
