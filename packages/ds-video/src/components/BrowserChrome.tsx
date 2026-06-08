import React from "react";
import { COLORS, MONO } from "../theme";

/**
 * macOS-style browser/app window — the recurring motif that persists across
 * the build scenes (echoes the site's `.cpanel` window). The chrome stays
 * constant while its contents morph (wireframe → code → AI → perf → live),
 * which is what sells the "one continuous build" feel.
 */

const Dot: React.FC<{ color: string }> = ({ color }) => (
  <div style={{ width: 13, height: 13, borderRadius: "50%", background: color }} />
);

const Lock: React.FC<{ color: string }> = ({ color }) => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" aria-hidden>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.4" fill={color} />
    <path d="M7.5 10.5V7.5a4.5 4.5 0 0 1 9 0v3" stroke={color} strokeWidth="2.1" fill="none" />
  </svg>
);

const LivePill: React.FC = () => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 13px",
      borderRadius: 999,
      background: "rgba(74,222,128,0.12)",
      border: `1px solid rgba(74,222,128,0.35)`,
      fontFamily: MONO,
      fontSize: 14,
      fontWeight: 500,
      letterSpacing: "0.06em",
      color: COLORS.green,
    }}
  >
    <div style={{ width: 8, height: 8, borderRadius: "50%", background: COLORS.green, boxShadow: `0 0 10px ${COLORS.green}` }} />
    LIVE
  </div>
);

export const BrowserChrome: React.FC<{
  url: string;
  live?: boolean;
  width?: number;
  height?: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ url, live = false, width = 1340, height = 720, children, style }) => (
  <div
    style={{
      width,
      height,
      borderRadius: 22,
      overflow: "hidden",
      background: "rgba(16,16,21,0.94)",
      border: `1px solid ${COLORS.line}`,
      boxShadow:
        "0 60px 130px -40px rgba(0,0,0,0.85), 0 0 0 1px rgba(153,144,241,0.07), 0 40px 120px -50px rgba(153,144,241,0.40)",
      display: "flex",
      flexDirection: "column",
      ...style,
    }}
  >
    {/* title bar */}
    <div
      style={{
        height: 56,
        display: "flex",
        alignItems: "center",
        gap: 18,
        padding: "0 22px",
        borderBottom: `1px solid ${COLORS.line}`,
        background: "rgba(255,255,255,0.02)",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", gap: 10 }}>
        <Dot color="#ff5f57" />
        <Dot color="#febc2e" />
        <Dot color="#28c840" />
      </div>

      <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            minWidth: 380,
            maxWidth: 600,
            padding: "9px 18px",
            borderRadius: 10,
            background: "rgba(0,0,0,0.38)",
            border: `1px solid ${COLORS.line}`,
            fontFamily: MONO,
            fontSize: 17,
          }}
        >
          <Lock color={live ? COLORS.green : COLORS.faint} />
          <span style={{ color: live ? COLORS.faint : COLORS.faint }}>{live ? "https://" : ""}</span>
          <span style={{ color: live ? COLORS.white : COLORS.muted }}>{url}</span>
        </div>
      </div>

      <div style={{ width: 96, display: "flex", justifyContent: "flex-end" }}>{live && <LivePill />}</div>
    </div>

    {/* content area — phases stack here, each absolutely filling */}
    <div style={{ position: "relative", flex: 1, overflow: "hidden" }}>{children}</div>
  </div>
);
