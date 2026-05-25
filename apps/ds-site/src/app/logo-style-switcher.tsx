"use client";
/**
 * Preview-only switcher for the three hero LOGO treatments (same purple website):
 * Filled (black), Gradient (purple), Outline (black). Sets body[data-logo] +
 * fires "ds2:logostyle" so the hero re-runs its draw with that mode.
 */
import { useEffect, useState } from "react";

const MODES = [
  { id: "filled", label: "Filled" },
  { id: "gradient", label: "Gradient" },
  { id: "outline", label: "Outline" },
];

function apply(mode: string) {
  document.body.setAttribute("data-logo", mode);
  window.dispatchEvent(new CustomEvent("ds2:logostyle", { detail: { mode } }));
}

export default function LogoStyleSwitcher() {
  const [active, setActive] = useState("filled");
  useEffect(() => {
    const saved = localStorage.getItem("ds2-logo") || "filled";
    apply(saved);
    setActive(saved);
  }, []);
  return (
    <div className="style-switcher" role="group" aria-label="Logo style">
      <span className="style-switcher__label">Logo</span>
      {MODES.map((m) => (
        <button
          key={m.id}
          type="button"
          className={`style-switcher__btn${active === m.id ? " on" : ""}`}
          onClick={() => {
            apply(m.id);
            setActive(m.id);
            localStorage.setItem("ds2-logo", m.id);
          }}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}
