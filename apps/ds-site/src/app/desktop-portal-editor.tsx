"use client";

import { type PointerEvent, useRef, useState } from "react";
import s from "./desktop-portal.module.css";
import {
  DEFAULT_KEYFRAMES,
  KEYFRAME_LABELS,
  KEYFRAME_PROGRESS,
  type LaptopPose,
} from "./laptop-keyframes";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

// ---------------------------------------------------------------------------
// Dev-only keyframe editor for the laptop's scroll arc. The arc is four
// hand-tuned poses joined by linear interpolation (see laptop-keyframes.ts);
// this panel is where those four get set. Pick a keyframe and the section
// freezes at that keyframe's own scroll position, so what is on screen is
// exactly the frame being edited -- where the laptop sits, how big it is, which
// way it faces, how far its lid stands open, and how far the camera has dollied
// in. Values are copied out of the panel and baked in as new defaults later;
// nothing here ships (gated on NODE_ENV).
//
// The quote block is deliberately NOT keyframed: it was finalized at progress 0
// and has faded out well before the second keyframe, so it keeps its single
// rect.
//
// Same interaction language as the founder-tile editor in expertise.tsx:
// percent rects dragged with pointer capture, a floating panel moved by a
// translate offset from its own CSS position, lock per layer, copy values out
// as plain text.
// ---------------------------------------------------------------------------
export const TUNABLE = process.env.NODE_ENV !== "production";

type HeroLayerId = "laptop" | "quote";
type LayerRect = { top: number; left: number; width: number; height: number };
type DragMode = "move" | "resize";

const HERO_LAYER_LABELS: Record<HeroLayerId, string> = {
  laptop: "3D laptop",
  quote: "Quote / DS2 mark",
};

// Finalized quote rect, picked through this editor and baked into .quoteLayer's
// CSS. Opening the editor or hitting Reset starts from this so it matches
// what's actually on screen, not some earlier draft. The laptop's equivalent is
// DEFAULT_KEYFRAMES in laptop-keyframes.ts, shared with the scene itself so the
// two can't drift apart.
const DEFAULT_QUOTE_RECT: LayerRect = { top: -10, left: 0, width: 100, height: 100 };

// Grid spacing as a percentage of the section box. The laptop's offsets are
// fractions of the same box, so one number quantises both layers.
const GRID_PCT = 5;
// The closed laptop's on-screen footprint at scale 1, measured off the rendered
// frame at 1440x900. The drag box is a proxy for a WebGL canvas that has no DOM
// box of its own, and it tracks the render faithfully: apparent size scales
// with `scale` and a percent shift of the box is the same percent shift of the
// camera pan, so dragging it feels like dragging the laptop.
const LAPTOP_PROXY_WIDTH = 55;
const LAPTOP_PROXY_HEIGHT = 25;

const snapTo = (value: number, step: number) => Math.round(value / step) * step;

export function laptopProxyRect(pose: LaptopPose): LayerRect {
  const width = LAPTOP_PROXY_WIDTH * pose.scale;
  const height = LAPTOP_PROXY_HEIGHT * pose.scale;
  return {
    top: 50 - pose.offsetY * 100 - height / 2,
    left: 50 + pose.offsetX * 100 - width / 2,
    width,
    height,
  };
}

