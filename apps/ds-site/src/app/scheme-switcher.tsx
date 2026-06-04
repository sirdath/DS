"use client";
/**
 * Preview-only colour-scheme switcher for the bake-off. Reloads with ?scheme=…
 * so the WebGL hero re-reads its --hero-* tokens fresh (it samples them on mount).
 */
import { useEffect, useState } from "react";

const SCHEMES = [
  { id: "obsidian", label: "Obsidian" },
  { id: "azure", label: "Azure" },
  { id: "emerald", label: "Emerald" },
] as const;

type SchemeId = (typeof SCHEMES)[number]["id"];

export default function SchemeSwitcher() {
  const [active, setActive] = useState<SchemeId>("azure");

  useEffect(() => {
    const cur = document.body.getAttribute("data-scheme") as SchemeId | null;
    if (cur && SCHEMES.some((s) => s.id === cur)) setActive(cur);
  }, []);

  const pick = (id: SchemeId) => {
    try {
      localStorage.setItem("ds2-scheme", id);
    } catch {
      /* ignore */
    }
    const url = new URL(window.location.href);
    url.searchParams.set("scheme", id);
    window.location.href = url.toString();
  };

  return (
    <div className="style-switcher" style={{ bottom: "18px" }} role="group" aria-label="Colour scheme">
      <span className="style-switcher__label">Scheme</span>
      {SCHEMES.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`style-switcher__btn${active === s.id ? " on" : ""}`}
          onClick={() => pick(s.id)}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
