/**
 * Money formatting. Stored as integer minor units; rendered for humans and used by
 * the fact-check guard. `amountVariants` returns the plausible string renderings of
 * an amount (en + Greek grouping) so the guard can confirm the draft actually quotes
 * the right number however the model formatted it.
 */

import type { Currency, Minor } from "./types";

const SYMBOL: Record<Currency, string> = { EUR: "€", GBP: "£", USD: "$" };

function group(intPart: string, sep: string): string {
  return intPart.replace(/\B(?=(\d{3})+(?!\d))/g, sep);
}

/** Human display, e.g. "€4,120.50". */
export function formatMoney(minor: Minor, currency: Currency): string {
  const major = (minor / 100).toFixed(2);
  const [intPart = "0", dec = "00"] = major.split(".");
  return `${SYMBOL[currency]}${group(intPart, ",")}.${dec}`;
}

/** The plausible string renderings of an amount, for the fact-check guard. */
export function amountVariants(minor: Minor): string[] {
  const major = minor / 100;
  const two = major.toFixed(2);
  const [intPart = "0", dec = "00"] = two.split(".");
  const whole = String(Math.round(major));
  return [
    two, // 4120.50
    `${group(intPart, ",")}.${dec}`, // 4,120.50
    `${intPart},${dec}`, // 4120,50  (Greek decimal)
    `${group(intPart, ".")},${dec}`, // 4.120,50 (Greek grouped)
    whole, // 4120
    group(whole, ","), // 4,120
    group(whole, "."), // 4.120
  ].filter((v, i, a) => a.indexOf(v) === i);
}
