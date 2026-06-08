import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadOrbitron } from "@remotion/google-fonts/Orbitron";
import { Atmosphere } from "../components/Atmosphere";
import { DS2Wordmark } from "../components/DS2Wordmark";

/**
 * C2 — DS2 Brand Reel (26s @ 30fps = 780 frames, 1920×1080).
 * Dark/periwinkle/smoke identity, signature copy, vector wordmark.
 * Restrained motion (fade-ups + soft drift) — no gloss, no spotlight.
 */

const { fontFamily: INTER } = loadInter("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});
const { fontFamily: ORBITRON } = loadOrbitron("normal", {
  weights: ["500", "700"],
  subsets: ["latin"],
});

const PERIWINKLE = "#9990F1"; // accent (lighter periwinkle reads better on ink)
const WHITE = "#f5f4fb";
const MUTED = "rgba(245,244,251,0.6)";

// --- helpers -------------------------------------------------------------

const FadeUp: React.FC<{
  delay?: number;
  y?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay = 0, y = 26, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.6 } });
  return (
    <div
      style={{
        opacity: interpolate(p, [0, 1], [0, 1]),
        transform: `translateY(${interpolate(p, [0, 1], [y, 0])}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

// Scene wrapper: centers content + fades the whole scene in/out at its edges.
const Scene: React.FC<{ durationInFrames: number; children: React.ReactNode }> = ({
  durationInFrames,
  children,
}) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(
    frame,
    [0, 14, durationInFrames - 16, durationInFrames],
    [0, 1, 1, 0],
    { extrapolateRight: "clamp", extrapolateLeft: "clamp" },
  );
  return (
    <AbsoluteFill
      style={{
        justifyContent: "center",
        alignItems: "center",
        textAlign: "center",
        padding: "0 12%",
        opacity,
        fontFamily: INTER,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};

const Eyebrow: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div
    style={{
      fontFamily: ORBITRON,
      fontSize: 22,
      letterSpacing: "0.38em",
      textTransform: "uppercase",
      color: PERIWINKLE,
      marginBottom: 34,
    }}
  >
    {children}
  </div>
);

const Headline: React.FC<{ children: React.ReactNode; size?: number }> = ({ children, size = 76 }) => (
  <div style={{ fontSize: size, fontWeight: 600, lineHeight: 1.12, color: WHITE, maxWidth: 1500, letterSpacing: "-0.02em" }}>
    {children}
  </div>
);

const accent = (t: string) => <span style={{ color: PERIWINKLE }}>{t}</span>;

// --- scenes --------------------------------------------------------------

export const DS2BrandReel: React.FC = () => {
  const { fps } = useVideoConfig();
  const s = (sec: number) => Math.round(sec * fps);

  return (
    <AbsoluteFill>
      <Atmosphere />

      {/* S1 — Wordmark intro (0–4s) */}
      <Sequence from={0} durationInFrames={s(4)}>
        <Scene durationInFrames={s(4)}>
          <FadeUp y={18}>
            <DS2Wordmark color={WHITE} style={{ width: 460, height: "auto" }} />
          </FadeUp>
          <FadeUp delay={14}>
            <div
              style={{
                fontFamily: ORBITRON,
                fontSize: 20,
                letterSpacing: "0.44em",
                textTransform: "uppercase",
                color: MUTED,
                marginTop: 30,
              }}
            >
              Digital Solutions Consulting
            </div>
          </FadeUp>
        </Scene>
      </Sequence>

      {/* S2 — The hook / signature line (4–10.5s) */}
      <Sequence from={s(4)} durationInFrames={s(6.5)}>
        <Scene durationInFrames={s(6.5)}>
          <Eyebrow>How we work</Eyebrow>
          <Headline>
            <FadeUp>We work best when we can be {accent("honest early")}</FadeUp>
            <FadeUp delay={20} style={{ marginTop: 8 }}>
              — even if that means {accent("challenging the initial idea.")}
            </FadeUp>
          </Headline>
        </Scene>
      </Sequence>

      {/* S3 — Who (10.5–15.5s) */}
      <Sequence from={s(10.5)} durationInFrames={s(5)}>
        <Scene durationInFrames={s(5)}>
          <FadeUp>
            <Headline size={68}>
              A senior team for {accent("strategy, engineering")}
              <br />
              and {accent("applied AI.")}
            </Headline>
          </FadeUp>
          <FadeUp delay={22}>
            <div
              style={{
                fontFamily: ORBITRON,
                fontSize: 24,
                letterSpacing: "0.34em",
                textTransform: "uppercase",
                color: MUTED,
                marginTop: 40,
              }}
            >
              Athens — London
            </div>
          </FadeUp>
        </Scene>
      </Sequence>

      {/* S4 — Three modes (15.5–21s) */}
      <Sequence from={s(15.5)} durationInFrames={s(5.5)}>
        <Scene durationInFrames={s(5.5)}>
          <FadeUp>
            <Headline size={64}>
              Three modes. {accent("You pick one.")}
            </Headline>
          </FadeUp>
          <div style={{ display: "flex", gap: 28, marginTop: 56, justifyContent: "center", flexWrap: "wrap" }}>
            {["End-to-end", "Consulting only", "Build only"].map((m, i) => (
              <FadeUp key={m} delay={20 + i * 12}>
                <div
                  style={{
                    border: "1px solid rgba(153,144,241,0.45)",
                    borderRadius: 14,
                    padding: "20px 34px",
                    fontSize: 30,
                    fontWeight: 500,
                    color: WHITE,
                    background: "rgba(153,144,241,0.07)",
                  }}
                >
                  {m}
                </div>
              </FadeUp>
            ))}
          </div>
        </Scene>
      </Sequence>

      {/* S5 — Close (21–26s) */}
      <Sequence from={s(21)} durationInFrames={s(5)}>
        <Scene durationInFrames={s(5)}>
          <FadeUp>
            <Headline size={70}>
              Projects end; {accent("responsibility doesn't.")}
            </Headline>
          </FadeUp>
          <FadeUp delay={26}>
            <DS2Wordmark color={WHITE} style={{ width: 230, height: "auto", marginTop: 56 }} />
          </FadeUp>
        </Scene>
      </Sequence>
    </AbsoluteFill>
  );
};
