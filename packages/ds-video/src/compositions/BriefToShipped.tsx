import React from "react";
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Atmosphere } from "../components/Atmosphere";
import { DS2Wordmark } from "../components/DS2Wordmark";
import { BrowserChrome } from "../components/BrowserChrome";
import { Caption } from "../components/Caption";
import { Typewriter } from "../components/Typewriter";
import { PhaseWireframe } from "../components/brief/PhaseWireframe";
import { PhaseCodeUI } from "../components/brief/PhaseCodeUI";
import { PhaseAiStream } from "../components/brief/PhaseAiStream";
import { PhasePerf } from "../components/brief/PhasePerf";
import { PhaseDeploy } from "../components/brief/PhaseDeploy";
import { SfxTrack } from "../components/SfxTrack";
import { COLORS, INTER, ORBITRON } from "../theme";

/**
 * "Brief → Shipped" — DS marketing reel (35s @ 30fps = 1050 frames, 1920×1080).
 *
 * A SaaS launch-style montage: one client brief becomes a live, fast,
 * AI-equipped site — shown as craft, not claimed in buzzwords. A single
 * browser window persists and morphs through the build (structure → code →
 * AI → quality → live), then resolves to the signature responsibility line.
 *
 * Designed for muted autoplay: captions baked in. Sound/VO added later.
 */

// ── timeline (frames) ───────────────────────────────────────────────────
const S0_BRIEF = { from: 0, dur: 138 }; // 0–4.6s
const BUILD = { from: 132, dur: 768 }; // 4.4–30.0s
const S6_CLOSE = { from: 894, dur: 156 }; // 29.8–35.0s

// Phase windows in BUILD-local frames. Adjacent windows overlap ~12f for crossfade.
const PH = {
  wire: { vis: [16, 150], cap: [30, 150], start: 16 },
  code: { vis: [138, 348], cap: [150, 346], start: 138 },
  ai: { vis: [336, 540], cap: [346, 540], start: 336 },
  perf: { vis: [528, 690], cap: [540, 688], start: 528 },
  deploy: { vis: [678, 768], cap: [688, 766], start: 678 },
} as const;

// crossfade opacity over [a, b] with `fade`-frame ramps
const band = (fr: number, a: number, b: number, fade = 14) =>
  interpolate(fr, [a, a + fade, b - fade, b], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const PhaseLayer: React.FC<{ opacity: number; children: React.ReactNode }> = ({ opacity, children }) =>
  opacity <= 0.001 ? null : <div style={{ position: "absolute", inset: 0, opacity }}>{children}</div>;

// shared spring-driven fade-up (matches DS2BrandReel feel)
const FadeUp: React.FC<{ delay?: number; y?: number; children: React.ReactNode; style?: React.CSSProperties }> = ({
  delay = 0,
  y = 24,
  children,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - delay, fps, config: { damping: 200, mass: 0.6 } });
  return (
    <div style={{ opacity: interpolate(p, [0, 1], [0, 1]), transform: `translateY(${interpolate(p, [0, 1], [y, 0])}px)`, ...style }}>
      {children}
    </div>
  );
};

const sceneFade = (frame: number, dur: number, ramp = 14) =>
  interpolate(frame, [0, ramp, dur - ramp, dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

// ── S0 — the brief ──────────────────────────────────────────────────────
const BriefScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", fontFamily: INTER, opacity: sceneFade(frame, S0_BRIEF.dur) }}>
      <FadeUp>
        <div style={{ fontFamily: ORBITRON, fontSize: 21, letterSpacing: "0.42em", textTransform: "uppercase", color: COLORS.periwinkle, marginBottom: 40 }}>
          The brief
        </div>
      </FadeUp>
      <div style={{ fontSize: 64, fontWeight: 600, color: COLORS.white, letterSpacing: "-0.02em", maxWidth: 1280, lineHeight: 1.15 }}>
        <Typewriter text="We need a new site. Maybe some AI?" startFrame={14} cps={22} caretColor={COLORS.periwinkle} />
      </div>
      <FadeUp delay={78} style={{ marginTop: 38 }}>
        <div style={{ fontSize: 26, color: COLORS.muted }}>— that&rsquo;s usually where it starts.</div>
      </FadeUp>
    </AbsoluteFill>
  );
};

