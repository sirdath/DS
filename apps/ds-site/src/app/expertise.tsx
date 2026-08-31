"use client";

import { type CSSProperties, type PointerEvent, useEffect, useRef, useState } from "react";
import { useLang } from "./i18n";
import s from "./expertise.module.css";

// Dev-only tool: drag the halo/orbit rings behind the founder LEGO figures
// to reposition them, then copy the resulting CSS. Never renders in
// production (gated on NODE_ENV), so it ships harmlessly either way.
const TUNABLE = process.env.NODE_ENV !== "production";

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

// ---------------------------------------------------------------------------
// Free-canvas layer editor. Dev-only (gated on NODE_ENV). Lets every visual
// piece of a founder tile (both rings, the character video, the floor
// shadow, the text block) be dragged, resized, reordered in stacking order,
// and locked independently, instead of guessing CSS values from screenshots
// back and forth. Stelios's composition is finalized (editable={false}
// below); Dimitris's ring/character group mirrors the same finalized values
// and starts locked, but stays editable.
// ---------------------------------------------------------------------------

type LayerId = "meta" | "group";

type LayerRect = { top: number; left: number; width: number; height: number };

const LAYER_LABELS: Record<LayerId, string> = {
  meta: "Text block",
  group: "Group (character + rings + floor)",
};

// Finalized per-element values, given directly after using the individual
// editor: character top1/left-3/w39/h97, floor top89/left5/w27/h3,
// halo top15/left7/w28/h52, orbit top10/left4/w34/h64 (card-relative %).
// group is their bounding box; the four pieces below are now expressed as
// a % of THAT box instead of the card, so moving/resizing group carries
// and scales all four together.
const DEFAULT_LAYER_RECTS: Record<LayerId, LayerRect> = {
  meta: { top: 16, left: 44, width: 53, height: 68 },
  group: { top: 0, left: -2, width: 41, height: 97 },
};

// index 0 = front-most (rendered on top). meta (z 5) sat above all four
// group members (z 4-1) in the finalized values, so meta stays in front.
const DEFAULT_LAYER_ORDER: LayerId[] = ["meta", "group"];

type GroupMemberId = "character" | "stageFloor" | "halo" | "orbit";

// Each piece's rect as a % of the group's own box (computed once from the
// bounding-box math above), plus its z-order *within* the group. These are
// fixed now — the group moves/resizes as one composition; only its own box
// and the text block are independently editable.
const GROUP_MEMBERS: Record<GroupMemberId, { rect: LayerRect; zIndex: number }> = {
  character: { rect: { top: 0, left: 0, width: 95.12, height: 100 }, zIndex: 4 },
  stageFloor: { rect: { top: 90.72, left: 19.51, width: 65.85, height: 3.09 }, zIndex: 3 },
  halo: { rect: { top: 14.43, left: 24.39, width: 68.29, height: 53.61 }, zIndex: 2 },
  orbit: { rect: { top: 9.28, left: 17.07, width: 82.93, height: 65.98 }, zIndex: 1 },
};

function rectStyle(r: LayerRect, zIndex: number): CSSProperties {
  return { position: "absolute", top: `${r.top}%`, left: `${r.left}%`, width: `${r.width}%`, height: `${r.height}%`, zIndex };
}

const DEFAULT_LOCKED: Record<LayerId, boolean> = {
  meta: false,
  group: false,
};

