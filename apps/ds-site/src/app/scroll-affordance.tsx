"use client";

import { useEffect, useRef, useState } from "react";
import s from "./scroll-affordance.module.css";

/* ─────────────────────────────────────────────────────────────────────────────
   ScrollAffordance: a floating, draggable overlay scroll thumb for the page.

   globals.css hides the native html/body scrollbar site-wide. Wheel, trackpad
   and keyboard scrolling all still work, but dragging a scrollbar thumb, the
   primary scroll method for some people who can't wheel or gesture, had no
   target left anywhere on the site. This adds that one missing affordance back
   as a custom overlay; it never intercepts or replaces native scrolling.

   Mounted once in the root layout, so it covers every route, including
   client-side next/link navigations, without any per-page wiring.
   ──────────────────────────────────────────────────────────────────────────── */

/** ms of no scrolling / no edge-hover before the thumb fades back out. */
const IDLE_HIDE_MS = 900;
/** how near the right edge the pointer must come for the thumb to appear. */
const EDGE_ZONE_PX = 72;
/** floor for the thumb on very long pages, which also keeps it grabbable. */
const MIN_THUMB_PX = 32;
/** gap kept between the track and the bottom of the viewport. */
const BOTTOM_INSET_PX = 8;
/**
 * Height of the fixed `nav.top` bar (globals.css `nav.top { height: 56px }`,
 * constant: no breakpoint, scheme or state rule overrides it, and the universal
 * `box-sizing: border-box` means the 1px bottom hairline is inside those 56px).
 * Read as a constant rather than measured per frame: the bar animates in and out
 * on the desktop-portal route, and a measured inset would make the thumb jump
 * mid-transition. globals.css already hardcodes the same 56px for `.pe-panel`.
 */
const NAV_HEIGHT_PX = 56;
/** gap kept above the track: clears the nav, then the same 8px edge rhythm. */
const TOP_INSET_PX = NAV_HEIGHT_PX + BOTTOM_INSET_PX;

type Metrics = {
  /** true when the document actually has somewhere to scroll to. */
  scrollable: boolean;
  /** px of document scroll available. */
  maxScroll: number;
  /** px of vertical travel available to the thumb. */
  trackRange: number;
  /** current thumb height in px. */
  thumbHeight: number;
};

const IDLE: Metrics = { scrollable: false, maxScroll: 0, trackRange: 0, thumbHeight: 0 };

/**
 * Reads real document-scroll geometry.
 *
 * `documentElement.clientHeight` (not `window.innerHeight`) is used for both the
 * visible-fraction ratio and the track height: it is the layout viewport, which
 * is exactly the box a `position: fixed` element is laid out against, and it
 * excludes any classic scrollbar gutter. The two are identical on this site
 * today (the native scrollbar is hidden, and the component is desktop-only), but
 * clientHeight stays correct if that ever changes.
 */
function readMetrics(): Metrics {
  const doc = document.documentElement;
  const viewportHeight = doc.clientHeight;
  const documentHeight = Math.max(doc.scrollHeight, document.body.scrollHeight);
  const maxScroll = documentHeight - viewportHeight;
  const trackHeight = viewportHeight - TOP_INSET_PX - BOTTOM_INSET_PX;
  if (maxScroll <= 1 || trackHeight <= MIN_THUMB_PX) return IDLE;
  const thumbHeight = Math.max(MIN_THUMB_PX, Math.round((viewportHeight / documentHeight) * trackHeight));
  return { scrollable: true, maxScroll, trackRange: trackHeight - thumbHeight, thumbHeight };
}

/**
 * True while something has locked page scroll. The contact panel, the mobile
 * nav sheet and the preloader all lock by setting `overflow: hidden` on
 * body/documentElement, so a computed-style read catches every current case
 * (and any future class-driven one) without coupling to a specific component.
 */
function isScrollLocked(): boolean {
  const blocked = (el: Element) => {
    const overflow = getComputedStyle(el).overflowY;
    return overflow === "hidden" || overflow === "clip";
  };
  return blocked(document.documentElement) || blocked(document.body);
}

