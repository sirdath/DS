/**
 * A fresh conversation. The reply language defaults to the business's primary
 * language and is sticky thereafter (the model still follows the customer if they
 * switch). Callers thread the returned state back into `respond` on every turn.
 */

import type { BusinessConfig, ConversationState, Lang } from "./types";

export function createConversation(business: BusinessConfig, lang?: Lang): ConversationState {
  return {
    businessId: business.id,
    lang: lang ?? business.languages[0] ?? "el",
    status: "collecting",
    slots: {},
    history: [],
  };
}
