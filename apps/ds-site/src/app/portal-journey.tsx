"use client";
import { useEffect, useRef } from "react";
import { useT } from "./i18n";
import { DS2Mark } from "./ds2-mark";

/** A pinned, scroll-scrubbed "travel through the portal" story for the working
 *  principle: the viewer scrolls forward through a transparent Greek gateway
 *  (Athens — the cost of lacking knowledge), which zooms past and dissolves into
 *  a London gateway (UK best practice) that grows and settles. The PNGs ship
 *  pre-keyed to transparency, so nothing is chroma-removed at runtime.
 *  Reduced-motion users get the two scenes as a plain, static narrative. */
export default function PortalJourney() {
  const t = useT();
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = ref.current;
    if (!section) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    (async () => {
      const [{ default: gsap }, { default: ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      // matchMedia gives a clean reduced-motion fork (no pin/scroll-jacking) and
      // auto-reverts every tween + the pinned trigger on mm.revert().
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const q = <T extends HTMLElement>(s: string) => section.querySelector<T>(s);
        const greeceLayer = q(".portal__layer--greece");
        const londonLayer = q(".portal__layer--london");
        const greeceImg = q(".portal__img--greece");
        const londonImg = q(".portal__img--london");
        const copy1 = q(".portal__copy--1");
        const copy2 = q(".portal__copy--2");
        const depth = q(".portal__depth");
        const glow = q(".portal__glow");
        if (!greeceLayer || !londonLayer || !greeceImg || !londonImg || !copy1 || !copy2) return;

        // copy2 (the London scene) waits below; London itself is visible from the
        // first frame (set in the timeline below), just small, dim and far away.
        gsap.set(copy2, { autoAlpha: 0, yPercent: 45 });
        gsap.set(londonLayer, { autoAlpha: 0 }); // hidden until the columns leave view

        const tl = gsap.timeline({
          defaults: { ease: "none" },
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: "+=400%", // travel ends when London opens up big on both sides
            pin: true,
            scrub: 1,
            anticipatePin: 1, // no pin-engage flash under Lenis momentum
            invalidateOnRefresh: true,
          },
        });

        // Explicit durations keep the timeline's total at 1.0, so every position
        // below reads as a true scroll fraction (0 = pin start, 1 = pin end).
        // Greece — zoom forward through the gateway (scale on the image), with a
        // subtle parallax drift/tilt on the layer, then fade as we pass through.
        // No opacity fades — both gateways travel purely by scale, in sequence.
        // Phase 1: the Greek columns pan out (scale up) until they leave the frame.
        tl.fromTo(greeceImg, { scale: 1.15 }, { scale: 5.6, duration: 0.46 }, 0)
          .fromTo(greeceLayer, { y: 8, rotate: -0.6 }, { y: -26, rotate: 0.6, duration: 0.46 }, 0)
          // London (Big Ben + the Eye) sits BEHIND the columns (z-index 1) at a scale
          // that keeps its landmarks tucked behind them — so it's HIDDEN at the start.
          // As the Greek columns pan out, they physically uncover it ("appear"); no
          // opacity fade, pure occlusion. It then grows gently to a settled framing.
          .fromTo(londonImg, { scale: 0.85 }, { scale: 1.05, duration: 0.54 }, 0.46)
          .fromTo(londonLayer, { x: 0, y: 0, rotate: 0 }, { x: -10, y: -12, rotate: 0.4, duration: 0.54 }, 0.46)
          // London appears exactly as the columns clear the frame (~0.3 → 0.46).
          .to(londonLayer, { autoAlpha: 1, duration: 0.16 }, 0.30)
          // Copy synced to the scene change: the Athens quote fades out exactly as the
          // columns clear (~0.46), the London scene fades in right after as it opens up.
          .to(copy1, { autoAlpha: 0, yPercent: -34, duration: 0.12 }, 0.34)
          .to(copy2, { autoAlpha: 1, yPercent: 0, duration: 0.16 }, 0.48);

        // Shading follows the zoom: the atmosphere + light dolly forward too, but
        // SLOWER than the columns (parallax depth) — so the scene reads as a real
        // camera push rather than a flat image scaling. The glow swells and brightens
        // as the columns part (emerging into the light), then settles over London.
        if (depth) {
          tl.fromTo(depth, { scale: 1 }, { scale: 2.2, duration: 0.46 }, 0)
            .to(depth, { scale: 2.7, duration: 0.54 }, 0.46);
        }
        if (glow) {
          tl.fromTo(glow, { scale: 1, opacity: 0.4 }, { scale: 2.9, opacity: 1, duration: 0.46 }, 0)
            .to(glow, { scale: 3.6, opacity: 0.62, duration: 0.54 }, 0.46);
        }

        return () => {
          tl.scrollTrigger?.kill();
          tl.kill();
        };
      });

      cleanup = () => mm.revert();
      if (cancelled) {
        cleanup();
        cleanup = undefined;
        return;
      }
      ScrollTrigger.refresh();
    })();

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  return (
    <section className="portal" id="thesis" ref={ref} aria-label={t.thesis.eyebrow}>
      <div className="portal__depth" aria-hidden="true" />
      <div className="portal__glow" aria-hidden="true" />
      <div className="portal__layer portal__layer--greece">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="portal__img portal__img--greece" src="/portals/greece-portal-transparent.webp" alt="" aria-hidden="true" />
      </div>
      <div className="portal__layer portal__layer--london">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className="portal__img portal__img--london" src="/portals/london-portal-simple-transparent.webp" alt="" aria-hidden="true" />
      </div>

      <div className="portal__copy portal__copy--1">
        <div className="eyebrow">{t.thesis.eyebrow}</div>
        <blockquote className="portal__quote">&ldquo;{t.thesis.s1Title}<em>{t.thesis.s1Em}</em>{t.thesis.s1End}&rdquo;</blockquote>
        <p className="portal__body">{t.thesis.s1Body}</p>
        <div className="portal__by">
          <DS2Mark className="portal__by-mark" aria-label={t.thesis.by} />
        </div>
      </div>
      <div className="portal__copy portal__copy--2">
        <div className="eyebrow">{t.thesis.s2Eyebrow}</div>
        <h2 className="portal__title">{t.thesis.s2Title}<em>{t.thesis.s2Em}</em></h2>
        <p className="portal__body">{t.thesis.s2Body}</p>
      </div>
    </section>
  );
}