export function useHeroLayerEditor() {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<HeroLayerId | null>("laptop");
  const [locked, setLocked] = useState<Record<HeroLayerId, boolean>>({ laptop: false, quote: false });
  const [snapping, setSnapping] = useState<Record<HeroLayerId, boolean>>({ laptop: true, quote: true });
  const [gridVisible, setGridVisible] = useState(true);
  const [quote, setQuote] = useState<LayerRect>(DEFAULT_QUOTE_RECT);
  // The whole four-pose track, plus which one the controls are pointed at.
  // Copied out of the shipped defaults so editing never mutates them.
  const [keyframes, setKeyframes] = useState<LaptopPose[]>(() => DEFAULT_KEYFRAMES.map((pose) => ({ ...pose })));
  const [activeKeyframe, setActiveKeyframe] = useState(0);
  const laptop = keyframes[activeKeyframe] ?? keyframes[0]!;

  // Edits always land on the keyframe currently selected, so every control in
  // the panel goes through this rather than touching the array directly.
  const setLaptop = (update: (pose: LaptopPose) => LaptopPose) => {
    setKeyframes((current) => current.map((pose, index) => (index === activeKeyframe ? update(pose) : pose)));
  };

  // Snapping is magnetic, so the pointer keeps moving smoothly while the
  // committed value jumps between grid lines. That needs an unsnapped
  // accumulator for the life of the drag; committing the snapped value back
  // into it would let every sub-step get swallowed.
  const drag = useRef<{ id: HeroLayerId; mode: DragMode; x: number; y: number } | null>(null);

  const toggleLock = (id: HeroLayerId) => {
    setLocked((current) => ({ ...current, [id]: !current[id] }));
    setSelected((current) => (current === id ? null : current));
  };
  const toggleSnap = (id: HeroLayerId) => {
    setSnapping((current) => ({ ...current, [id]: !current[id] }));
  };

  const beginDrag = (id: HeroLayerId, mode: DragMode) => {
    // Everything is accumulated in percent-of-section units so one grid step
    // quantises both layers identically, whatever it means underneath.
    if (id === "quote") {
      drag.current = mode === "move"
        ? { id, mode, x: quote.left, y: quote.top }
        : { id, mode, x: quote.width, y: quote.height };
    } else {
      drag.current = mode === "move"
        ? { id, mode, x: laptop.offsetX * 100, y: -laptop.offsetY * 100 }
        : { id, mode, x: laptop.scale * LAPTOP_PROXY_WIDTH, y: laptop.scale * LAPTOP_PROXY_HEIGHT };
    }
  };

  const dragBy = (dxPct: number, dyPct: number) => {
    const active = drag.current;
    if (!active) return;
    active.x += dxPct;
    active.y += dyPct;
    const fit = (value: number) => (snapping[active.id] ? snapTo(value, GRID_PCT) : value);
    const x = fit(active.x);
    const y = fit(active.y);
    if (active.id === "quote") {
      if (active.mode === "move") {
        setQuote((rect) => ({ ...rect, left: clamp(x, -40, 140), top: clamp(y, -40, 140) }));
      } else {
        setQuote((rect) => ({ ...rect, width: clamp(x, 5, 220), height: clamp(y, 5, 220) }));
      }
    } else if (active.mode === "move") {
      setLaptop((current) => ({
        ...current,
        offsetX: clamp(x, -150, 150) / 100,
        offsetY: -clamp(y, -150, 150) / 100,
      }));
    } else {
      setLaptop((current) => ({ ...current, scale: clamp(x, 8, 220) / LAPTOP_PROXY_WIDTH }));
    }
  };

  const endDrag = () => { drag.current = null; };

  const setLaptopValue = (key: keyof LaptopPose, value: number) => {
    setLaptop((current) => ({ ...current, [key]: value }));
  };

  const centerHorizontally = () => {
    if (selected === "quote") setQuote((rect) => ({ ...rect, left: 50 - rect.width / 2 }));
    if (selected === "laptop") setLaptop((current) => ({ ...current, offsetX: 0 }));
  };

  const reset = () => {
    setQuote(DEFAULT_QUOTE_RECT);
    setKeyframes(DEFAULT_KEYFRAMES.map((pose) => ({ ...pose })));
    setActiveKeyframe(0);
    setLocked({ laptop: false, quote: false });
    setSnapping({ laptop: true, quote: true });
    setGridVisible(true);
    setSelected("laptop");
  };

  // One paste-able block covering the whole track, in the order the keyframes
  // run. The quote rect rides along unchanged -- it is a single finalized frame,
  // not part of the track.
  const copyText = () => [
    "DS2 hero laptop keyframes (linear between keyframes, held flat outside them)",
    `${HERO_LAYER_LABELS.quote}: top ${quote.top.toFixed(1)}%, left ${quote.left.toFixed(1)}%, width ${quote.width.toFixed(1)}%, height ${quote.height.toFixed(1)}%, snap ${snapping.quote ? "on" : "off"}${locked.quote ? ", locked" : ""}`,
    "",
    ...keyframes.flatMap((pose, index) => [
      `KF${index} @ progress ${KEYFRAME_PROGRESS[index]!.toFixed(4)} -- ${KEYFRAME_LABELS[index]!.title}`,
      `  { zoom: ${pose.zoom.toFixed(3)}, offsetX: ${pose.offsetX.toFixed(3)}, offsetY: ${pose.offsetY.toFixed(3)}, scale: ${pose.scale.toFixed(3)}, rotationX: ${pose.rotationX.toFixed(1)}, rotationY: ${pose.rotationY.toFixed(1)}, lidDeg: ${pose.lidDeg.toFixed(1)} },`,
    ]),
    "",
    `Grid: ${GRID_PCT}% of the section, overlay ${gridVisible ? "on" : "off"}, laptop snap ${snapping.laptop ? "on" : "off"}${locked.laptop ? ", locked" : ""}`,
  ].join("\n");

  return {
    editing, setEditing,
    selected, setSelected,
    locked, toggleLock,
    snapping, toggleSnap,
    gridVisible, setGridVisible,
    quote, laptop, setLaptopValue,
    keyframes, activeKeyframe, setActiveKeyframe,
    beginDrag, dragBy, endDrag,
    centerHorizontally, reset, copyText,
  };
}

