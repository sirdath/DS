"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import ContactPanel from "./contact-panel";
import { useT, LangToggle } from "./i18n";
import { DS2Mark } from "./ds2-mark";
import { MobileMenu } from "./mobile-menu";
import "./home.css";

export default function HomePage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const openChat = (draft = "") => {
    setChatDraft(draft);
    setChatOpen(true);
  };
  const t = useT();
  const rootRef = useRef<HTMLDivElement>(null);

  // Calm reveal-on-scroll: fade + rise once, opacity/transform only. Honours
  // prefers-reduced-motion (the CSS shows everything and this effect no-ops).
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const els = Array.from(root.querySelectorAll("[data-reveal]"));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { rootMargin: "0px 0px -12% 0px", threshold: 0.1 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="home2" ref={rootRef}>
      {/* ── Nav ─────────────────────────────────────────────────────────── */}
      <nav className="nav2" aria-label={t.a11y.home}>
        <div className="nav2__inner">
          <a href="#top" className="nav2__mark" aria-label={t.a11y.home}>
            <DS2Mark />
          </a>
          <div className="nav2__right">
            <ul className="nav2__links">
              <li><a href="#services">{t.nav.services}</a></li>
              <li><Link href="/portfolio">{t.nav.portfolio}</Link></li>
              <li><Link href="/about">{t.nav.about}</Link></li>
              <li><Link href="/blog">{t.nav.blog}</Link></li>
            </ul>
            <LangToggle />
            <button
              type="button"
              className="btn btn-primary nav2__desktop-cta"
              onClick={() => openChat()}
            >
              {t.cta.send}
            </button>
            <span className="nav2__menu">
              <MobileMenu onContact={() => openChat()} />
            </span>
          </div>
        </div>
      </nav>

      <span id="top" />

      {/* ── Hero (typographic) ──────────────────────────────────────────── */}
      <header className="section hero2">
        <div className="wrap">
          <p className="hero2__eyebrow" data-reveal>
            {t.hero.tag1} {t.hero.tag2}
          </p>
          <h1 className="hero2__title" data-reveal>
            {t.hero.heroTitle}
            <em>{t.hero.heroTitleEm}</em>
          </h1>
          <p className="hero2__sub" data-reveal>
            {t.hero.sub}
          </p>
          <div className="hero2__actions" data-reveal>
            <button type="button" className="btn btn-primary" onClick={() => openChat()}>
              {t.services.detailCta}
              <span className="arrow" aria-hidden="true">→</span>
            </button>
            <Link href="/portfolio" className="btn btn-ghost">
              {t.featured.viewAll}
            </Link>
          </div>
          <div className="hero2__meta" data-reveal>
            <span>{t.hero.build.join(" · ")}</span>
            <span>{t.hero.book.role}</span>
          </div>
        </div>
      </header>

      {/* ── Services (3 cards) ──────────────────────────────────────────── */}
      <section className="section section--surface" id="services">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <p className="eyebrow">{t.services.eyebrow}</p>
            <h2 className="sec-title">
              {t.services.title} <em>{t.services.titleEm}</em>
            </h2>
            <p className="sec-sub">{t.services.sub}</p>
          </div>
          <div className="svc-grid">
            {t.services.cats.map((cat) => (
              <article className="svc-card" key={cat.key} data-reveal>
                <span className="svc-card__tag">{cat.tag}</span>
                <h3 className="svc-card__name">{cat.name}</h3>
                <p className="svc-card__tagline">{cat.tagline}</p>
                <p className="svc-card__desc">{cat.desc}</p>
                <ul className="svc-card__items">
                  {cat.items.slice(0, 4).map((it) => (
                    <li key={it.name}>
                      <b>{it.name}.</b> {it.detail}
                    </li>
                  ))}
                </ul>
                <div className="svc-card__foot">
                  <button type="button" className="svc-card__link" onClick={() => openChat()}>
                    {t.services.detailCta}
                    <span className="arrow" aria-hidden="true">→</span>
                  </button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── How we work (challenge-first) ───────────────────────────────── */}
      <section className="section" id="how">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <p className="eyebrow">{t.how.eyebrow}</p>
            <h2 className="sec-title">
              {t.how.title} <em>{t.how.titleEm}</em>
            </h2>
            <p className="sec-sub">{t.how.sub}</p>
          </div>
          <div className="beats">
            {t.how.beats.map((b) => (
              <div className="beat" key={b.n} data-reveal>
                <div className="beat__n">{b.n}</div>
                <h3 className="beat__title">{b.title}</h3>
                <p className="beat__body">{b.body}</p>
              </div>
            ))}
          </div>
          <div className="signatures">
            <p className="signature" data-reveal>{t.how.sig1}</p>
            <p className="signature" data-reveal>{t.how.sig2}</p>
            <p className="signature" data-reveal>{t.how.sig3}</p>
          </div>
        </div>
      </section>

      {/* ── Featured work ───────────────────────────────────────────────── */}
      <section className="section section--surface" id="featured">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <p className="eyebrow">{t.featured.eyebrow}</p>
            <h2 className="sec-title">
              {t.featured.title}
              <em>{t.featured.titleEm}</em>
            </h2>
            <p className="sec-sub">{t.featured.sub}</p>
          </div>
          <div className="feat2" data-reveal>
            {t.featured.items.map((it) => (
              <a
                className="feat2__row"
                key={it.url}
                href={it.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="feat2__main">
                  <span className="feat2__name">{it.name}</span>
                  <span className="feat2__blurb">{it.blurb}</span>
                </span>
                <span className="feat2__tag">{it.tag}</span>
                <span className="feat2__arrow" aria-hidden="true">↗</span>
              </a>
            ))}
          </div>
          <Link href="/portfolio" className="btn btn-ghost feat2__cta">
            {t.featured.viewAll}
            <span className="arrow" aria-hidden="true">→</span>
          </Link>
        </div>
      </section>

      {/* ── Founders ────────────────────────────────────────────────────── */}
      <section className="section" id="founders">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <p className="eyebrow">{t.founders.eyebrow}</p>
            <h2 className="sec-title">
              {t.founders.title} <em>{t.founders.titleEm}</em>
            </h2>
            <p className="sec-sub">{t.founders.sub}</p>
          </div>
          <div className="founders2">
            <article className="founder2" data-reveal>
              <div className="founder2__loc">{t.founders.f1Loc}</div>
              <h3 className="founder2__title">{t.founders.f1Title}</h3>
              <p className="founder2__desc">{t.founders.f1Desc}</p>
            </article>
            <article className="founder2" data-reveal>
              <div className="founder2__loc">{t.founders.f2Loc}</div>
              <h3 className="founder2__title">{t.founders.f2Title}</h3>
              <p className="founder2__desc">{t.founders.f2Desc}</p>
            </article>
          </div>
        </div>
      </section>

      {/* ── Contact ─────────────────────────────────────────────────────── */}
      <section className="section section--surface contact2" id="contact">
        <div className="wrap">
          <div className="sec-head" data-reveal>
            <p className="eyebrow">{t.contact.eyebrow}</p>
            <h2 className="contact2__title">
              {t.contact.title}
              <em>{t.contact.titleEm}</em>
              {t.contact.titleEnd}
            </h2>
            <p className="contact2__sub">{t.contact.sub}</p>
          </div>
          <div className="contact2__actions" data-reveal>
            <button type="button" className="btn btn-primary" onClick={() => openChat()}>
              {t.cta.send}
              <span className="arrow" aria-hidden="true">→</span>
            </button>
          </div>
          <p className="contact2__email" data-reveal>
            <a href="mailto:ds2consulting.contact@gmail.com">
              ds2consulting.contact@gmail.com
            </a>
          </p>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer className="footer2">
        <div className="wrap">
          <div className="footer2__grid">
            <div>
              <span className="footer2__mark">
                <DS2Mark />
              </span>
              <p className="footer2__headline">{t.footer.headline}</p>
            </div>
            <nav className="footer2__nav" aria-label={t.footer.navLabel}>
              <a href="#services">{t.footer.services}</a>
              <Link href="/portfolio">{t.footer.portfolio}</Link>
              <Link href="/about">{t.footer.about}</Link>
              <Link href="/tools">{t.footer.tools}</Link>
              <Link href="/blog">{t.nav.blog}</Link>
            </nav>
          </div>
          <p className="footer2__copy">{t.footer.copyright}</p>
        </div>
      </footer>

      <ContactPanel open={chatOpen} onClose={() => setChatOpen(false)} initialDraft={chatDraft} />
    </div>
  );
}
