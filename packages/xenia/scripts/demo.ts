/**
 * Xenia demo — talk to the receptionist for a sample business in your terminal.
 *
 *   ANTHROPIC_API_KEY=sk-… pnpm --filter @ds/xenia demo            # taverna (default)
 *   ANTHROPIC_API_KEY=sk-… pnpm --filter @ds/xenia demo dental     # or hotel / cafe
 *
 * Type messages; Xenia checks availability and books against an in-memory store.
 * Try: "Θέλω τραπέζι για 4 αύριο το βράδυ" or "Can I book a table for two on Friday?".
 * Type /quit to leave. Needs a key (one Sonnet call per turn).
 */

import { createInterface } from "node:readline";
import {
  createConversation,
  getSample,
  InMemoryStore,
  respond,
  SAMPLE_KEYS,
  type SampleKey,
} from "../src/index";

function parseSampleArg(): SampleKey {
  const arg = process.argv[2];
  if (!arg) return "taverna";
  if ((SAMPLE_KEYS as readonly string[]).includes(arg)) return arg as SampleKey;
  console.error(`Unknown sample "${arg}". Choose one of: ${SAMPLE_KEYS.join(", ")}`);
  process.exit(1);
}

async function main(): Promise<void> {
  if (!process.env["ANTHROPIC_API_KEY"]) {
    console.error(
      "ANTHROPIC_API_KEY is not set.\n" +
        "  ANTHROPIC_API_KEY=sk-… pnpm --filter @ds/xenia demo taverna",
    );
    process.exit(1);
  }

  const business = getSample(parseSampleArg());
  const store = new InMemoryStore();
  let state = createConversation(business);
  let totalUsd = 0;

  console.log(`Xenia · ${business.name} — ${business.type}, ${business.location ?? ""}`);
  console.log(`Say hello (in Greek or English). Type /quit to leave.\n`);

  const rl = createInterface({ input: process.stdin, output: process.stdout, prompt: "you   › " });
  rl.prompt();
  for await (const line of rl) {
    const text = line.trim();
    if (text === "/quit" || text === "exit") break;
    if (text !== "") {
      try {
        const result = await respond(business, state, text, { store });
        state = result.state;
        totalUsd += result.usage.usd;
        console.log(`xenia › ${result.reply}`);
        const tag = result.handoff ? ` · handoff: ${result.handoff.reason}` : "";
        console.log(`        [${state.status}${tag} · $${totalUsd.toFixed(4)} total]\n`);
      } catch (e) {
        console.error("error:", e instanceof Error ? e.message : e);
      }
    }
    rl.prompt();
  }
  rl.close();
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
