"use client";
import { useEffect, useRef } from "react";

declare global {
  interface Window {
    __ds2Loaded?: boolean;
    __ds2VideoReady?: boolean;
  }
}

/** Per-orientation hero film. Each variant declares the window (in its own
 *  seconds, measured against `ref` duration) where the wide/portrait DS2 logo is
 *  on screen — the tagline is locked to that window and scales with the actual
 *  video duration, so re-timing the film keeps it in sync. */
const DESKTOP = {
  src: "/hero/hero-loop.mp4",
  poster: "/hero/hero-poster.jpg",
  captionFrom: 0.03,
  captionTo: 1.07,
  ref: 5.714,
};
const MOBILE = {
  // Portrait crop: full DS2 logo for ~1.05s, then the glass "old part".
  src: "/hero/hero-loop-mobile.mp4",
  poster: "/hero/hero-poster-mobile.jpg",
  captionFrom: 0.03,
  captionTo: 1.0,
  ref: 5.38,
};

/** Cinematic DS2 hero film as a looping background video. Replaces the old WebGL
 *  glass logo. Picks a portrait variant on small screens. Does NOT autoplay: waits
 *  for the preloader's `ds2:loaded` signal then starts from frame 0. The
 *  "Digital Solutions / consulting" caption is driven by the video clock. Honours
 *  prefers-reduced-motion (holds the poster) and pauses when scrolled off-screen. */
export default function HeroVideo() {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const cfg = window.matchMedia("(max-width: 760px)").matches ? MOBILE : DESKTOP;
    const caption = v
      .closest("section")
      ?.querySelector(".hero-glass__caption") as HTMLElement | null;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Load the right variant (during the preloader, so it's ready on reveal).
    v.poster = cfg.poster;
    if (v.getAttribute("src") !== cfg.src) {
      v.src = cfg.src;
      v.load();
    }

    // Tell the preloader when the film has buffered enough to play.
    const markReady = () => {
      if (window.__ds2VideoReady) return;
      window.__ds2VideoReady = true;
      window.dispatchEvent(new Event("ds2:videoready"));
    };
    if (v.readyState >= 3) markReady();
    else {
      v.addEventListener("canplaythrough", markReady, { once: true });
      v.addEventListener("canplay", markReady, { once: true });
    }

    if (reduce) {
      caption?.classList.add("is-shown"); // static poster = wide logo, show caption
      return;
    }

    // Play the intro (the DS2 logo reveal) at this fraction of full speed so the
    // logo lingers, then resume full speed once the camera leaves it.
    const LOGO_RATE = 0.55;
    let started = false;
    let raf = 0;
    const tick = () => {
      if (caption) {
        const scale = (v.duration || cfg.ref) / cfg.ref;
        const t = v.currentTime;
        const logoEnd = cfg.captionTo * scale;
        const wantRate = t < logoEnd ? LOGO_RATE : 1;
        if (v.playbackRate !== wantRate) v.playbackRate = wantRate;
        caption.classList.toggle(
          "is-shown",
          t >= cfg.captionFrom * scale && t < logoEnd
        );
      }
      raf = requestAnimationFrame(tick);
    };
    const runLoop = () => {
      if (!raf) raf = requestAnimationFrame(tick);
    };
    const stopLoop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };

    const start = () => {
      if (started) return;
      started = true;
      try {
        v.currentTime = 0;
      } catch {
        /* not seekable yet — plays from 0 anyway */
      }
      v.play().catch(() => {});
      runLoop();
    };

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || !started) return;
        if (entry.isIntersecting) {
          v.play().catch(() => {});
          runLoop();
        } else {
          v.pause();
          stopLoop();
        }
      },
      { threshold: 0.05 }
    );
    io.observe(v);

    if (window.__ds2Loaded) start();
    else window.addEventListener("ds2:loaded", start, { once: true });

    return () => {
      io.disconnect();
      stopLoop();
      window.removeEventListener("ds2:loaded", start);
    };
  }, []);

  return (
    <div className="hero-glass">
      <video
        ref={ref}
        className="hero-glass__video"
        muted
        loop
        playsInline
        preload="auto"
        poster="/hero/hero-poster.jpg"
        aria-hidden="true"
      />
    </div>
  );
}
