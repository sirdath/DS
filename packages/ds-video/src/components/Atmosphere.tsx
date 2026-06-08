import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * DS2 "Smoked" atmosphere — ink background with two slow-drifting radial orbs
 * (periwinkle + rose, the hero smoke palette) and a soft vignette. Restrained,
 * deterministic (driven by frame), no spotlight glow — matches the site.
 */
const INK = "#0a0a0a";

export const Atmosphere: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  // slow, smooth drift
  const o1x = 32 + Math.sin(t * 0.18) * 7;
  const o1y = 30 + Math.cos(t * 0.15) * 6;
  const o2x = 70 + Math.cos(t * 0.13) * 7;
  const o2y = 68 + Math.sin(t * 0.2) * 6;

  return (
    <AbsoluteFill style={{ backgroundColor: INK, overflow: "hidden" }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(46% 46% at ${o1x}% ${o1y}%, rgba(153,144,241,0.30), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(42% 42% at ${o2x}% ${o2y}%, rgba(246,190,218,0.16), transparent 70%)`,
        }}
      />
      {/* soft vignette toward edges */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(120% 120% at 50% 50%, transparent 52%, rgba(0,0,0,0.6) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