type HeroEditor = ReturnType<typeof useHeroLayerEditor>;

export function EditorBox({
  id,
  rect,
  zIndex,
  selected,
  locked,
  editor,
}: {
  id: HeroLayerId;
  rect: LayerRect;
  zIndex: number;
  selected: boolean;
  locked: boolean;
  editor: HeroEditor;
}) {
  const start = (mode: DragMode) => (event: PointerEvent<HTMLElement>) => {
    if (locked) return;
    event.preventDefault();
    event.stopPropagation();
    editor.setSelected(id);
    editor.beginDrag(id, mode);
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const move = (levels: number) => (event: PointerEvent<HTMLElement>) => {
    if (locked || !event.currentTarget.hasPointerCapture(event.pointerId)) return;
    let container: HTMLElement | null = event.currentTarget;
    for (let level = 0; level < levels; level += 1) container = container?.parentElement ?? null;
    if (!container) return;
    const box = container.getBoundingClientRect();
    editor.dragBy((event.movementX / box.width) * 100, (event.movementY / box.height) * 100);
  };
  const stop = (event: PointerEvent<HTMLElement>) => {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    editor.endDrag();
  };

  return (
    <div
      className={`${s.editorBox}${selected && !locked ? ` ${s.editorBoxSelected}` : ""}${locked ? ` ${s.editorBoxLocked}` : ""}`}
      style={{ top: `${rect.top}%`, left: `${rect.left}%`, width: `${rect.width}%`, height: `${rect.height}%`, zIndex }}
      onPointerDown={start("move")}
      onPointerMove={move(1)}
      onPointerUp={stop}
      onPointerCancel={stop}
    >
      <span className={s.editorBoxLabel}>{HERO_LAYER_LABELS[id]}</span>
      {selected && !locked && (
        <span
          className={s.editorResizeHandle}
          onPointerDown={start("resize")}
          onPointerMove={move(2)}
          onPointerUp={stop}
          onPointerCancel={stop}
        />
      )}
    </div>
  );
}

function EditorSlider({
  label,
  value,
  min,
  max,
  step,
  suffix,
  decimals = 0,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  suffix: string;
  // Zoom runs 0-1, so a whole-number readout would show every setting as 0 or 1.
  decimals?: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className={s.editorControl}>
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <b>{value.toFixed(decimals)}{suffix}</b>
    </label>
  );
}

export function HeroLayersPanel({ editor }: { editor: HeroEditor }) {
  // Plain translate offset from the panel's own default CSS position, not
  // top/left in viewport px. position:fixed uses the nearest *transformed*
  // ancestor as its containing block when one exists, so viewport coordinates
  // and the panel's real position are two different reference frames. A
  // translate offset is always relative to wherever the element already sits.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [copied, setCopied] = useState(false);
  const { selected, laptop, quote } = editor;

  const handleTitlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handleTitlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    setOffset((current) => ({ x: current.x + event.movementX, y: current.y + event.movementY }));
  };

  const copyValues = () => {
    void navigator.clipboard.writeText(editor.copyText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={s.editorPanel} style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
      <div className={s.editorPanelTitle} onPointerDown={handleTitlePointerDown} onPointerMove={handleTitlePointerMove}>
        &#9776; Laptop keyframes
      </div>
      <div className={s.editorPanelHint}>
        Drag the title bar to move this panel. Pick a keyframe below and the section freezes at that point in the
        scroll, so you are editing exactly the frame you can see. The arc runs linearly between the four.
        Lock stops a layer being touched; snap is separate and magnetises it to the {GRID_PCT}% grid.
      </div>
      <ul className={s.editorLayers}>
        {(Object.keys(HERO_LAYER_LABELS) as HeroLayerId[]).map((id) => (
          <li
            key={id}
            onClick={() => editor.setSelected(id)}
            className={`${s.editorLayerRow}${selected === id ? ` ${s.editorLayerRowSelected}` : ""}${editor.locked[id] ? ` ${s.editorLayerRowLocked}` : ""}`}
          >
            <span>{HERO_LAYER_LABELS[id]}</span>
            <button
              type="button"
              className={s.editorRowIcon}
              onClick={(event) => { event.stopPropagation(); editor.toggleSnap(id); }}
              aria-label={editor.snapping[id] ? `Disable snapping for ${HERO_LAYER_LABELS[id]}` : `Enable snapping for ${HERO_LAYER_LABELS[id]}`}
              title={editor.snapping[id] ? "Snap on" : "Snap off"}
            >
              {editor.snapping[id] ? "\u{1F9F2}" : "\u{2715}"}
            </button>
            <button
              type="button"
              className={s.editorRowIcon}
              onClick={(event) => { event.stopPropagation(); editor.toggleLock(id); }}
              aria-label={editor.locked[id] ? `Unlock ${HERO_LAYER_LABELS[id]}` : `Lock ${HERO_LAYER_LABELS[id]}`}
            >
              {editor.locked[id] ? "\u{1F512}" : "\u{1F513}"}
            </button>
          </li>
        ))}
      </ul>

      {selected === "laptop" && (
        <div className={s.editorControls}>
          <div className={s.editorKeyframes} role="group" aria-label="Laptop keyframe">
            {KEYFRAME_LABELS.map((label, index) => (
              <button
                type="button"
                key={label.short}
                className={index === editor.activeKeyframe ? s.editorKeyframeActive : undefined}
                onClick={() => editor.setActiveKeyframe(index)}
                aria-pressed={index === editor.activeKeyframe}
                title={label.title}
              >
                <b>{label.short}</b>
                <i>{(KEYFRAME_PROGRESS[index]! * 100).toFixed(1)}%</i>
              </button>
            ))}
          </div>
          <div className={s.editorKeyframeCaption}>
            KF{editor.activeKeyframe} · {KEYFRAME_LABELS[editor.activeKeyframe]!.title} · progress{" "}
            {KEYFRAME_PROGRESS[editor.activeKeyframe]!.toFixed(4)}
          </div>
          <EditorSlider label="Zoom" value={laptop.zoom} min={0} max={1} step={0.01} suffix="" decimals={2} onChange={(value) => editor.setLaptopValue("zoom", value)} />
          <EditorSlider label="Turn Y" value={laptop.rotationY} min={-90} max={90} step={1} suffix="deg" onChange={(value) => editor.setLaptopValue("rotationY", value)} />
          <EditorSlider label="Tilt X" value={laptop.rotationX} min={-60} max={60} step={1} suffix="deg" onChange={(value) => editor.setLaptopValue("rotationX", value)} />
          <EditorSlider label="Lid open" value={laptop.lidDeg} min={0} max={110} step={0.5} suffix="deg" decimals={1} onChange={(value) => editor.setLaptopValue("lidDeg", value)} />
          <div className={s.editorReadout}>
            offsetX {laptop.offsetX.toFixed(3)} · offsetY {laptop.offsetY.toFixed(3)} · scale {laptop.scale.toFixed(3)}
          </div>
        </div>
      )}
      {selected === "quote" && (
        <div className={s.editorControls}>
          <div className={s.editorReadout}>
            top {quote.top.toFixed(1)}% · left {quote.left.toFixed(1)}% · width {quote.width.toFixed(1)}% · height {quote.height.toFixed(1)}%
          </div>
        </div>
      )}

      <div className={s.editorActions}>
        <button type="button" onClick={editor.centerHorizontally} disabled={!selected}>Center H</button>
        <button type="button" onClick={() => editor.setGridVisible((value) => !value)}>{editor.gridVisible ? "Grid off" : "Grid on"}</button>
      </div>
      <div className={s.editorActions}>
        <button type="button" onClick={editor.reset}>Reset</button>
        <button type="button" onClick={copyValues}>{copied ? "Copied!" : "Copy all positions"}</button>
        <button type="button" onClick={() => editor.setEditing(false)}>Done</button>
      </div>
    </div>
  );
}
