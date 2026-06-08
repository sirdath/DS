import React from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { COLORS, INTER } from "../theme";

/**
 * Bottom kinetic caption — one short line per build phase. Crossfades + lifts
 * in/out over its [start, end] window (local frames). Baked-in captions carry
 * the story for muted autoplay (LinkedIn/feed).
 */
export const Caption: React.FC<{
  start: number;
  end: number;
  fade?: number;
  children: React.ReactNode;
}> = ({ start, end, fade = 12, children }) => {
  const frame = useCurrentFrame();
  if (frame < start - 2 || frame > end + 2) return null;

  const opacity = interpolate(
    frame,
    [start, start + fade, end - fade, end],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );
  const y = interpolate(frame, [start, start + fade], [14, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        position: "absolute",
        bottom: 96,
        left: 0,
        right: 0,
        textAlign: "center",
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <span
        style={{
          fontFamily: INTER,
          fontSize: 40,
          fontWeight: 500,
          letterSpacing: "-0.01em",
          color: COLORS.white,
        }}
      >
        {children}
      </span>
    </div>
  );
};
