"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "./i18n";

/** Category icon (viewBox 0 0 40 40). One per buyable category. */
function CatIcon({ k }: { k: string }) {
  switch (k) {
    case "brand": // a screen being polished — the public-facing build
      return (
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <rect x="5" y="8" width="30" height="20" rx="2.5" />
          <path d="M5 14h30" /><path d="M15 33h10M20 28v5" />
          <path d="M26 17.6l1.5 3 3 1.5-3 1.5-1.5 3-1.5-3-3-1.5 3-1.5z" />
        </svg>
      );
    case "internal": // nodes rewired into one — internal systems
      return (
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="11" r="3" /><circle cx="9" cy="29" r="3" /><circle cx="31" cy="20" r="3" />
          <path d="M12 11h6a4 4 0 0 1 4 4v1M12 29h6a4 4 0 0 0 4-4v-1" />
          <path d="M26.5 18l1.6 2-1.6 2" />
        </svg>
      );
    default: // a spark — the bespoke build
      return (
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 5l3.3 9.4L32 18l-9.7 3.4L19 31l-3.3-9.6L6 18l9.7-3.6z" />
          <path d="M30 26l1.2 3.4L35 31l-3.4 1.2L30 36l-1.2-3.8L25 31l3.8-1.6z" opacity="0.75" />
        </svg>
      );
  }
}

/** Services — three buyable categories. Hovering a card (or tapping, on touch)
 *  morphs a full-width "mini page" over the row with the category's full detail:
 *  description, every offering explained, a proof line and a CTA. On phones the
 *  detail opens as a full-screen sheet instead. */
export default function ServicesCircle({ onContact }: { onContact?: () => void }) {
  const t = useT();
  const ref = useRef<HTMLElement>(null);
  const cats = t.services.cats;
  const hoverCapable = useRef(false);

  // `active` drives open/close; `shown` lags so the panel can fade OUT with content.
  const [active, setActive] = useState<number | null>(null);
  const [shown, setShown] = useState<number | null>(null);

  useEffect(() => {
    hoverCapable.current = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const section = ref.current;
    if (!section) return;
    const cards = Array.from(section.querySelectorAll<HTMLElement>(".svc__cat"));
    if (!cards.length) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      cards.forEach((c) => c.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.18 },
    );
    cards.forEach((c) => io.observe(c));
    return () => io.disconnect();
  }, []);

  // Keep `shown` in sync: adopt the new active immediately, retain it briefly on close.
  useEffect(() => {
    if (active !== null) {
      setShown(active);
      return;
    }
    const id = setTimeout(() => setShown(null), 460);
    return () => clearTimeout(id);
  }, [active]);

  // Escape closes; lock body scroll while the phone sheet is open.
  useEffect(() => {
    if (active === null) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setActive(null); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  const detail = shown !== null ? cats[shown] : null;
  const originX = active !== null ? `${((active + 0.5) / cats.length) * 100}%` : "50%";

  return (
    <section className="svc" id="services" ref={ref}>
      <div className="svc__seam" aria-hidden="true" />
      <div className="svc__inner wrap">
        <div className="svc__head">
          <div className="eyebrow">{t.services.eyebrow}</div>
          <h2 className="section-title svc__title">
            {t.services.title} <em>{t.services.titleEm}</em>
          </h2>
          <p className="svc__sub">{t.services.sub}</p>
        </div>

        <div
          className={`svc__cards${active !== null ? " is-detail" : ""}`}
          onMouseLeave={() => { if (hoverCapable.current) setActive(null); }}
        >
          {cats.map((c, i) => (
            <article
              key={c.key}
              className={`svc__cat svc__cat--${c.key}`}
              style={{ transitionDelay: `${i * 90}ms` }}
              role="button"
              tabIndex={0}
              aria-haspopup="dialog"
              aria-label={`${c.name}. ${c.tagline}`}
              onMouseEnter={() => { if (hoverCapable.current) setActive(i); }}
              onClick={() => setActive(i)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setActive(i); }
              }}
            >
              <div className="svc__cat-glow" aria-hidden="true" />
              <div className="svc__cat-body">
                <div className="svc__cat-top">
                  <span className="svc__cat-ic" aria-hidden="true"><CatIcon k={c.key} /></span>
                  <span className="svc__cat-tag">{c.tag}</span>
                </div>
                <h3 className="svc__cat-name">{c.name}</h3>
                <p className="svc__cat-line">{c.tagline}</p>
                {c.key === "custom" ? (
                  <ul className="svc__cat-chips">
                    {c.items.map((it) => (
                      <li key={it.name}>{it.name}</li>
                    ))}
                  </ul>
                ) : (
                  <ul className="svc__cat-list">
                    {c.items.map((it) => (
                      <li key={it.name}>
                        <span className="svc__cat-dot" aria-hidden="true" />
                        {it.name}
                      </li>
                    ))}
                  </ul>
                )}
                <span className="svc__cat-more" aria-hidden="true">View details &rarr;</span>
              </div>
            </article>
          ))}

          {/* Full detail takeover — morphs over the row from the hovered card */}
          <div
            className={`svc__detail${active !== null ? " is-open" : ""}${detail ? ` svc__detail--${detail.key}` : ""}`}
            style={{ transformOrigin: `${originX} 50%` }}
            role="dialog"
            aria-modal="false"
            aria-label={detail ? detail.name : undefined}
            aria-hidden={active === null}
          >
            {detail && (
              <div className="svc__detail-inner">
                <button className="svc__detail-close" type="button" onClick={() => setActive(null)} aria-label="Close details">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                </button>
                <div className="svc__detail-main">
                  <div className="svc__cat-top">
                    <span className="svc__cat-ic" aria-hidden="true"><CatIcon k={detail.key} /></span>
                    <span className="svc__cat-tag">{detail.tag}</span>
                  </div>
                  <h3 className="svc__detail-name">{detail.name}</h3>
                  <p className="svc__detail-desc">{detail.desc}</p>
                  <p className="svc__detail-eg">{detail.example}</p>
                  {onContact && (
                    <button className="svc__detail-cta" type="button" onClick={onContact}>
                      {t.services.detailCta}
                      <span aria-hidden="true">&rarr;</span>
                    </button>
                  )}
                </div>
                <ul className="svc__detail-list">
                  {detail.items.map((it) => (
                    <li key={it.name}>
                      <span className="svc__detail-oname">{it.name}</span>
                      <span className="svc__detail-odetail">{it.detail}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
