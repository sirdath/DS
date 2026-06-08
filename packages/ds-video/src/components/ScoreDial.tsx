import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, INTER, ORBITRON } from "../theme";

/**
 * Lighthouse-style circular score ring that fills 0 → target and counts up.
 * Ring is periwinkle; the centre number snaps to green once it hits 100.
 */
export const ScoreDial: React.FC<{
  start?: number;
  target?: number;
  label?: string;
  size?: number;
}> = ({ start = 0, target = 100, label = "Lighthouse", size = 260 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const p = spring({
    frame: frame - start,
    fps,
    config: { damping: 200, mass: 1.1 },
    durationInFrames: Math.round(fps * 1.6),
  });

  const value = Math.round(interpolate(p, [0, 1], [0, target]));
  const stroke = 14;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - (value / 100) * 0.999);
  const perfect = value >= 100;
  const ringColor = perfect ? COLORS.green : COLORS.periwinkle;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 22 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={size / 2} cy={size / 2} r={r} stroke={COLORS.line} strokeWidth={stroke} fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={ringColor}
            strokeWidth={stroke}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            style={{ filter: `drop-shadow(0 0 14px ${ringColor}88)` }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: ORBITRON,
            fontSize: size * 0.34,
            fontWeight: 700,
            color: perfect ? COLORS.green : COLORS.white,
          }}
        >
          {value}
        </div>
      </div>
      <div
        style={{
          fontFamily: INTER,
          fontSize: 22,
          fontWeight: 500,
          letterSpacing: "0.02em",
          color: COLORS.muted,
        }}
      >
        {label}
      </div>
    </div>
  );
};
