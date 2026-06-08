/**
 * Shared palette + fonts for the marketing videos.
 * Single source of truth — components import from here, never hardcode hex.
 *
 * Dark-premium identity (matches DS2BrandReel + the site's lavender smoke).
 * Periwinkle is the only brand accent; green is reserved for literal
 * success/live signals (matches the site's deploy dot usage).
 */
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadOrbitron } from "@remotion/google-fonts/Orbitron";
import { loadFont as loadGeistMono } from "@remotion/google-fonts/GeistMono";

export const { fontFamily: INTER } = loadInter("normal", {
  weights: ["400", "500", "600", "700"],
  subsets: ["latin"],
});
export const { fontFamily: ORBITRON } = loadOrbitron("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});
export const { fontFamily: MONO } = loadGeistMono("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

export const COLORS = {
  ink: "#0a0a0a",
  white: "#f5f4fb",
  muted: "rgba(245,244,251,0.62)",
  faint: "rgba(245,244,251,0.34)",
  periwinkle: "#9990F1",
  periwinkleSoft: "#B9B0EE",
  rose: "#F6BEDA",
  mint: "#60C4A8",
  green: "#4ade80",
  line: "rgba(245,244,251,0.10)",
  panel: "rgba(255,255,255,0.035)",
  panelStrong: "rgba(255,255,255,0.06)",
} as const;
