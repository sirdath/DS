import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { COLORS } from "../theme";

/**
 * Frame-driven typewriter. Reveals characters at `cps` chars/second starting
 * at `startFrame` (in the current Sequence's local frame space). Deterministic
 * — no timers — so renders reproduce exactly. Optional blinking block caret.
 */
export const Typewriter: React.FC<{
  text: string;
  startFrame?: number;
  cps?: number;
  caret?: boolean;
  caretColor?: string;
  style?: React.CSSProperties;
}> = ({ text, startFrame = 0, cps = 26, caret = true, caretColor = COLORS.periwinkle, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const elapsed = Math.max(0, frame - startFrame);
  const shown = Math.min(text.length, Math.floor((elapsed / fps) * cps));
  const done = shown >= text.length;

  // Caret blinks at ~1.4Hz once typing finishes; stays solid while typing.
  const blinkOn = !done || Math.floor(frame / (fps * 0.36)) % 2 === 0;

  return (
    <span style={style}>
      {text.slice(0, shown)}
      {caret && (
        <span
          style={{
            display: "inline-block",
            width: "0.58em",
            height: "1.05em",
            transform: "translateY(0.16em)",
            marginLeft: "0.04em",
            background: caretColor,
            opacity: blinkOn ? 1 : 0,
            borderRadius: 2,
          }}
        />
      )}
    </span>
  );
};
