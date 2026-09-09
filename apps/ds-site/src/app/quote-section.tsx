"use client";

import { useEffect, useRef, useState } from "react";
import { DS2Mark } from "./ds2-mark";
import { useT } from "./i18n";
import s from "./quote-section.module.css";

export default function QuoteSection() {
  const t = useT();
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

  // The line is the same one portal-journey.tsx renders, so it reads from the
  // dictionary (thesis.s1Title / s1Em / s1End) instead of a hardcoded English
  // array, which never reached Greek and carried a comma splice the dictionary
  // does not have. Splitting on whitespace keeps the reveal word-by-word in
  // either language: lead-in words animate in plain, the emphasised phrase in
  // serif Ice, each on the same 0.06s stagger as before.
  const lead = t.thesis.s1Title.trim().split(/\s+/);
  const emphasis = t.thesis.s1Em.trim().split(/\s+/);
  const delay = (index: number) => `${0.16 + index * 0.06}s`;

  return (
    <section ref={ref} className={`${s.quote}${shown ? ` ${s.revealed}` : ""}`}>
      <div className={s.aura} aria-hidden="true" />
      {/* Faint DS2 mark behind the quote — the backdrop, not the attribution. */}
      <div className={s.watermark} aria-hidden="true">
        <DS2Mark />
      </div>
      <div className={s.inner}>
        <blockquote className={s.text}>
          <span className={`${s.word} ${s.qmark}`} style={{ transitionDelay: "0.1s" }}>{"“"}</span>
          {lead.map((w, i) => (
            <span key={`lead-${i}`} className={s.word} style={{ transitionDelay: delay(i) }}>
              {w}
            </span>
          ))}
          {emphasis.map((w, i) => {
            const last = i === emphasis.length - 1;
            return (
              <span
                key={`em-${i}`}
                className={`${s.word} ${s.em}${last ? ` ${s.emLast}` : ""}`}
                style={{ transitionDelay: delay(lead.length + i) }}
              >
                {last ? `${w}${t.thesis.s1End}` : w}
              </span>
            );
          })}
          <span className={`${s.word} ${s.qmark} ${s.qclose}`} style={{ transitionDelay: delay(lead.length + emphasis.length) }}>{"”"}</span>
        </blockquote>
      </div>
    </section>
  );
}