/** Wires the thumb to real document scroll. Returns its disposer. */
function createScrollThumb(thumb: HTMLDivElement): () => void {
  let metrics = IDLE;
  let locked = isScrollLocked();
  let frame = 0;
  let hideTimer = 0;
  let pointerAtEdge = false;
  let dragging = false;
  let dragStartY = 0;
  let dragStartScroll = 0;

  const setVisible = (visible: boolean) => {
    thumb.dataset.visible = visible && metrics.scrollable && !locked ? "true" : "false";
  };
  const cancelHide = () => {
    if (hideTimer) window.clearTimeout(hideTimer);
    hideTimer = 0;
  };
  const armHide = () => {
    cancelHide();
    hideTimer = window.setTimeout(() => {
      hideTimer = 0;
      if (!dragging && !pointerAtEdge) setVisible(false);
    }, IDLE_HIDE_MS);
  };

  // One read-then-write pass per animation frame: measure, then position.
  const render = () => {
    frame = 0;
    metrics = locked ? IDLE : readMetrics();
    if (!metrics.scrollable) {
      setVisible(false);
      return;
    }
    const progress = Math.min(1, Math.max(0, window.scrollY / metrics.maxScroll));
    thumb.style.height = `${metrics.thumbHeight}px`;
    thumb.style.transform = `translate3d(0, ${TOP_INSET_PX + progress * metrics.trackRange}px, 0)`;
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(render);
  };
  /** Show now, then fade out after the idle delay unless still engaged. */
  const reveal = () => {
    schedule();
    setVisible(true);
    if (dragging || pointerAtEdge) cancelHide();
    else armHide();
  };

  const onScroll = () => reveal();
  const onResize = () => schedule();
  const onPointerMove = (e: PointerEvent) => {
    if (dragging) return;
    const atEdge = e.clientX >= window.innerWidth - EDGE_ZONE_PX;
    if (atEdge === pointerAtEdge) return;
    pointerAtEdge = atEdge;
    if (atEdge) reveal();
    else armHide();
  };
  const onPointerLeave = () => {
    pointerAtEdge = false;
    if (!dragging) armHide();
  };

  const onDragStart = (e: PointerEvent) => {
    if (e.button !== 0 || locked || !metrics.scrollable) return;
    e.preventDefault(); // suppresses the compat mousedown, so no text selection
    dragging = true;
    dragStartY = e.clientY;
    dragStartScroll = window.scrollY;
    thumb.dataset.dragging = "true";
    thumb.setPointerCapture(e.pointerId);
    cancelHide();
    setVisible(true);
  };
  const onDragMove = (e: PointerEvent) => {
    if (!dragging || metrics.trackRange <= 0) return;
    const delta = ((e.clientY - dragStartY) * metrics.maxScroll) / metrics.trackRange;
    const target = Math.min(metrics.maxScroll, Math.max(0, dragStartScroll + delta));
    window.scrollTo({ top: target, behavior: "auto" });
  };
  const onDragEnd = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    thumb.dataset.dragging = "false";
    if (thumb.hasPointerCapture(e.pointerId)) thumb.releasePointerCapture(e.pointerId);
    armHide();
  };

  // Content height moves after mount (images, fonts, language toggle, route
  // changes), and overlays lock scroll by mutating body/html style, so watch
  // both rather than measuring once.
  const contentObserver = new ResizeObserver(() => schedule());
  contentObserver.observe(document.body);
  const lockObserver = new MutationObserver(() => {
    locked = isScrollLocked();
    if (locked) setVisible(false);
    schedule();
  });
  const lockOptions = { attributes: true, attributeFilter: ["style", "class"] };
  lockObserver.observe(document.documentElement, lockOptions);
  lockObserver.observe(document.body, lockOptions);

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onResize, { passive: true });
  window.addEventListener("pointermove", onPointerMove, { passive: true });
  document.addEventListener("pointerleave", onPointerLeave);
  thumb.addEventListener("pointerdown", onDragStart);
  thumb.addEventListener("pointermove", onDragMove);
  thumb.addEventListener("pointerup", onDragEnd);
  thumb.addEventListener("pointercancel", onDragEnd);
  thumb.addEventListener("lostpointercapture", onDragEnd);
  schedule();

  return () => {
    cancelHide();
    if (frame) cancelAnimationFrame(frame);
    contentObserver.disconnect();
    lockObserver.disconnect();
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("pointermove", onPointerMove);
    document.removeEventListener("pointerleave", onPointerLeave);
    thumb.removeEventListener("pointerdown", onDragStart);
    thumb.removeEventListener("pointermove", onDragMove);
    thumb.removeEventListener("pointerup", onDragEnd);
    thumb.removeEventListener("pointercancel", onDragEnd);
    thumb.removeEventListener("lostpointercapture", onDragEnd);
  };
}

export default function ScrollAffordance() {
  // Desktop-class pointers only. Touch devices already get an OS-drawn scroll
  // indicator, and `(hover: hover)` + `(pointer: fine)` are the queries this
  // codebase already uses for "real cursor" gating (page.tsx line 213,
  // hero-glass-logo.tsx line 242). Rendering null until the effect runs also
  // keeps SSR and the first client render identical.
  const [isPointerFine, setIsPointerFine] = useState(false);
  const thumbRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(hover: hover) and (pointer: fine)");
    const sync = () => setIsPointerFine(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const thumb = thumbRef.current;
    if (!isPointerFine || !thumb) return;
    return createScrollThumb(thumb);
  }, [isPointerFine]);

  if (!isPointerFine) return null;
  // aria-hidden: this is a pointer-only duplicate of scrolling that keyboard and
  // AT users already have natively, so it adds nothing to the a11y tree.
  return <div ref={thumbRef} className={s.thumb} data-visible="false" aria-hidden="true" />;
}
