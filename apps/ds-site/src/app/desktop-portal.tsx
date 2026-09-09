"use client";

import {
  type CSSProperties,
  useEffect,
  useRef,
  useState,
} from "react";
import { flushSync } from "react-dom";
import { TUNABLE, useHeroLayerEditor } from "./desktop-portal-editor";
import { useLang } from "./i18n";
import QuoteSection from "./quote-section";
import DesktopCanvas, { COPY } from "./desktop-canvas";
import { SCREEN_PANEL_ASPECT, screenMatrix } from "./laptop-screen-matrix";
import s from "./desktop-portal.module.css";
import { DEFAULT_KEYFRAMES, KEYFRAME_PROGRESS, type LaptopPose } from "./laptop-keyframes";
import type { LaptopSceneController, ScreenPoint, ScreenQuad } from "./laptop-3d";

/**
 * The scroll-driven journey on the home page: a quote fades out, a 3D laptop
 * turns and opens, the DS2 desktop is projected onto its screen, and the whole
 * thing flattens to fill the viewport. The desktop UI being projected lives in
 * desktop-canvas.tsx and the homography maths in laptop-screen-matrix.ts, so
 * what is left here is only the scroll loop and the layer composition.
 */

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const stage = (progress: number, from: number, to: number) => {
  const value = clamp((progress - from) / (to - from));
  return value * value * (3 - 2 * value);
};

const noop = () => {};

