"use client";

import { useEffect, useMemo, useRef, type CSSProperties } from "react";
import type { AssistantSliderExact, AssistantSliderTier } from "./assistant-data";

const CROWD_SIZE = 50;

type Point = { x: number; y: number };

/** Deterministic pseudo-random in [0,1). Same hash the approved prototype used,
 *  so the crowd lays out identically here and in the reference file. */
function hash(seed: number) {
  const value = Math.sin(seed * 91.73 + 17.41) * 43758.5453;
  return value - Math.floor(value);
}

/** Fifty standing positions, ordered so the crowd grows outward from the centre.
 *
 *  Positions come from a 6x9 lattice with the middle-front cells and three
 *  corners removed, sorted by distance from the centre, then split into four
 *  concentric bands. Within a band the order is shuffled by `hash`, which makes
 *  filling look organic rather than ring-by-ring. Crucially the shuffle is
 *  deterministic and the array is built once, so raising the count only ever
 *  lights additional people: nobody moves and nobody is reshuffled. */
function buildCrowdPositions(): readonly Point[] {
  const available: (Point & { distance: number })[] = [];
  for (let row = 0; row < 6; row += 1) {
    for (let column = 0; column < 9; column += 1) {
      if (column === 4 && (row === 2 || row === 3)) continue; // keep the centre clear
      if ((row === 0 && column === 0) || (row === 0 && column === 8) || (row === 5 && column === 4)) continue;
      const x = 8 + column * 10.5;
      const y = 8 + row * 16.8;
      available.push({ x, y, distance: Math.hypot((x - 50) / 42, (y - 50) / 42) });
    }
  }
  available.sort((a, b) => a.distance - b.distance);

  const bandSizes = [4, 10, 15, 20];
  const ordered: Point[] = [{ x: 50, y: 50 }]; // the solo person, dead centre
  let cursor = 0;
  bandSizes.forEach((size, band) => {
    const band_ = available.slice(cursor, cursor + size);
    band_.sort((a, b) => hash(a.x * 3 + a.y * 5 + band * 101) - hash(b.x * 3 + b.y * 5 + band * 101));
    band_.forEach((point) => ordered.push({ x: point.x, y: point.y }));
    cursor += size;
  });
  return ordered;
}

/** The configured tiers cover the whole range, but an index lookup is still
 *  `| undefined` under strict TS, so callers fall back rather than assert. */
function tierFor(tiers: readonly AssistantSliderTier[], count: number): AssistantSliderTier | undefined {
  return tiers.find((tier) => count >= tier.min && count <= tier.max) ?? tiers[0];
}

/** Exact team-size picker: 1 to 50 people plus a 50+ sentinel, shown as a crowd.
 *  Only the team step opts into this (via `slider.exact`); timing and budget
 *  keep the generic band slider. */
