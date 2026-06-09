"use client";
import { useEffect, useRef } from "react";
import { useT } from "./i18n";
import { DS2Mark } from "./ds2-mark";

/** Working principle — a scroll-scrubbed film of the Athens-to-London journey
 *  (Greek colonnade → London). The video's black background is dropped with
 *  mix-blend-mode: screen, so the marble + landmarks float over the page. Scroll
 *  scrubs the video frame-by-frame (all-intra encode = smooth seeking). The two
 *  copy beats cross-fade with the scene. Reduced-motion gets a static first frame. */
export default function PortalJourney() {
  const t = useT();
  const ref = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const section = ref.current;
    const video = videoRef.current;
    if (!section || !video) return;

    let cancelled = false;
    let cleanup: (() => void) | undefined;
    (async () => {
      const [{ default: gsap }, { default: ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (cancelled) return;
      gsap.registerPlugin(ScrollTrigger);

      const mm = gsap.matchMedia();

      // Scroll-scrub the film frame-by-frame — desktop AND mobile. The all-intra
      // encode plus a forced full buffer (below) make seeking render every frame
      // even on phones, so finger-scrubbing the Athens→London journey works
      // everywhere and fills the whole screen.
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const copy1 = section.querySelector<HTMLElement>(".portal__copy--1");
        const copy2 = section.querySelector<HTMLElement>(".portal__copy--2");
        if (!copy1 || !copy2) return;
        gsap.set(copy2, { autoAlpha: 0, yPercent: 26 });

        // (When a portrait-framed journey-mobile.mp4 is added, swap video.src to it
        // on phones so the full-screen film keeps the Athens→London landmarks
        // centred. Until then the landscape master is used full-screen on mobile.)

        // Pull the whole clip into the buffer so seeking renders frames on mobile
        // (phones barely preload; a muted play→pause kick forces the download).
        video.preload = "auto";
        const kick = video.play();
        if (kick) kick.then(() => video.pause()).catch(() => video.pause());
        else video.pause();

        const build = () => {
          const dur = video.duration || 4;
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: section,
              start: "top top",
              end: "+=560%", // longer travel: slower, smoother, more time to buffer
              pin: true,
              scrub: 1,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
          });
          // scrub the film frame-by-frame across the scroll
          tl.fromTo(video, { currentTime: 0 }, { currentTime: dur, duration: 1 }, 0)
            // the Athens quote hands off to the London message as we arrive
            .to(copy1, { autoAlpha: 0, yPercent: -26, duration: 0.12 }, 0.46)
            .to(copy2, { autoAlpha: 1, yPercent: 0, duration: 0.16 }, 0.64);
          return tl;
        };

        let tl: gsap.core.Timeline | undefined;
        if (video.readyState >= 1 && video.duration) {
          tl = build();
        } else {
          const onMeta = () => {
            tl = build();
            ScrollTrigger.refresh();
          };
          video.addEventListener("loadedmetadata", onMeta, { once: true });
        }
        return () => {
          tl?.scrollTrigger?.kill();
          tl?.kill();
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
    <section className="portal portal--video" id="thesis" ref={ref} aria-label={t.thesis.eyebrow}>
      <div className="portal__video-wrap" aria-hidden="true">
        <video
          ref={videoRef}
          className="portal__video"
          src="/portals/journey.mp4?v=3"
          muted
          playsInline
          preload="auto"
          poster="/portals/journey-poster.jpg?v=3"
        />
      </div>

      <div className="portal__copy portal__copy--1">
        <div className="eyebrow">{t.thesis.eyebrow}</div>
        <blockquote className="portal__quote">&ldquo;{t.thesis.s1Title}<em>{t.thesis.s1Em}</em>{t.thesis.s1End}&rdquo;</blockquote>
        <p className="portal__body">{t.thesis.s1Body}</p>
        <div className="portal__by"><DS2Mark className="portal__by-mark" aria-label={t.thesis.by} /></div>
      </div>
      <div className="portal__copy portal__copy--2">
        <div className="eyebrow">{t.thesis.s2Eyebrow}</div>
        <h2 className="portal__title">{t.thesis.s2Title}<em>{t.thesis.s2Em}</em></h2>
        <p className="portal__body">{t.thesis.s2Body}</p>
      </div>
    </section>
  );
}
