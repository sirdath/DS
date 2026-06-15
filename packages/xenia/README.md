# @ds/xenia — AI Receptionist

Xenia talks to a customer in Greek or English, checks availability, and books an appointment — over
chat or, later, the phone. It's the booking brain behind the "ai-receptionist" product: an engine, not
a channel. Feed it customer text + conversation state; get back a reply, the next state, and the cost.

## How it works

One customer turn in, one reply out, with a **Claude tool-use loop** in between (the first agentic loop
in this monorepo — Fama is a batch pipeline; Xenia is a conversation):

1. Build the cached system prompt (persona + services + hours + booking rules) and replay the
   conversation so far.
2. Loop: ask **Sonnet 4.6** for the next turn. If it calls a tool, run the tool against the store and
   feed the result back; when it replies with text, fold state and return.
3. The loop is **hop-capped** — a misbehaving turn can never spin unbounded (a cost + abuse guard).

**Three tools**: `get_availability(service, date)` → real slots; `create_booking(…)` → a confirmed
appointment; `handoff_to_human(reason)` → escalate. The model is told to check availability before
proposing a time and to confirm only when it has everything — but the **store owns the truth**, so the
model can't invent a slot or a booking.

**Channel- and source-agnostic.** Availability and bookings live behind a `BookingStore` /
`AvailabilityProvider` seam (an in-memory stub now; Supabase + Google Calendar/Cal.com later). Channels
live behind a `ChannelAdapter` seam — a real console adapter drives the playground, and Telegram,
WhatsApp and phone-voice are documented stubs ready to wire (the voice seam is STT → `respond()` → TTS).

Every turn's token usage and cost is summed into the result.

## Usage

```ts
import { respond, createConversation, InMemoryStore } from "@ds/xenia";

const store = new InMemoryStore();
let state = createConversation(business); // business: BusinessConfig

const result = await respond(business, state, "Can I book a table for two on Friday?", { store });
state = result.state; // thread this back on the next turn
console.log(result.reply); // reply in the customer's language
console.log(result.state.status); // collecting | proposing | confirmed | handoff
console.log(result.usage.usd); // what the turn cost
```

## Demo

Four sample businesses are bundled (`src/samples.ts`, exported as `SAMPLE_BUSINESSES`): taverna, dental
clinic, boutique hotel, specialty cafe — each with real services, opening hours and booking rules.

```bash
ANTHROPIC_API_KEY=sk-… pnpm --filter @ds/xenia demo            # taverna (default)
ANTHROPIC_API_KEY=sk-… pnpm --filter @ds/xenia demo dental     # or hotel / cafe
```

Type messages (Greek or English); Xenia checks availability and books against an in-memory store. Try
*"Θέλω τραπέζι για 4 αύριο το βράδυ"* or *"Can I book a table for two on Friday at 8?"*. `/quit` to leave.

## Scripts

| Script | What it does |
| --- | --- |
| `pnpm --filter @ds/xenia demo [sample]` | Converse with Xenia for a sample business (live) |
| `pnpm --filter @ds/xenia test` | Run the test suite (no API key needed) |
| `pnpm --filter @ds/xenia check-types` | Typecheck |

The tests cover the pure logic and the **whole tool-use loop** via a scripted client — availability →
booking → confirmation, handoff, the hop cap, and refusal fallback — so they run without a key. The live
Sonnet calls run only via the demo.