// ── build stage — the persistent, morphing window ────────────────────────
const BuildStage: React.FC = () => {
  const bf = useCurrentFrame();
  const live = bf >= PH.deploy.start;
  const windowOpacity = interpolate(bf, [0, 14, BUILD.dur - 16, BUILD.dur], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const windowScale = interpolate(bf, [0, 14, BUILD.dur - 16, BUILD.dur], [0.965, 1, 1, 0.99], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center" }}>
      <div style={{ transform: `translateY(-30px) scale(${windowScale})`, opacity: windowOpacity }}>
        <BrowserChrome url={live ? "yourbrand.com" : "localhost:3000"} live={live} width={1340} height={700}>
          <PhaseLayer opacity={band(bf, ...PH.wire.vis)}><PhaseWireframe start={PH.wire.start} /></PhaseLayer>
          <PhaseLayer opacity={band(bf, ...PH.code.vis)}><PhaseCodeUI start={PH.code.start} /></PhaseLayer>
          <PhaseLayer opacity={band(bf, ...PH.ai.vis)}><PhaseAiStream start={PH.ai.start} /></PhaseLayer>
          <PhaseLayer opacity={band(bf, ...PH.perf.vis)}><PhasePerf start={PH.perf.start} /></PhaseLayer>
          <PhaseLayer opacity={band(bf, ...PH.deploy.vis)}><PhaseDeploy start={PH.deploy.start} /></PhaseLayer>
        </BrowserChrome>
      </div>

      <Caption start={PH.wire.cap[0]} end={PH.wire.cap[1]}>First, the structure.</Caption>
      <Caption start={PH.code.cap[0]} end={PH.code.cap[1]}>Then we build it — properly.</Caption>
      <Caption start={PH.ai.cap[0]} end={PH.ai.cap[1]}>AI grounded in your data — not guessing.</Caption>
      <Caption start={PH.perf.cap[0]} end={PH.perf.cap[1]}>Fast, accessible, measured. Every time.</Caption>
      <Caption start={PH.deploy.cap[0]} end={PH.deploy.cap[1]}>Shipped — and we don&rsquo;t walk away.</Caption>
    </AbsoluteFill>
  );
};

// ── S6 — the close ───────────────────────────────────────────────────────
const CloseScene: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ justifyContent: "center", alignItems: "center", textAlign: "center", fontFamily: INTER, opacity: sceneFade(frame, S6_CLOSE.dur, 16) }}>
      <div style={{ fontSize: 58, fontWeight: 600, lineHeight: 1.2, letterSpacing: "-0.02em", maxWidth: 1400 }}>
        <FadeUp>
          <div style={{ color: COLORS.white }}>We don&rsquo;t certify your organisation.</div>
        </FadeUp>
        <FadeUp delay={18} style={{ marginTop: 10 }}>
          <div style={{ color: COLORS.periwinkle }}>We take responsibility for what we build.</div>
        </FadeUp>
      </div>
      <FadeUp delay={46}>
        <DS2Wordmark color={COLORS.white} style={{ width: 240, height: "auto", marginTop: 60 }} />
      </FadeUp>
      <FadeUp delay={58}>
        <div style={{ fontFamily: ORBITRON, fontSize: 18, letterSpacing: "0.4em", textTransform: "uppercase", color: COLORS.muted, marginTop: 26 }}>
          Athens — London · dathstel.com
        </div>
      </FadeUp>
    </AbsoluteFill>
  );
};

export const BriefToShipped: React.FC = () => (
  <AbsoluteFill>
    <Atmosphere />
    {/* SFX: only user-approved ElevenLabs sounds wired so far (type/click/confirm);
        other beats stay silent until those files arrive. See SfxTrack.tsx. */}
    <SfxTrack />
    <Sequence from={S0_BRIEF.from} durationInFrames={S0_BRIEF.dur}>
      <BriefScene />
    </Sequence>
    <Sequence from={BUILD.from} durationInFrames={BUILD.dur}>
      <BuildStage />
    </Sequence>
    <Sequence from={S6_CLOSE.from} durationInFrames={S6_CLOSE.dur}>
      <CloseScene />
    </Sequence>
  </AbsoluteFill>
);
