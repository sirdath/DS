import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, INTER, ORBITRON } from "../../theme";
import { ScoreDial } from "../ScoreDial";

/**
 * S4 — Quality, measured. The Lighthouse-style dial fills to 100 and the four
 * axes tick up alongside it: "fast, accessible, measured — every time".
 * (DELIVERY-CHECKLIST: Lighthouse ≥ 90 across all four axes.)
 */
const METRICS = ["Performance", "Accessibility", "Best practices", "SEO"];

export const PhasePerf: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - start;

  return (
    <div style={{ position: "absolute", inset: 0, padding: "0 88px", display: "flex", alignItems: "center", gap: 90 }}>
      <ScoreDial start={6} target={100} label="Lighthouse" size={300} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 30 }}>
        {METRICS.map((m, i) => {
          const p = spring({ frame: f - (14 + i * 9), fps, config: { damping: 200, mass: 1 }, durationInFrames: Math.round(fps * 1.2) });
          const value = Math.round(interpolate(p, [0, 1], [0, 100]));
          return (
            <div key={m}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 12 }}>
                <span style={{ fontFamily: INTER, fontSize: 24, fontWeight: 500, color: COLORS.white }}>{m}</span>
                <span style={{ fontFamily: ORBITRON, fontSize: 26, fontWeight: 700, color: value >= 100 ? COLORS.green : COLORS.periwinkle }}>{value}</span>
              </div>
              <div style={{ height: 10, borderRadius: 999, background: COLORS.line, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${value}%`,
                    borderRadius: 999,
                    background: value >= 100 ? COLORS.green : COLORS.periwinkle,
                    boxShadow: `0 0 12px ${value >= 100 ? COLORS.green : COLORS.periwinkle}66`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
