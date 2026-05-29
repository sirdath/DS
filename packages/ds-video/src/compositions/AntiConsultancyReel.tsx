import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig, Sequence } from "remotion";

/**
 * C1 — Anti-Consultancy Reel (placeholder scaffold).
 *
 * Concept reference: docs/library/04-remotion-video-concepts.md
 * Structure target (60s @ 30fps = 1800 frames):
 *   0:00–0:03   Black, fade-in: "Most consultancies say:"
 *   0:03–0:10   3 generic consultancy lines, each strike-through
 *   0:10–0:15   Cut to white: "We say:"
 *   0:15–0:35   3 signature sentences animate in
 *   0:35–0:50   The four-beats line traces across
 *   0:50–1:00   Logo + URL + "DS2 Consulting. Athens — London."
 *
 * This file ships a minimal placeholder so the Remotion studio renders
 * something the moment you `pnpm install` on the M5. Fill in once the
 * concept is locked + script is written.
 */

const PURPLE = "#6D5DD3";
const INK = "#0E0B1F";

export const AntiConsultancyReel: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = interpolate(frame, [0, fps * 0.5], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ backgroundColor: INK, color: "white", fontFamily: "Inter, system-ui, sans-serif" }}>
      <Sequence from={0} durationInFrames={fps * 60}>
        <AbsoluteFill
          style={{
            justifyContent: "center",
            alignItems: "center",
            padding: 80,
            textAlign: "center",
            opacity: fadeIn,
          }}
        >
          <div style={{ fontSize: 28, letterSpacing: 6, textTransform: "uppercase", color: PURPLE, marginBottom: 24 }}>
            DS2 · Placeholder
          </div>
          <div style={{ fontSize: 64, fontWeight: 600, lineHeight: 1.15, maxWidth: 1400 }}>
            Anti-Consultancy Reel
          </div>
          <div style={{ fontSize: 22, opacity: 0.65, marginTop: 32, maxWidth: 900, lineHeight: 1.5 }}>
            Scaffold ready. Fill in script + storyboard on the M5.
            See <code>docs/library/04-remotion-video-concepts.md</code>.
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
