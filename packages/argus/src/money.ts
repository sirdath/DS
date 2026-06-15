/**
 * Money + ratio helpers. Rates are integer minor units; formatting happens only at
 * the edge (board rows, movement detail strings). pctChange is the one place a
 * percentage is defined, so every "X%" in the product traces to the same formula.
 */

import type { Currency, Minor } from "./types";

const SYMBOL: Record<Currency, string> = { EUR: "€", GBP: "£", USD: "$" };

/** Minor units → a compact display string, e.g. 12500 → "€125". */
export function formatMoney(amount: Minor, currency: Currency = "EUR"): string {
  const major = amount / 100;
  const body = Number.isInteger(major) ? String(major) : major.toFixed(2);
  return `${SYMBOL[currency] ?? ""}${body}`;
}

/** Fractional change (curr − prev) / prev, guarded against a zero base. */
export function pctChange(prev: number, curr: number): number {
  if (prev === 0) return curr === 0 ? 0 : 1;
  return (curr - prev) / prev;
}

/** Round a fraction to a whole-number percentage, e.g. -0.121 → -12. */
export function asPct(fraction: number): number {
  return Math.round(fraction * 100);
}
