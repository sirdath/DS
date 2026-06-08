import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, INTER, MONO } from "../../theme";

/**
 * S5 — Shipped. A check draws, the deploy log lands, the window goes live.
 * "Shipped. And we don't walk away." — hands off to the close.
 */
const LOG = ["build passed", "142 tests green", "live · 38 ms TTFB"];

export const PhaseDeploy: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - start;

  const checkP = spring({ frame: f - 2, fps, config: { damping: 200, mass: 0.8 } });
  const titleP = spring({ frame: f - 14, fps, config: { damping: 200, mass: 0.7 } });

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28 }}>
      {/* drawing check */}
      <div style={{ width: 116, height: 116, borderRadius: "50%", border: `2px solid rgba(74,222,128,0.4)`, background: "rgba(74,222,128,0.10)", display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${interpolate(checkP, [0, 1], [0.6, 1])})`, opacity: checkP, boxShadow: `0 0 50px rgba(74,222,128,0.35)` }}>
        <svg width="58" height="58" viewBox="0 0 24 24" fill="none">
          <path d="M5 12.5l4.2 4.5L19 7" stroke={COLORS.green} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={interpolate(checkP, [0.2, 1], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" })} />
        </svg>
      </div>

      <div style={{ fontFamily: INTER, fontSize: 52, fontWeight: 700, letterSpacing: "-0.02em", color: COLORS.white, opacity: titleP, transform: `translateY(${interpolate(titleP, [0, 1], [14, 0])}px)` }}>
        Deployed.
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
        {LOG.map((line, i) => {
          const p = spring({ frame: f - (26 + i * 9), fps, config: { damping: 200, mass: 0.7 } });
          return (
            <div key={line} style={{ display: "flex", alignItems: "center", gap: 12, opacity: p, transform: `translateY(${interpolate(p, [0, 1], [8, 0])}px)`, fontFamily: MONO, fontSize: 20, color: COLORS.muted }}>
              <span style={{ color: COLORS.green }}>✓</span>
              {line}
            </div>
          );
        })}
      </div>
    </div>
  );
};
