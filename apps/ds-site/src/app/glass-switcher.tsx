"use client";
/**
 * Preview-only switcher for the 3 hero GLASS looks. Reloads with ?glass=… so the
 * WebGL hero re-reads its material preset (it samples data-glass on mount).
 */
import { useEffect, useState } from "react";

const GLASSES = [
  { id: "smoked", label: "Smoked" },
  { id: "frosted", label: "Frosted" },
  { id: "obsidian", label: "Obsidian" },
] as const;

type GlassId = (typeof GLASSES)[number]["id"];

export default function GlassSwitcher() {
  const [active, setActive] = useState<GlassId>("smoked");

  useEffect(() => {
    const cur = document.body.getAttribute("data-glass") as GlassId | null;
    if (cur && GLASSES.some((g) => g.id === cur)) setActive(cur);
  }, []);

  const pick = (id: GlassId) => {
    try {
      localStorage.setItem("ds2-glass", id);
    } catch {
      /* ignore */
    }
    const url = new URL(window.location.href);
    url.searchParams.set("glass", id);
    window.location.href = url.toString();
  };

  return (
    <div className="style-switcher" style={{ bottom: "62px" }} role="group" aria-label="Glass look">
      <span className="style-switcher__label">Glass</span>
      {GLASSES.map((g) => (
        <button
          key={g.id}
          type="button"
          className={`style-switcher__btn${active === g.id ? " on" : ""}`}
          onClick={() => pick(g.id)}
        >
          {g.label}
        </button>
      ))}
    </div>
  );
}
