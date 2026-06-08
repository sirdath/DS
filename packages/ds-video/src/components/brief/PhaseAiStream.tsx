import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS, INTER, MONO } from "../../theme";
import { Typewriter } from "../Typewriter";

/**
 * S3 — Applied AI. A grounded assistant streams a reply that cites the
 * client's own sources: "AI that's grounded in your data, not guessing".
 * On-brand: DS never ships an unguarded LLM endpoint.
 */
const SOURCES = ["refund-policy.pdf", "terms §4.2", "help-centre"];

export const PhaseAiStream: React.FC<{ start: number }> = ({ start }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const f = frame - start;

  const inSpring = (delay: number) =>
    spring({ frame: f - delay, fps, config: { damping: 200, mass: 0.7 } });

  const userP = inSpring(4);
  const asstP = inSpring(20);
  const replyStart = start + 28;
  const sourcesP = inSpring(96);

  return (
    <div style={{ position: "absolute", inset: 0, padding: "40px 64px", display: "flex", flexDirection: "column" }}>
      {/* header */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 30 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: "rgba(153,144,241,0.18)", border: `1px solid rgba(153,144,241,0.45)`, display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.periwinkle, fontFamily: MONO, fontSize: 16, fontWeight: 600 }}>✦</div>
        <div style={{ fontFamily: INTER, fontSize: 18, fontWeight: 600, color: COLORS.white }}>Assistant</div>
        <div style={{ fontFamily: MONO, fontSize: 13, letterSpacing: "0.05em", color: COLORS.green, padding: "5px 11px", borderRadius: 999, background: "rgba(74,222,128,0.10)", border: "1px solid rgba(74,222,128,0.30)" }}>GROUNDED</div>
      </div>

      {/* user message */}
      <div style={{ display: "flex", justifyContent: "flex-end", opacity: interpolate(userP, [0, 1], [0, 1]), transform: `translateY(${interpolate(userP, [0, 1], [12, 0])}px)` }}>
        <div style={{ maxWidth: 620, padding: "16px 22px", borderRadius: "16px 16px 4px 16px", background: "rgba(153,144,241,0.16)", border: `1px solid rgba(153,144,241,0.32)`, fontFamily: INTER, fontSize: 22, color: COLORS.white }}>
          Can I get a refund after three weeks?
        </div>
      </div>

      {/* assistant reply */}
      <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 22, opacity: interpolate(asstP, [0, 1], [0, 1]), transform: `translateY(${interpolate(asstP, [0, 1], [12, 0])}px)` }}>
        <div style={{ maxWidth: 760, padding: "20px 26px", borderRadius: "16px 16px 16px 4px", background: COLORS.panelStrong, border: `1px solid ${COLORS.line}`, fontFamily: INTER, fontSize: 23, lineHeight: 1.5, color: "rgba(245,244,251,0.92)" }}>
          <Typewriter
            text="Yes — you're covered for 30 days, no questions asked. Here's the exact clause from your policy."
            startFrame={replyStart}
            cps={30}
            caretColor={COLORS.periwinkle}
          />
        </div>
      </div>

      {/* sources */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 26, opacity: interpolate(sourcesP, [0, 1], [0, 1]), transform: `translateY(${interpolate(sourcesP, [0, 1], [10, 0])}px)` }}>
        <span style={{ fontFamily: MONO, fontSize: 14, color: COLORS.faint, letterSpacing: "0.04em" }}>sources</span>
        {SOURCES.map((s) => (
          <span key={s} style={{ fontFamily: MONO, fontSize: 14, color: COLORS.muted, padding: "6px 12px", borderRadius: 8, background: "rgba(0,0,0,0.3)", border: `1px solid ${COLORS.line}` }}>{s}</span>
        ))}
      </div>

      <div style={{ marginTop: "auto", fontFamily: INTER, fontSize: 16, color: COLORS.faint }}>
        Answered from your own content · cost-capped · never invented
      </div>
    </div>
  );
};
