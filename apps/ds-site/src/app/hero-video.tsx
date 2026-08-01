"use client";
import { useEffect, useRef } from "react";
import CoreHero from "./core-hero";

/** Homepage hero — "The Core": a native, interactive coverflow of the twelve
 *  things DS2 builds (drag / keyboard / buttons, hover-3D hexagons, per-card
 *  example window with cost ranges, floating reviews). Ported off the iframe so
 *  it idles at zero cost and carries a real mobile layout. */
export default function HeroVideo() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const hero = ref.current?.closest("section");
    hero?.classList.add("loaded");
  }, []);

  return (
    <div ref={ref} style={{ position: "relative", width: "100%" }}>
      <CoreHero />
    </div>
  );
}
