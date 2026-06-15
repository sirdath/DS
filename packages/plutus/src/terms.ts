/**
 * Payment-terms → due date. The only place term math lives, so a "Net 30" or
 * "end-of-month + 15" always resolves the same way. Pure.
 */

import { addDays, endOfMonth } from "./calendar";
import type { IsoDate, PaymentTerms } from "./types";

export function dueDateFor(issueDate: IsoDate, terms: PaymentTerms): IsoDate {
  switch (terms.kind) {
    case "due_on_receipt":
      return issueDate;
    case "net":
      return addDays(issueDate, terms.days);
    case "eom":
      return addDays(endOfMonth(issueDate), terms.days);
  }
}
