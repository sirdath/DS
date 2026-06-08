import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, INTER, MONO } from "../../theme";

/**
 * S2 — Code → UI. A terminal writes real-looking component code (left) while
 * the skeleton fills with real content (right): "then we build it — properly".
 */

type Seg = { t: string; c: string };
const K = COLORS.periwinkle; // keywords
const S = COLORS.rose; // strings
const A = COLORS.mint; // attrs / props
const TAG = COLORS.periwinkleSoft; // jsx tags
const P = COLORS.faint; // punctuation
const W = "rgba(245,244,251,0.82)"; // plain text

const LINES: Seg[][] = [
  [{ t: "import", c: K }, { t: " { ship } ", c: W }, { t: "from", c: K }, { t: " ", c: W }, { t: '"@ds/craft"', c: S }, { t: ";", c: P }],
  [],
  [{ t: "export default function ", c: K }, { t: "Site", c: TAG }, { t: "() {", c: P }],
  [{ t: "  return", c: K }, { t: " (", c: P }],
  [{ t: "    <", c: P }, { t: "Trust", c: TAG }, { t: " grounded honest", c: A }, { t: ">", c: P }],
  [{ t: "      built — not claimed", c: W }],
  [{ t: "    </", c: P }, { t: "Trust", c: TAG }, { t: ">", c: P }],
  [{ t: "  );", c: P }],
  [{ t: "}", c: P }],
];

const LINE_STEP = 8; // frames between lines appearing

export const PhaseCodeUI: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - start;

  const shownLines = Math.min(LINES.length, Math.max(0, Math.floor(f / LINE_STEP) + 1));
  const caretBlink = Math.floor(f / (fps * 0.36)) % 2 === 0;

  // right-side preview elements fill in as the code "runs"
  const Reveal: React.FC<{ delay: number; children: React.ReactNode; style?: React.CSSProperties }> = ({ delay, children, style }) => {
    const p = spring({ frame: f - delay, fps, config: { damping: 200, mass: 0.7 } });
    return (
      <div style={{ opacity: interpolate(p, [0, 1], [0, 1]), transform: `translateY(${interpolate(p, [0, 1], [14, 0])}px)`, ...style }}>
        {children}
      </div>
    );
  };

  return (
    <div style={{ position: "absolute", inset: 0, display: "flex" }}>
      {/* terminal */}
      <div style={{ width: "45%", background: "rgba(0,0,0,0.32)", borderRight: `1px solid ${COLORS.line}`, padding: "26px 30px", display: "flex", flexDirection: "column" }}>
        <div style={{ fontFamily: MONO, fontSize: 14, color: COLORS.faint, letterSpacing: "0.04em", marginBottom: 20 }}>
          site.tsx
        </div>
        <div style={{ fontFamily: MONO, fontSize: 21, lineHeight: 1.85 }}>
          {LINES.slice(0, shownLines).map((segs, i) => {
            const isLast = i === shownLines - 1;
            return (
              <div key={i} style={{ display: "flex", whiteSpace: "pre" }}>
                <span style={{ color: COLORS.faint, width: 30, flexShrink: 0, opacity: 0.6 }}>{i + 1}</span>
                <span>
                  {segs.map((s, j) => (
                    <span key={j} style={{ color: s.c }}>{s.t}</span>
                  ))}
                  {isLast && (
                    <span style={{ display: "inline-block", width: 11, height: 22, transform: "translateY(4px)", marginLeft: 2, background: caretBlink ? K : "transparent", borderRadius: 2 }} />
                  )}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* live preview */}
      <div style={{ flex: 1, padding: 44, display: "flex", flexDirection: "column", gap: 24, background: "linear-gradient(180deg, rgba(153,144,241,0.05), transparent 60%)" }}>
        <Reveal delay={6} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 22, color: COLORS.white, letterSpacing: "-0.01em" }}>yourbrand</div>
          <div style={{ display: "flex", gap: 22, alignItems: "center", fontFamily: INTER, fontSize: 15, color: COLORS.muted }}>
            <span>Work</span><span>About</span>
            <span style={{ padding: "9px 18px", borderRadius: 9, background: COLORS.periwinkle, color: COLORS.ink, fontWeight: 600 }}>Talk to us</span>
          </div>
        </Reveal>

        <Reveal delay={16} style={{ marginTop: 18 }}>
          <div style={{ fontFamily: INTER, fontWeight: 700, fontSize: 46, lineHeight: 1.08, color: COLORS.white, letterSpacing: "-0.02em" }}>
            Built — not <span style={{ color: COLORS.periwinkle }}>claimed.</span>
          </div>
        </Reveal>
        <Reveal delay={24}>
          <div style={{ fontFamily: INTER, fontSize: 19, lineHeight: 1.5, color: COLORS.muted, maxWidth: 460 }}>
            A site your customers trust on the first scroll — fast, honest, and grounded in what you actually do.
          </div>
        </Reveal>

        <div style={{ display: "flex", gap: 16, marginTop: "auto" }}>
          {[0, 1, 2].map((i) => (
            <Reveal key={i} delay={34 + i * 6} style={{ flex: 1 }}>
              <div style={{ height: 120, borderRadius: 14, background: COLORS.panelStrong, border: `1px solid ${COLORS.line}`, padding: 18, display: "flex", flexDirection: "column", justifyContent: "flex-end", gap: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: 9, background: "rgba(153,144,241,0.2)", border: `1px solid rgba(153,144,241,0.4)` }} />
                <div style={{ height: 9, width: "70%", borderRadius: 5, background: "rgba(245,244,251,0.22)" }} />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );
};