function useLayerEditor(
  initialLocked?: Partial<Record<LayerId, boolean>>,
  initialRects?: Partial<Record<LayerId, LayerRect>>,
) {
  const [editing, setEditing] = useState(false);
  const [rects, setRects] = useState<Record<LayerId, LayerRect>>({ ...DEFAULT_LAYER_RECTS, ...initialRects });
  const [order, setOrder] = useState<LayerId[]>(DEFAULT_LAYER_ORDER);
  const [selected, setSelected] = useState<LayerId | null>(null);
  const [locked, setLocked] = useState<Record<LayerId, boolean>>({ ...DEFAULT_LOCKED, ...initialLocked });

  const zIndexOf = (id: LayerId) => order.length - order.indexOf(id);
  const toggleLock = (id: LayerId) => {
    setLocked((l) => ({ ...l, [id]: !l[id] }));
    setSelected((sel) => (sel === id ? null : sel));
  };

  const moveLayer = (id: LayerId, dxPct: number, dyPct: number) => {
    setRects((r) => ({ ...r, [id]: { ...r[id], left: clamp(r[id].left + dxPct, -15, 110), top: clamp(r[id].top + dyPct, -15, 110) } }));
  };
  const resizeLayer = (id: LayerId, dwPct: number, dhPct: number) => {
    setRects((r) => ({ ...r, [id]: { ...r[id], width: clamp(r[id].width + dwPct, 4, 130), height: clamp(r[id].height + dhPct, 4, 130) } }));
  };
  const reorder = (fromIndex: number, toIndex: number) => {
    setOrder((o) => {
      if (toIndex < 0 || toIndex >= o.length) return o;
      const next = [...o];
      const [item] = next.splice(fromIndex, 1);
      if (!item) return o;
      next.splice(toIndex, 0, item);
      return next;
    });
  };
  const reset = () => {
    setRects({ ...DEFAULT_LAYER_RECTS, ...initialRects });
    setOrder(DEFAULT_LAYER_ORDER);
    setSelected(null);
    setLocked({ ...DEFAULT_LOCKED, ...initialLocked });
  };

  return { editing, setEditing, rects, order, selected, setSelected, locked, toggleLock, moveLayer, resizeLayer, reorder, zIndexOf, reset };
}

function LayerBox({
  id,
  rect,
  zIndex,
  editing,
  selected,
  locked,
  className,
  onSelect,
  onMove,
  onResize,
  children,
}: {
  id: LayerId;
  rect: LayerRect;
  zIndex: number;
  editing: boolean;
  selected: boolean;
  locked: boolean;
  className?: string;
  onSelect: (id: LayerId) => void;
  onMove: (id: LayerId, dx: number, dy: number) => void;
  onResize: (id: LayerId, dw: number, dh: number) => void;
  children?: React.ReactNode;
}) {
  const handlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (!editing || locked) return;
    e.preventDefault();
    onSelect(id);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!editing || locked || !e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const canvas = e.currentTarget.parentElement;
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    onMove(id, (e.movementX / box.width) * 100, (e.movementY / box.height) * 100);
  };
  const handleResizeDown = (e: PointerEvent<HTMLSpanElement>) => {
    e.preventDefault();
    e.stopPropagation();
    onSelect(id);
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handleResizeMove = (e: PointerEvent<HTMLSpanElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    const canvas = e.currentTarget.parentElement?.parentElement;
    if (!canvas) return;
    const box = canvas.getBoundingClientRect();
    onResize(id, (e.movementX / box.width) * 100, (e.movementY / box.height) * 100);
  };

  return (
    <div
      className={`${className}${editing && !locked ? ` ${s.layerEditing}` : ""}${selected && !locked ? ` ${s.layerSelected}` : ""}${editing && locked ? ` ${s.layerLocked}` : ""}`}
      style={{ position: "absolute", top: `${rect.top}%`, left: `${rect.left}%`, width: `${rect.width}%`, height: `${rect.height}%`, zIndex }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
    >
      {children}
      {editing && selected && !locked && (
        <span className={s.layerResizeHandle} onPointerDown={handleResizeDown} onPointerMove={handleResizeMove} />
      )}
    </div>
  );
}

function LayersPanel({
  order,
  rects,
  selected,
  locked,
  onSelect,
  onReorder,
  onToggleLock,
  onReset,
  onDone,
}: {
  order: LayerId[];
  rects: Record<LayerId, LayerRect>;
  selected: LayerId | null;
  locked: Record<LayerId, boolean>;
  onSelect: (id: LayerId) => void;
  onReorder: (from: number, to: number) => void;
  onToggleLock: (id: LayerId) => void;
  onReset: () => void;
  onDone: () => void;
}) {
  // Plain translate offset from the panel's own default CSS position — not
  // top/left in viewport px. That approach broke: position:fixed uses the
  // nearest *transformed* ancestor as its containing block when one exists,
  // not the viewport, so viewport-space coordinates and this panel's actual
  // rendered position were two different reference frames. A translate
  // offset has no such ambiguity — it's always relative to wherever the
  // element already sits, transformed ancestor or not.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragFrom = useRef<number | null>(null);
  const [copied, setCopied] = useState(false);

  const handleTitlePointerDown = (e: PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handleTitlePointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
    setOffset((o) => ({ x: o.x + e.movementX, y: o.y + e.movementY }));
  };

  const copyValues = () => {
    const lines = order.map((id, i) => {
      const r = rects[id];
      const z = order.length - i;
      return `${LAYER_LABELS[id]} (${id}): top ${r.top.toFixed(0)}%, left ${r.left.toFixed(0)}%, width ${r.width.toFixed(0)}%, height ${r.height.toFixed(0)}%, z-index ${z}${locked[id] ? ", locked" : ""}`;
    });
    void navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className={s.layersPanel} style={{ transform: `translate(${offset.x}px, ${offset.y}px)` }}>
      <div
        className={s.layersPanelTitle}
        onPointerDown={handleTitlePointerDown}
        onPointerMove={handleTitlePointerMove}
      >
        &#9776; Stelios tile layers
      </div>
      <div className={s.layersPanelHint}>Drag the title bar to move this panel. Drag a row to reorder (top = front). Click a row to select, then drag/resize on the tile. Lock a layer to stop it from being clicked or moved.</div>
      <ul className={s.layersList}>
        {order.map((id, i) => (
          <li
            key={id}
            draggable={!locked[id]}
            onDragStart={() => { dragFrom.current = i; }}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (dragFrom.current !== null) onReorder(dragFrom.current, i);
              dragFrom.current = null;
            }}
            onClick={() => onSelect(id)}
            className={`${s.layersRow}${selected === id ? ` ${s.layersRowSelected}` : ""}${locked[id] ? ` ${s.layersRowLocked}` : ""}`}
          >
            <span className={s.layersRowHandle}>&#9776;</span>
            <span>{LAYER_LABELS[id]}</span>
            <button
              type="button"
              className={s.layersRowLock}
              onClick={(e) => { e.stopPropagation(); onToggleLock(id); }}
              aria-label={locked[id] ? `Unlock ${LAYER_LABELS[id]}` : `Lock ${LAYER_LABELS[id]}`}
            >
              {locked[id] ? "\u{1F512}" : "\u{1F513}"}
            </button>
          </li>
        ))}
      </ul>
      <div className={s.tunePanelActions}>
        <button type="button" onClick={onReset}>Reset</button>
        <button type="button" onClick={copyValues}>{copied ? "Copied!" : "Copy values"}</button>
        <button type="button" onClick={onDone}>Done</button>
      </div>
    </div>
  );
}

