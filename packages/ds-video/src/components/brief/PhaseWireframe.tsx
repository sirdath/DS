import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

/**
 * S1 — Structure. A page skeleton (nav · hero · card row) snaps into place,
 * staggered. Monochrome periwinkle wireframe blocks: "first, the structure".
 */
export const PhaseWireframe: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - start;

  const Block: React.FC<{ delay: number; style: React.CSSProperties }> = ({ delay, style }) => {
    const p = spring({ frame: f - delay, fps, config: { damping: 200, mass: 0.7 } });
    return (
      <div
        style={{
          opacity: interpolate(p, [0, 1], [0, 1]),
          transform: `translateY(${interpolate(p, [0, 1], [18, 0])}px)`,
          background: "rgba(153,144,241,0.11)",
          border: "1px solid rgba(153,144,241,0.24)",
          borderRadius: 10,
          ...style,
        }}
      />
    );
  };

  return (
    <div style={{ position: "absolute", inset: 0, padding: 52, display: "flex", flexDirection: "column", gap: 30 }}>
      {/* nav */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Block delay={0} style={{ width: 150, height: 26 }} />
        <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
          <Block delay={4} style={{ width: 70, height: 16 }} />
          <Block delay={6} style={{ width: 70, height: 16 }} />
          <Block delay={8} style={{ width: 70, height: 16 }} />
          <Block delay={10} style={{ width: 116, height: 40, background: "rgba(153,144,241,0.22)" }} />
        </div>
      </div>

      {/* hero */}
      <div style={{ display: "flex", gap: 36, flex: 1 }}>
        <div style={{ flex: 1.15, display: "flex", flexDirection: "column", justifyContent: "center", gap: 20 }}>
          <Block delay={14} style={{ width: "92%", height: 40 }} />
          <Block delay={18} style={{ width: "74%", height: 40 }} />
          <Block delay={24} style={{ width: "100%", height: 18, marginTop: 8, background: "rgba(153,144,241,0.07)" }} />
          <Block delay={26} style={{ width: "86%", height: 18, background: "rgba(153,144,241,0.07)" }} />
          <Block delay={32} style={{ width: 180, height: 50, marginTop: 14, background: "rgba(153,144,241,0.24)" }} />
        </div>
        <Block delay={20} style={{ flex: 1, borderRadius: 16 }} />
      </div>

      {/* cards */}
      <div style={{ display: "flex", gap: 26, height: 150 }}>
        <Block delay={38} style={{ flex: 1, borderRadius: 14 }} />
        <Block delay={42} style={{ flex: 1, borderRadius: 14 }} />
        <Block delay={46} style={{ flex: 1, borderRadius: 14 }} />
      </div>
    </div>
  );
};