export default function DesktopPortal({ onContact }: { onContact: () => void }) {
  const { lang } = useLang();
  const c = COPY[lang];
  const sectionRef = useRef<HTMLElement>(null);
  const laptopCanvasRef = useRef<HTMLCanvasElement>(null);
  const screenSurfaceRef = useRef<HTMLDivElement>(null);
  const immersedRef = useRef(false);
  const [immersed, setImmersed] = useState(false);

  const editor = useHeroLayerEditor();
  // The scroll loop below lives in a mount-once effect, so the editor reaches
  // it through refs rather than through its closure.
  const editingRef = useRef(false);
  const laptopKeyframesRef = useRef<readonly LaptopPose[]>(DEFAULT_KEYFRAMES);
  // The scroll position the loop pins itself to while the editor is open: the
  // selected keyframe's own progress, so the frame on screen is the frame being
  // edited.
  const editorProgressRef = useRef(0);
  const wakeRef = useRef<() => void>(noop);

  useEffect(() => {
    editingRef.current = TUNABLE && editor.editing;
    laptopKeyframesRef.current = editor.keyframes;
    editorProgressRef.current = KEYFRAME_PROGRESS[editor.activeKeyframe] ?? 0;
    wakeRef.current();
  }, [editor.editing, editor.keyframes, editor.activeKeyframe]);

  useEffect(() => {
    document.body.classList.toggle("desktop-immersed", immersed);
    return () => document.body.classList.remove("desktop-immersed");
  }, [immersed]);

  useEffect(() => {
    const section = sectionRef.current;
    const laptopCanvas = laptopCanvasRef.current;
    const screenSurface = screenSurfaceRef.current;
    if (!section) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reduce) {
      section.style.setProperty("--quote-opacity", "0");
      section.style.setProperty("--laptop-opacity", "0");
      section.style.setProperty("--desktop-opacity", "1");
      immersedRef.current = true;
      setImmersed(true);
      return;
    }

    let controller: LaptopSceneController | null = null;
    let loading: Promise<void> | null = null;
    let visible = false;
    let raf = 0;
    let lastTime = 0;
    let currentProgress = 0;
    let targetProgress = 0;

    // The section is taller than the animation actually needs (see the
    // --journey-animation-vh comment in desktop-portal.module.css): scrolling
    // past progress 1 just holds there instead of releasing the sticky pin
    // immediately, so reaching the finished desktop doesn't dump the visitor
    // straight past it on the same scroll gesture that got them there.
    const readProgress = () => {
      const rect = section.getBoundingClientRect();
      const animationVh = parseFloat(getComputedStyle(section).getPropertyValue("--journey-animation-vh")) || 660;
      const distance = Math.max(1, window.innerHeight * (animationVh / 100));
      return clamp(-rect.top / distance);
    };

    const applyProgress = (progress: number) => {
      const desktop = stage(progress, 0.955, 0.985);
      const quote = 1 - stage(progress, 0.14, 0.44);
      const laptopOpacity = 1 - stage(progress, 0.88, 0.965);
      const screenReveal = stage(progress, 0.28, 0.48);

      section.style.setProperty("--quote-opacity", quote.toFixed(3));
      section.style.setProperty("--laptop-opacity", laptopOpacity.toFixed(3));
      section.style.setProperty("--desktop-opacity", desktop.toFixed(3));
      section.style.setProperty("--scroll-progress", progress.toFixed(3));

      // Single place the override channel is fed, so the editing and
      // non-editing paths can never disagree about it. Off the editor this is
      // always null, which is the scene's shipped behaviour exactly.
      controller?.setEditorKeyframes(editingRef.current ? laptopKeyframesRef.current : null);
      const quad = controller?.render(progress);
      if (screenSurface && quad) {
        const flatten = stage(progress, 0.86, 0.96);
        const sourceHeight = window.innerHeight;
        const panelWidth = sourceHeight * SCREEN_PANEL_ASPECT;
        const sourceWidth = panelWidth + (window.innerWidth - panelWidth) * flatten;
        screenSurface.style.width = `${sourceWidth}px`;
        screenSurface.style.height = `${sourceHeight}px`;
        const viewport: ScreenQuad = [
          [0, 0],
          [window.innerWidth, 0],
          [window.innerWidth, window.innerHeight],
          [0, window.innerHeight],
        ];
        const destination = quad.map(([x, y], index) => [
          x + (viewport[index]![0] - x) * flatten,
          y + (viewport[index]![1] - y) * flatten,
        ] as ScreenPoint) as ScreenQuad;
        const transform = screenMatrix(destination, sourceWidth, sourceHeight);
        screenSurface.style.opacity = transform && desktop < 0.999 ? screenReveal.toFixed(3) : "0";
        if (transform) screenSurface.style.transform = transform;
      }

      // progress is clamped, so on its own it can't tell "at the end of the
      // section" apart from "scrolled 5000px past it" -- both read 1. Gating
      // on `visible` (the same section-level IntersectionObserver already
      // driving the RAF loop below) is what lets immersion turn back off once
      // the section is actually behind the visitor, instead of leaving
      // body.desktop-immersed stuck on forever and the site nav hidden with
      // it for the rest of the page.
      const nextImmersed = progress > 0.972 && visible;
      if (immersedRef.current !== nextImmersed) {
        immersedRef.current = nextImmersed;
        // Plain setState here sat in React's default scheduling lane for
        // over a second before its effect (the body.desktop-immersed class
        // toggle the nav's visibility depends on) actually committed --
        // measured directly, not assumed. flushSync forces it through in the
        // same frame, which matters here because this is exactly the state
        // that decides whether the site's real nav is visible.
        flushSync(() => setImmersed(nextImmersed));
      }
    };

    const tick = (time: number) => {
      raf = 0;
      // Editor freeze: hold the section at the selected keyframe's own scroll
      // position and keep re-rendering it, so edits land immediately and real
      // scrolling cannot drag the pose out from under whoever is tuning it.
      // The loop runs continuously here rather than settling, because the
      // values it draws change from outside it.
      if (editingRef.current) {
        lastTime = time;
        const frozen = editorProgressRef.current;
        targetProgress = frozen;
        currentProgress = frozen;
        applyProgress(frozen);
        raf = window.requestAnimationFrame(tick);
        return;
      }
      const elapsed = lastTime ? Math.min(64, time - lastTime) : 16;
      lastTime = time;
      const blend = 1 - Math.exp(-elapsed / 480);
      currentProgress += (targetProgress - currentProgress) * blend;
      if (Math.abs(targetProgress - currentProgress) < 0.00015) currentProgress = targetProgress;
      applyProgress(currentProgress);
      if (visible && Math.abs(targetProgress - currentProgress) > 0.00015) {
        raf = window.requestAnimationFrame(tick);
      }
    };

    const requestUpdate = () => {
      if (!editingRef.current) targetProgress = readProgress();
      // Always schedule at least one tick on a real scroll event, even while
      // `visible` is false. Gating this on `visible` (as `tick`'s own
      // continuation check below still correctly does, to avoid looping while
      // off-screen) used to mean a scroll event that arrives after leaving
      // the section -- e.g. jumping back to #top from the footer -- could
      // never run applyProgress again to notice progress had dropped, so
      // body.desktop-immersed and the hidden nav stayed stuck until the
      // IntersectionObserver happened to fire on its own, up to ~1.5s later.
      if (!raf) raf = window.requestAnimationFrame(tick);
    };
    wakeRef.current = requestUpdate;

    const loadScene = () => {
      if (!laptopCanvas || controller || loading) return;
      loading = import("./laptop-3d").then(({ createLaptopScene }) => {
        controller = createLaptopScene(laptopCanvas);
        controller.resize();
        currentProgress = targetProgress;
        applyProgress(currentProgress);
      });
    };

    targetProgress = readProgress();
    currentProgress = targetProgress;
    applyProgress(currentProgress);

    const observer = new IntersectionObserver(([entry]) => {
      visible = Boolean(entry?.isIntersecting);
      if (visible) {
        loadScene();
        requestUpdate();
      }
      // No eager cancelAnimationFrame here on the way to invisible: a tick
      // already in flight needs to run at least once to notice progress has
      // dropped and clear immersion (see requestUpdate above). tick()'s own
      // continuation check already stops it from rescheduling once !visible,
      // so this was only ever saving a single frame of render work, at the
      // cost of racing a scroll event's freshly-scheduled tick and cancelling
      // it before it could run -- which is exactly what kept leaving
      // body.desktop-immersed stuck after landing back at the top.
    }, { rootMargin: "75% 0px" });
    observer.observe(section);
    window.addEventListener("scroll", requestUpdate, { passive: true });
    const resize = () => {
      controller?.resize();
      requestUpdate();
    };
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      wakeRef.current = noop;
      window.removeEventListener("scroll", requestUpdate);
      window.removeEventListener("resize", resize);
      if (raf) window.cancelAnimationFrame(raf);
      controller?.dispose();
    };
  }, []);

  // Dev only. The default rect is exactly .quoteLayer's own inset:0, so the
  // untouched editor renders the shipped box; production gets no inline style
  // at all.
  const quoteLayerStyle: CSSProperties | undefined = TUNABLE
    ? {
        top: `${editor.quote.top}%`,
        left: `${editor.quote.left}%`,
        width: `${editor.quote.width}%`,
        height: `${editor.quote.height}%`,
        right: "auto",
        bottom: "auto",
      }
    : undefined;

  return (
    <section ref={sectionRef} className={s.journey} id="desktop-experience" aria-label={c.enter}>
      <div className={s.sticky}>
        <div className={s.quoteLayer} style={quoteLayerStyle}><QuoteSection /></div>

        <div className={s.laptopLayer} aria-hidden="true">
          <canvas ref={laptopCanvasRef} className={s.laptopCanvas} />
          <div ref={screenSurfaceRef} className={s.laptopScreenSurface}>
            <DesktopCanvas active={false} onContact={noop} />
          </div>
        </div>

        <div className={`${s.desktopLayer}${immersed ? ` ${s.desktopLayerActive}` : ""}`}>
          <DesktopCanvas active={immersed} onContact={onContact} />
        </div>
        <div className={s.scrollHint}><span>{c.scroll}</span><i /></div>
      </div>
    </section>
  );
}