function EditableFounderTile({
  founder,
  editable = true,
  initialLocked,
  initialRects,
}: {
  founder: Founder;
  editable?: boolean;
  initialLocked?: Partial<Record<LayerId, boolean>>;
  initialRects?: Partial<Record<LayerId, LayerRect>>;
}) {
  const { editing, setEditing, rects, order, selected, setSelected, locked, toggleLock, moveLayer, resizeLayer, reorder, zIndexOf, reset } = useLayerEditor(initialLocked, initialRects);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !founder.video) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return;
    video.src = founder.video;
    video.load();
    void video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
  }, [founder.video]);

  const layerProps = (id: LayerId) => ({
    id,
    rect: rects[id],
    zIndex: zIndexOf(id),
    editing,
    selected: selected === id,
    locked: locked[id],
    onSelect: setSelected,
    onMove: moveLayer,
    onResize: resizeLayer,
  });

  return (
    <article className={`${s.founder} ${s[founder.tone]} ${s.editCard}`} tabIndex={0}>
      <LayerBox {...layerProps("group")} className={s.editLayerPlain}>
        <div className={s.editLayerPlain} style={rectStyle(GROUP_MEMBERS.character.rect, GROUP_MEMBERS.character.zIndex)}>
          <video
            ref={videoRef}
            className={`${s.editCharacter} ${isPlaying ? s.characterActive : ""}`}
            poster={founder.poster}
            muted
            loop
            playsInline
            preload="none"
          />
        </div>
        <div
          className={`${s.editLayerPlain} ${s.editOrbit}`}
          style={rectStyle(GROUP_MEMBERS.orbit.rect, GROUP_MEMBERS.orbit.zIndex)}
        />
        <div
          className={`${s.editLayerPlain} ${s.editHalo}`}
          style={rectStyle(GROUP_MEMBERS.halo.rect, GROUP_MEMBERS.halo.zIndex)}
        />
        <div
          className={`${s.editLayerPlain} ${s.editStageFloor}`}
          style={rectStyle(GROUP_MEMBERS.stageFloor.rect, GROUP_MEMBERS.stageFloor.zIndex)}
        />
      </LayerBox>
      <LayerBox {...layerProps("meta")} className={`${s.editLayerPlain} ${s.editMeta}`}>
        <div className={s.fcity}>{founder.city}</div>
        <div className={s.fname}>{founder.name}</div>
        <h3 className={s.frole}>{founder.role}</h3>
        <div className={s.fbg}>{founder.bg}</div>
      </LayerBox>

      {TUNABLE && editable && (
        <>
          <button type="button" className={s.tuneToggle} onClick={() => setEditing((v) => !v)}>
            {editing ? `Close ${founder.name} editor` : `Edit ${founder.name} tile`}
          </button>
          {editing && (
            <LayersPanel
              order={order}
              rects={rects}
              selected={selected}
              locked={locked}
              onSelect={setSelected}
              onReorder={reorder}
              onToggleLock={toggleLock}
              onReset={reset}
              onDone={() => setEditing(false)}
            />
          )}
        </>
      )}
    </article>
  );
}

