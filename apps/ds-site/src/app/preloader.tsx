"use client";
import { useEffect, useState } from "react";

/** Entry preloader: the DS2 wordmark draws itself (SVG stroke), fills in, then
 *  the blank screen fades to reveal the site. Stays until the draw finishes AND
 *  the page has loaded. Honours prefers-reduced-motion (shows the mark, brief
 *  hold, fade). Lives in the root layout so it plays on a fresh entry only. */
export default function Preloader() {
  const [out, setOut] = useState(false);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const minMs = reduce ? 500 : 2000; // let the DS2 draw + fill complete
    const maxMs = 9000; // hard cap so a slow/failed video never hangs the screen
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
      // Signal the hero film to start from frame 0 exactly as we reveal the site.
      window.__ds2Loaded = true;
      window.dispatchEvent(new Event("ds2:loaded"));
      setOut(true);
      timers.push(window.setTimeout(() => setGone(true), 850)); // unmount after fade
    };

    // Reveal only once the draw has finished AND the hero video has buffered
    // (or we hit the safety cap).
    const maybeReveal = () => {
      if (done) return;
      const elapsed = performance.now() - start;
      if (elapsed < minMs) {
        timers.push(window.setTimeout(maybeReveal, minMs - elapsed + 20));
        return;
      }
      if (window.__ds2VideoReady || elapsed >= maxMs) reveal();
    };

    window.addEventListener("ds2:videoready", maybeReveal);
    timers.push(window.setTimeout(maybeReveal, minMs + 20)); // re-check after the draw
    timers.push(window.setTimeout(reveal, maxMs)); // safety cap

    return () => {
      window.removeEventListener("ds2:videoready", maybeReveal);
      timers.forEach((t) => window.clearTimeout(t));
      unlockScroll();
    };
  }, []);

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
