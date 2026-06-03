"use client";
/**
 * Preview-only PALETTE switcher.
 * Swaps --accent / --accent-soft on :root + --smoke-a/--smoke-b for the OGL
 * shader, and fires "ds2:smoke" so the running shader picks up the new colours
 * without a reload. Choice persists in localStorage. Gated to non-production
 * deploys in layout.tsx (same pattern as LogoStyleSwitcher).
 *
 * Adding a palette = add an entry to PALETTES. The CSS does the rest because
 * every brand surface uses color-mix() over --accent.
 */
import { useEffect, useState } from "react";

type Palette = {
  id: string;
  label: string;
  accent: string;
  accentSoft: string;
  smokeA: string;
  smokeB: string;
};

const PALETTES = [
  // Current — for direct comparison.
  { id: "periwinkle", label: "Periwinkle",  accent: "#6D5DD3", accentSoft: "#B9B0EE", smokeA: "#9990F1", smokeB: "#F6BEDA" },
  // Dimitris-research direction: warm amber accent.
  { id: "amber",       label: "Amber",       accent: "#E08B16", accentSoft: "#F4C77A", smokeA: "#F2B756", smokeB: "#FAE3B6" },
  // Warmer variant: coral.
  { id: "coral",       label: "Coral",       accent: "#E06E55", accentSoft: "#F2AC9B", smokeA: "#F08C75", smokeB: "#FAD3CB" },
  // Calm, organic: sage green.
  { id: "sage",        label: "Sage",        accent: "#5FA088", accentSoft: "#A3CDBA", smokeA: "#86BFA6", smokeB: "#CFE5D5" },
] as const satisfies readonly Palette[];

const DEFAULT_PALETTE = PALETTES[0];

function apply(p: Palette) {
  const root = document.documentElement;
  root.style.setProperty("--accent", p.accent);
  root.style.setProperty("--accent-soft", p.accentSoft);
  root.style.setProperty("--smoke-a", p.smokeA);
  root.style.setProperty("--smoke-b", p.smokeB);
  document.body.setAttribute("data-palette", p.id);
  window.dispatchEvent(new CustomEvent("ds2:smoke", { detail: { a: p.smokeA, b: p.smokeB } }));
}

export default function PaletteSwitcher() {
  const [active, setActive] = useState<string>("periwinkle");
  useEffect(() => {
    const saved = localStorage.getItem("ds2-palette") || "periwinkle";
    const p = PALETTES.find((x) => x.id === saved) ?? DEFAULT_PALETTE;
    apply(p);
    setActive(p.id);
  }, []);
  return (
    <div className="palette-switcher" role="group" aria-label="Palette">
      <span className="palette-switcher__label">Palette</span>
      {PALETTES.map((p) => (
        <button
          key={p.id}
          type="button"
          className={`palette-switcher__btn${active === p.id ? " on" : ""}`}
          onClick={() => {
            apply(p);
            setActive(p.id);
            localStorage.setItem("ds2-palette", p.id);
          }}
          aria-label={`Switch palette to ${p.label}`}
        >
          <span className="palette-switcher__dot" style={{ background: p.accent }} aria-hidden="true" />
          {p.label}
        </button>
      ))}
    </div>
  );
}