const COPY = {
  en: {
    eyebrow: "What we do well",
    f1role: "Head of Engineering & Data",
    f1bg: "Business · Data science · Machine learning",
    f1city: "London",
    f2role: "Head of Strategy & Consulting",
    f2bg: "Business management · Sales · Marketing",
    f2city: "Athens",
  },
  el: {
    eyebrow: "Σε τι είμαστε καλοί",
    f1role: "Επικεφαλής Μηχανικής & Data",
    f1bg: "Business · Data science · Machine learning",
    f1city: "Λονδίνο",
    f2role: "Επικεφαλής Στρατηγικής & Consulting",
    f2bg: "Διοίκηση · Πωλήσεις · Marketing",
    f2city: "Αθήνα",
  },
} as const;

type Founder = {
  name: string;
  role: string;
  bg: string;
  city: string;
  poster: string;
  video?: string;
  tone: "ice" | "rose";
};

export default function Expertise() {
  const { lang } = useLang();
  const c = COPY[lang];

  const founders = [
    {
      name: "Dimitris",
      role: c.f1role,
      bg: c.f1bg,
      city: c.f1city,
      poster: "/founders/lego-dimitris-poster.webp",
      video: "/founders/dimitris-lego-loop.webm",
      tone: "ice",
    },
    {
      name: "Stelios",
      role: c.f2role,
      bg: c.f2bg,
      city: c.f2city,
      poster: "/founders/lego-stelios-poster.webp",
      video: "/founders/stelios-lego-loop.webm",
      tone: "rose",
    },
  ] satisfies Founder[];

  return (
    <section className={s.expertise} id="expertise" aria-label={lang === "el" ? "Η εξειδίκευσή μας" : "Our expertise"}>
      <div className={s.head}>
        <div className={s.eyebrow}>{c.eyebrow}</div>
        <h2 className={s.title}>
          {lang === "el" ? (
            <>Μια ομάδα που <em>το έχει κάνει</em>.</>
          ) : (
            <>A team that has <em>been there</em>.</>
          )}
        </h2>
      </div>

      <div className={s.team}>
        <p className={s.blurb}>
          {lang === "el" ? (
            <>Μια μικρή, έμπειρη ομάδα από ειδικούς σε AI και data. Φτιάχνουμε λογισμικό πραγματικά <em>χρήσιμο</em>, που γίνεται αξία που μετριέται.</>
          ) : (
            <>A small, senior team of AI and data experts. We build software that is genuinely <em>useful</em>, and turns into value you can measure.</>
          )}
        </p>

        <div className={s.founders}>
          {founders.map((founder) => (
            <EditableFounderTile
              founder={founder}
              key={founder.name}
              editable={false}
              initialLocked={founder.name === "Dimitris" ? { group: true } : undefined}
              initialRects={
                // 5px right of the shared default (2px, then another 3px),
                // measured against Dimitris's own card width (534px at the
                // viewport this was set at).
                founder.name === "Dimitris" ? { group: { top: 0, left: -1.0632, width: 41, height: 97 } } : undefined
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
