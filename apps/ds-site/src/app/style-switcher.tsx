"use client";
/**
 * Preview-only palette switcher. Flips --accent + smoke vars at runtime so one
 * deployment can show every candidate palette. (Remove before the final merge.)
 */
import { useEffect, useState } from "react";

const STYLES = [
  { id: "periwinkle", label: "Periwinkle", accent: "#6D5DD3", a: "#9990F1", b: "#F6BEDA" },
  { id: "emerald", label: "Emerald", accent: "#1F9D6B", a: "#5FCBA8", b: "#BFE6D2" },
  { id: "ocean", label: "Ocean", accent: "#3F77C9", a: "#8FB6F0", b: "#BFE0F6" },
] as const;

type Style = (typeof STYLES)[number];

function apply(s: Style) {
  const r = document.documentElement.style;
  r.setProperty("--accent", s.accent);
  r.setProperty("--smoke-a", s.a);
  r.setProperty("--smoke-b", s.b);
  window.dispatchEvent(new CustomEvent("ds2:smoke", { detail: { a: s.a, b: s.b } }));
}

export default function StyleSwitcher() {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const saved = localStorage.getItem("ds2-style");
    if (saved) {
      const s = STYLES.find((x) => x.id === saved);
      if (s) {
        apply(s);
        setActive(s.id);
      }
    }
  }, []);

  return (
    <div className="style-switcher" role="group" aria-label="Preview palette">
      <span className="style-switcher__label">Style</span>
      {STYLES.map((s) => (
        <button
          key={s.id}
          type="button"
          className={`style-switcher__btn${active === s.id ? " on" : ""}`}
          style={{ ["--sw" as string]: s.accent }}
          onClick={() => {
            apply(s);
            setActive(s.id);
            localStorage.setItem("ds2-style", s.id);
          }}
        >
          <span className="style-switcher__dot" />
          {s.label}
        </button>
      ))}
    </div>
  );
}
