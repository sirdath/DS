"use client";

import { useEffect, useRef, useState } from "react";
import { DS2Mark } from "./ds2-mark";
import s from "./quote-section.module.css";

const WORDS = ["The", "biggest", "cost,", "is", "lack", "of"];

export default function QuoteSection() {
  const ref = useRef<HTMLElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) { setShown(true); io.disconnect(); }
        });
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} className={`${s.quote}${shown ? ` ${s.revealed}` : ""}`}>
      <div className={s.aura} aria-hidden="true" />
      {/* Faint DS2 mark behind the quote — the backdrop, not the attribution. */}
      <div className={s.watermark} aria-hidden="true">
        <DS2Mark />
      </div>
      <div className={s.inner}>
        <DS2Mark className={s.mark} />
        <blockquote className={s.text}>
          <span className={`${s.word} ${s.qmark}`} style={{ transitionDelay: "0.1s" }}>{"“"}</span>
          {WORDS.map((w, i) => (
            <span key={i} className={s.word} style={{ transitionDelay: `${0.16 + i * 0.06}s` }}>
              {w}
            </span>
          ))}
          <span className={`${s.word} ${s.em}`} style={{ transitionDelay: `${0.16 + WORDS.length * 0.06}s` }}>
            knowledge.
          </span>
          <span className={`${s.word} ${s.qmark} ${s.qclose}`} style={{ transitionDelay: `${0.16 + (WORDS.length + 1) * 0.06}s` }}>{"”"}</span>
        </blockquote>
        <div className={s.by} aria-label="DS2">
          <span className={s.byDash} aria-hidden="true">—</span>
          <DS2Mark className={s.byMark} />
        </div>
      </div>
    </section>
  );
}
