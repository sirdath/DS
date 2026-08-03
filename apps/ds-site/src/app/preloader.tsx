"use client";
import { useEffect, useState } from "react";

/** Entry preloader: the DS2 wordmark draws itself (SVG stroke), fills in, then
 *  the curtain fades to reveal the site with the hero film starting from frame 0.
 *  Holds until the draw finishes AND the hero film has buffered (ds2:videoready,
 *  dispatched by hero-video.tsx) — capped so a slow network never means staring
 *  at black. Plays once per browser session: returning to the homepage from
 *  another page skips straight to the site. Honours prefers-reduced-motion. */
const SESSION_KEY = "ds2:preloader-shown";

export default function Preloader() {
  // Once per session: if the curtain already played, don't mount it at all.
  const [gone, setGone] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return !!sessionStorage.getItem(SESSION_KEY);
    } catch {
      return false; // storage unavailable — just play the curtain
    }
  });
  const [out, setOut] = useState(false);

  useEffect(() => {
    if (gone) {
      // Curtain skipped — still release the hero film (it waits for ds2:loaded).
      // The flag covers HeroVideo mounting after us; the event covers before.
      if (!window.__ds2Loaded) {
        window.__ds2Loaded = true;
        window.dispatchEvent(new Event("ds2:loaded"));
      }
      return;
    }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // The wordmark draw+fill genuinely takes ~600ms (globals.css ds2-draw/ds2-fill)
    // — the floor lets it finish; it is not padding.
    const minMs = reduce ? 300 : 700;
    const maxMs = 1600; // hard cap: never hold the curtain longer than this
    const start = performance.now();
    const timers: number[] = [];
    let done = false;

    // Lock scrolling while the loading screen is up.
    const prevHtmlOverflow = document.documentElement.style.overflow;
    const prevBodyOverflow = document.body.style.overflow;
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    const unlockScroll = () => {
      document.documentElement.style.overflow = prevHtmlOverflow;
      document.body.style.overflow = prevBodyOverflow;
    };

    const reveal = () => {
      if (done) return;
      done = true;
      unlockScroll();
      try {
        sessionStorage.setItem(SESSION_KEY, "1");
      } catch {
        /* ignore */
      }
      // Signal the hero film to start from frame 0 exactly as we reveal the site.
      window.__ds2Loaded = true;
      window.dispatchEvent(new Event("ds2:loaded"));
      setOut(true);
      timers.push(window.setTimeout(() => setGone(true), 320)); // unmount after fade
    };

    // Reveal once the draw has finished AND the hero film can play. A page
    // without the hero film never sets __ds2VideoReady — detect its absence and
    // fall back to the draw-only wait so we don't sit on the cap.
    const maybeReveal = () => {
      if (done) return;
      const elapsed = performance.now() - start;
      if (elapsed < minMs) {
        timers.push(window.setTimeout(maybeReveal, minMs - elapsed + 20));
        return;
      }
      const heroFilm = document.querySelector("video.hero-glass__video");
      if (heroFilm && !window.__ds2VideoReady) return; // ds2:videoready or the cap will re-call us
      reveal();
    };

    window.addEventListener("ds2:videoready", maybeReveal);
    timers.push(window.setTimeout(maybeReveal, minMs + 20)); // re-check after the draw
    timers.push(window.setTimeout(reveal, maxMs)); // safety cap

    return () => {
      window.removeEventListener("ds2:videoready", maybeReveal);
      timers.forEach((t) => window.clearTimeout(t));
      unlockScroll();
    };
  }, [gone]);

  if (gone) return null;

  return (
    <div className={`preloader${out ? " preloader--out" : ""}`} role="presentation">
      <svg className="preloader__mark" viewBox="0 0 1136 285" aria-label="DS2 loading">
        <path pathLength={1} d="M 18 10 L 291 11 L 340 33 L 371 82 L 375 124 L 375 180 L 363 222 L 327 260 L 285 273 L 19 273 L 10 262 L 10 220 L 21 211 L 273 211 L 301 195 L 310 153 L 310 111 L 300 83 L 273 69 L 21 69 L 10 60 L 10 18 L 15 11 Z" />
        <path pathLength={1} d="M 466 10 L 736 10 L 744 17 L 744 53 L 735 69 L 474 70 L 459 93 L 473 109 L 680 111 L 725 125 L 753 159 L 760 195 L 752 231 L 721 263 L 685 273 L 406 273 L 397 270 L 394 225 L 405 211 L 675 211 L 693 205 L 690 178 L 663 175 L 474 174 L 438 162 L 406 131 L 394 95 L 396 68 L 418 32 L 454 12 L 463 11 Z" />
        <path pathLength={1} d="M 800 10 L 1061 11 L 1106 34 L 1126 70 L 1128 97 L 1117 133 L 1086 165 L 1050 175 L 870 175 L 845 191 L 838 209 L 1116 211 L 1127 224 L 1127 260 L 1116 273 L 783 273 L 776 266 L 775 212 L 784 167 L 813 132 L 858 112 L 1038 111 L 1064 99 L 1056 73 L 1038 69 L 804 69 L 795 66 L 792 21 L 796 12 Z" />
      </svg>
    </div>
  );
}