export default function TeamSizeQuestion({
  exact,
  value,
  onChange,
  hint,
}: {
  exact: AssistantSliderExact;
  value: number;
  onChange: (next: number) => void;
  hint: string;
}) {
  const positions = useMemo(buildCrowdPositions, []);
  // One listener over the whole component (crowd + readout + control + pills)
  // rather than one scoped to the control strip alone: a second listener on
  // the crowd would double-step wheel gestures near the display/control seam,
  // since both would see the same physical scroll event.
  const surfaceRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<HTMLInputElement>(null);

  const count = Math.max(exact.min, Math.min(exact.max, Math.round(value)));
  const isOverflow = count >= exact.max;
  const tierLabel = tierFor(exact.tiers, count)?.label ?? "";
  const litCount = Math.min(count, CROWD_SIZE);
  const noun = count === 1 ? exact.personSingular : exact.personPlural;
  const shownValue = isOverflow ? exact.overflowLabel : String(count);
  const spoken = isOverflow ? exact.overflowValueText : `${count} ${noun}`;
  const valueText = tierLabel ? `${tierLabel}, ${spoken}` : spoken;
  const progress = ((count - exact.min) / (exact.max - exact.min)) * 100;

  // Wheel stepping over the whole surface — crowd visual, readout, control
  // strip and pills all count as one input. React's onWheel is passive, so
  // preventDefault there is ignored and the page scrolls instead; a native
  // listener is required. Accumulating to a threshold makes one notch move
  // exactly one person rather than flinging across the range on a trackpad.
  useEffect(() => {
    const surface = surfaceRef.current;
    if (!surface) return;
    let accumulated = 0;
    let lastStep = 0;
    const onWheel = (event: WheelEvent) => {
      const delta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (!delta) return;
      event.preventDefault();
      accumulated += delta;
      const threshold = event.deltaMode === 1 ? 1 : 12;
      const now = performance.now();
      if (Math.abs(accumulated) >= threshold && now - lastStep > 24) {
        const next = Number(rangeRef.current?.value ?? count) + Math.sign(accumulated);
        onChange(Math.max(exact.min, Math.min(exact.max, next)));
        accumulated = 0;
        lastStep = now;
      }
    };
    surface.addEventListener("wheel", onWheel, { passive: false });
    return () => surface.removeEventListener("wheel", onWheel);
  }, [count, exact.min, exact.max, onChange]);

  // Drag/swipe directly on the crowd. Scoped to the stage only (not the whole
  // surface) so it never fights clicks on the pills or the native range
  // thumb's own drag handling. Distance-based, same one-step-per-threshold
  // shape as the wheel handler, so a slow dedicated drag and a fast fling
  // both resolve to deliberate, non-doubled steps.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let dragging = false;
    let accumulated = 0;
    let lastStep = 0;
    const STEP_PX = 14;
    const onPointerDown = (event: PointerEvent) => {
      dragging = true;
      accumulated = 0;
      stage.setPointerCapture(event.pointerId);
    };
    const onPointerMove = (event: PointerEvent) => {
      if (!dragging) return;
      accumulated += event.movementX;
      const now = performance.now();
      if (Math.abs(accumulated) >= STEP_PX && now - lastStep > 24) {
        const steps = Math.trunc(accumulated / STEP_PX);
        const next = Number(rangeRef.current?.value ?? count) + steps;
        onChange(Math.max(exact.min, Math.min(exact.max, next)));
        accumulated -= steps * STEP_PX;
        lastStep = now;
      }
    };
    const onPointerUp = (event: PointerEvent) => {
      dragging = false;
      accumulated = 0;
      if (stage.hasPointerCapture(event.pointerId)) stage.releasePointerCapture(event.pointerId);
    };
    stage.addEventListener("pointerdown", onPointerDown);
    stage.addEventListener("pointermove", onPointerMove);
    stage.addEventListener("pointerup", onPointerUp);
    stage.addEventListener("pointercancel", onPointerUp);
    return () => {
      stage.removeEventListener("pointerdown", onPointerDown);
      stage.removeEventListener("pointermove", onPointerMove);
      stage.removeEventListener("pointerup", onPointerUp);
      stage.removeEventListener("pointercancel", onPointerUp);
    };
  }, [count, exact.min, exact.max, onChange]);

  return (
    <div className="assistant-team" style={{ "--team-progress": `${progress}%` } as CSSProperties} ref={surfaceRef}>
      <div className="assistant-team__display">
        <div className="assistant-team__scene">
          <span className="assistant-team__scene-label">{exact.sceneLabel}</span>
          <div className="assistant-team__stage" ref={stageRef}>
            <div className="assistant-team__crowd" aria-hidden="true">
              {positions.map((point, index) => (
                <i
                  key={index}
                  className={`assistant-team__person${index < litCount ? " is-on" : ""}`}
                  style={{ "--px": point.x, "--py": point.y } as CSSProperties}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="assistant-team__readout">
          <p className="assistant-team__tier">{tierLabel}</p>
          <div className="assistant-team__count">
            <strong>{shownValue}</strong>
            <span>{noun}</span>
          </div>
        </div>
      </div>

      <div className="assistant-team__control">
        <div className="assistant-team__hints">
          <span>{hint}</span>
          <span>{exact.scrollHint}</span>
        </div>
        <input
          ref={rangeRef}
          type="range"
          min={exact.min}
          max={exact.max}
          step={1}
          value={count}
          aria-label={exact.sceneLabel}
          aria-valuetext={valueText}
          onChange={(event) => onChange(Number(event.target.value))}
        />
        <div className="assistant-team__tiers" role="group" aria-label={exact.shortcutsLabel}>
          {exact.tiers.map((entry) => (
            <button
              key={entry.label}
              type="button"
              aria-pressed={count >= entry.min && count <= entry.max}
              onClick={() => {
                onChange(entry.min);
                rangeRef.current?.focus({ preventScroll: true });
              }}
            >
              {entry.label}
              <small>{entry.range}</small>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
