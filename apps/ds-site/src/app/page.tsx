"use client";
/* eslint-disable react/no-unescaped-entities */
import Link from "next/link";
import { useEffect, useState } from "react";
import ContactPanel, { ContactCTA } from "./contact-panel";
import { useT, useLang, LangToggle } from "./i18n";
import PoweredBy from "./powered-by";
import { DS2Mark } from "./ds2-mark";
import HeroVideo from "./hero-video";
import Preloader from "./preloader";
import SiteFooter from "./site-footer";
import ServicesCircle from "./services-circle";
import PortalJourney from "./portal-journey";
import { MobileMenu } from "./mobile-menu";

// Landing-page teaser for the DS2 tools — parked until the section earns its
// place visually. Flip to true to bring it back.
const SHOW_TOOLS_TEASER = false;

export default function HomePage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatDraft, setChatDraft] = useState("");
  const openChat = (draft = "") => {
    setChatDraft(draft);
    setChatOpen(true);
  };
  const t = useT();
  const { lang } = useLang();

  // Navbar: transparent over the hero film, opaque once scrolled past it.
  useEffect(() => {
    const nav = document.querySelector("nav.top");
    const hero = document.querySelector(".hero--glass");
    if (!nav || !hero) return;
    const io = new IntersectionObserver(
      (entries) => {
        const e = entries[0];
        if (e) nav.classList.toggle("nav--solid", !e.isIntersecting);
      },
      { threshold: 0 }
    );
    io.observe(hero);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;
    const disposers: Array<() => void> = [];
    const typeAbort = { aborted: false };

    (async () => {
      const [{ default: gsap }, { default: ScrollTrigger }, { default: Lenis }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      // â”€â”€â”€ Lenis smooth scroll â”€â”€â”€
      const lenis = new Lenis({
        duration: 1.15,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
      });
      lenis.on("scroll", ScrollTrigger.update);
      const tickerCb = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tickerCb);
      gsap.ticker.lagSmoothing(0);
      disposers.push(() => {
        gsap.ticker.remove(tickerCb);
        lenis.destroy();
      });

      // Smooth in-page anchor scrolling via Lenis.
      const hashLinks = Array.from(document.querySelectorAll('a[href^="#"]')) as HTMLAnchorElement[];
      hashLinks.forEach((a) => {
        const onClick = (e: Event) => {
          const id = a.getAttribute("href");
          if (!id || id.length <= 1) return;
          const el = document.querySelector(id);
          if (el) {
            e.preventDefault();
            lenis.scrollTo(el as HTMLElement, { offset: -40 });
          }
        };
        a.addEventListener("click", onClick);
        disposers.push(() => a.removeEventListener("click", onClick));
      });

      // â”€â”€â”€ Hero loaded safety â”€â”€â”€
      const showHero = () => document.querySelector(".hero")?.classList.add("loaded");
      const onLoad = () => {
        showHero();
        ScrollTrigger.refresh();
      };
      window.addEventListener("load", onLoad);
      const heroTimeout = setTimeout(() => {
        showHero();
        ScrollTrigger.refresh();
      }, 600);
      disposers.push(() => {
        window.removeEventListener("load", onLoad);
        clearTimeout(heroTimeout);
      });

      // â”€â”€â”€ Founders split-seam reveal â”€â”€â”€
      const split = document.getElementById("founders-split");
      if (split) {
        ScrollTrigger.create({
          trigger: split,
          start: "top 80%",
          onEnter: () => split.classList.add("is-revealed"),
          onLeaveBack: () => split.classList.remove("is-revealed"),
        });
      }

      // â”€â”€â”€ Services bento â€” staggered fade-up on scroll â”€â”€â”€
      const svcCells = Array.from(document.querySelectorAll(".svc-cell")) as HTMLElement[];
      if (svcCells.length) {
        gsap.set(svcCells, { y: 26, autoAlpha: 0 });
        ScrollTrigger.batch(svcCells, {
          start: "top 88%",
          once: true,
          onEnter: (batch) =>
            gsap.to(batch, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.07, ease: "power3.out", overwrite: true }),
        });
      }

      // ─── Scroll-linked page tint (writes --page-tint) + house-style card reveals ───
      const prefersReduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (!prefersReduce) {
        const rootEl = document.documentElement;
        (Array.from(document.querySelectorAll("[data-tint]")) as HTMLElement[]).forEach((sec) => {
          ScrollTrigger.create({
            trigger: sec,
            start: "top center",
            end: "bottom center",
            onToggle: (self) => {
              if (self.isActive) rootEl.style.setProperty("--page-tint", sec.dataset.tint || "transparent");
            },
          });
        });
        const revealGroup = (selector: string) => {
          const els = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
          if (!els.length) return;
          gsap.set(els, { y: 26, autoAlpha: 0 });
          ScrollTrigger.batch(els, {
            start: "top 88%",
            once: true,
            onEnter: (batch) =>
              gsap.to(batch, { y: 0, autoAlpha: 1, duration: 0.6, stagger: 0.07, ease: "power3.out", overwrite: true }),
          });
        };
        revealGroup(".mode");
        revealGroup(".feat-card");
        // .founder-half has its own bespoke translateX slide-in (founders-split
        // is-revealed) — don't double-animate it here or the halves go off-centre.

        // ─── Hero "Talk with us" card → navbar "Send a message" merge ───
        // The nav CTA stays hidden while the hero is in view (so About/Portfolio
        // sit flush right). The bottom-right hero card scrolls up under the fixed
        // navbar and dissolves; right then the CTA "extends" into the bar — so the
        // card reads as merging up into the navbar, pushing the links left.
        const navEl = document.querySelector("nav.top");
        const heroEl = document.querySelector(".hero");
        if (navEl && heroEl) {
          navEl.classList.add("merge-armed");
          const heroBook = document.querySelector(".hero-book");
          if (heroBook) {
            gsap.to(heroBook, {
              scale: 0.32,
              autoAlpha: 0,
              ease: "none",
              transformOrigin: "top right",
              scrollTrigger: { trigger: heroEl, start: "top top", end: "bottom 22%", scrub: true },
            });
          }
          ScrollTrigger.create({
            trigger: heroEl,
            start: "bottom 24%",
            onEnter: () => navEl.classList.add("cta-in"),
            onLeaveBack: () => navEl.classList.remove("cta-in"),
          });
        }
      }

      // ─── Featured work — touch reveal ───
      // Pointer devices reveal each project's preview on :hover. Touch devices
      // (iPad Mini and up) have no hover, so the row crossing the viewport
      // centre becomes .is-active and shows its preview as you scroll.
      if (window.matchMedia("(hover: none)").matches) {
        const featRows = Array.from(document.querySelectorAll(".feat-row")) as HTMLElement[];
        if (featRows.length) {
          const featIO = new IntersectionObserver(
            (entries) => {
              for (const e of entries) {
                if (e.isIntersecting) {
                  featRows.forEach((r) => r.classList.toggle("is-active", r === e.target));
                }
              }
            },
            { rootMargin: "-48% 0px -48% 0px", threshold: 0 },
          );
          featRows.forEach((r) => featIO.observe(r));
          disposers.push(() => featIO.disconnect());
        }
      }

      // â”€â”€â”€ Magnetic â€” buttons that subtly follow the cursor â”€â”€â”€
      if (window.matchMedia("(hover: hover)").matches) {
        const initMagnetic = (selector: string, strength: number, release: number) => {
          (Array.from(document.querySelectorAll(selector)) as HTMLElement[]).forEach((el) => {
            const xTo = gsap.quickTo(el, "x", { duration: 0.4, ease: "power3.out" });
            const yTo = gsap.quickTo(el, "y", { duration: 0.4, ease: "power3.out" });
            const move = (e: MouseEvent) => {
              const r = el.getBoundingClientRect();
              xTo((e.clientX - (r.left + r.width / 2)) * strength);
              yTo((e.clientY - (r.top + r.height / 2)) * strength);
            };
            const leave = () => {
              gsap.to(el, { x: 0, y: 0, duration: release, ease: "elastic.out(1,0.4)" });
            };
            el.addEventListener("mousemove", move);
            el.addEventListener("mouseleave", leave);
            disposers.push(() => {
              el.removeEventListener("mousemove", move);
              el.removeEventListener("mouseleave", leave);
            });
          });
        };
        // Magnetic only on the hero ghost link. The primary CTA stays still
        // (the cursor-follow read as "shaking").
        initMagnetic(".btn-ghost", 0.2, 0.7);
      }

      disposers.push(() => ScrollTrigger.getAll().forEach((st) => st.kill()));
    })();

    return () => {
      cancelled = true;
      typeAbort.aborted = true;
      disposers.forEach((fn) => fn());
    };
  }, []);

  // â”€â”€â”€ Language-dependent imperative effects â”€â”€â”€
  // The section titles (word-by-word reveal) and the compose typewriter write to
  // the DOM directly, so React's text swap doesn't reach them. Re-run on `lang`
  // change so they render in the active language. The titles carry key={lang},
  // so React remounts them with fresh text before this effect re-splits them.
  useEffect(() => {
    const abort = { v: false };
    const triggers: Array<{ kill: () => void }> = [];

    // â”€â”€ Title split-reveal (needs GSAP) â”€â”€
    (async () => {
      const [{ default: gsap }, { default: ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (abort.v) return;
      gsap.registerPlugin(ScrollTrigger);
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      (Array.from(document.querySelectorAll("h2.section-title")) as HTMLElement[]).forEach((el) => {
        if (el.dataset.split) return;
        el.dataset.split = "1";
        el.setAttribute("aria-label", el.textContent || "");
        const spans: HTMLElement[] = [];
        const processNode = (src: Node, dest: Node) => {
          if (src.nodeType === Node.TEXT_NODE) {
            (src.textContent || "").split(/(\s+)/).forEach((piece) => {
              if (!piece) return;
              if (/^\s+$/.test(piece)) {
                dest.appendChild(document.createTextNode(piece));
                return;
              }
              const wrap = document.createElement("span");
              // padding-bottom + matching negative margin give descenders (g/y) room inside the
              // overflow:hidden reveal mask without shifting layout.
              wrap.style.cssText = "display:inline-block;overflow:hidden;vertical-align:top;white-space:nowrap;padding-bottom:0.15em;margin-bottom:-0.15em;";
              wrap.setAttribute("aria-hidden", "true");
              const inner = document.createElement("span");
              inner.style.cssText = "display:inline-block;";
              inner.textContent = piece;
              wrap.appendChild(inner);
              dest.appendChild(wrap);
              spans.push(inner);
            });
          } else if (src.nodeType === Node.ELEMENT_NODE) {
            const clone = (src as Element).cloneNode(false);
            Array.from(src.childNodes).forEach((c) => processNode(c, clone));
            dest.appendChild(clone);
          }
        };
        const frag = document.createDocumentFragment();
        Array.from(el.childNodes).forEach((c) => processNode(c, frag));
        el.innerHTML = "";
        el.appendChild(frag);
        if (reduce) return;
        gsap.set(spans, { yPercent: 120, autoAlpha: 0 });
        const st = ScrollTrigger.create({
          trigger: el,
          start: "top 82%",
          once: true,
          onEnter: () =>
            gsap.to(spans, { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.04, ease: "power3.out", overwrite: true }),
        });
        triggers.push(st);
      });
    })();

    // â”€â”€ Compose typewriter (types the draft email in the active language) â”€â”€
    const subjectEl = document.getElementById("compose-subject");
    const bodyEl = document.getElementById("compose-body");
    const statusEl = document.getElementById("compose-status");
    const contactSection = document.getElementById("contact");
    let obs: IntersectionObserver | null = null;

    if (subjectEl && bodyEl && contactSection) {
      // Clear any previously-typed (other-language) content immediately.
      subjectEl.innerHTML = "";
      bodyEl.innerHTML = "";
      const c = t.contact;
      const draft = { subject: c.draftSubject, body: c.draftBody };
      const escapeHTML = (s: string) =>
        s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const setHTML = (el: Element, text: string, withCaret = false) => {
        const html = text
          .split(/(<\/?hl>)/)
          .map((part) =>
            part === "<hl>" ? '<span class="hl">' : part === "</hl>" ? "</span>" : escapeHTML(part)
          )
          .join("");
        el.innerHTML = html + (withCaret ? '<span class="caret"></span>' : "");
      };
      const typeInto = async (el: Element, text: string, speed = 8) => {
        let out = "";
        for (let i = 0; i < text.length; i++) {
          if (abort.v) return;
          const rest = text.slice(i);
          if (rest.startsWith("<hl>")) { out += "<hl>"; i += 3; continue; }
          if (rest.startsWith("</hl>")) { out += "</hl>"; i += 4; continue; }
          out += text[i];
          setHTML(el, out, true);
          const ch = text[i];
          let delay = speed + Math.random() * 6;
          if (ch === "," || ch === ".") delay += 35;
          if (ch === " ") delay = speed * 0.5;
          await new Promise((r) => setTimeout(r, delay));
        }
        setHTML(el, out, true);
      };
      const start = async () => {
        if (statusEl) statusEl.textContent = c.statusDrafting;
        bodyEl.innerHTML = "";
        await typeInto(subjectEl, draft.subject, 9);
        if (abort.v) return;
        setHTML(subjectEl, draft.subject, false);
        for (let p = 0; p < draft.body.length; p++) {
          if (abort.v) return;
          const paragraph = draft.body[p];
          if (!paragraph) continue;
          const pEl = document.createElement("p");
          bodyEl.appendChild(pEl);
          if (p > 0) {
            const prev = bodyEl.children[p - 1];
            if (prev) prev.innerHTML = prev.innerHTML.replace(/<span class="caret"><\/span>/, "");
          }
          await typeInto(pEl, paragraph, 6);
          await new Promise((r) => setTimeout(r, 120));
        }
        if (statusEl && !abort.v) statusEl.textContent = c.statusReady;
      };
      obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting) { start(); obs?.disconnect(); }
          });
        },
        { threshold: 0.2 }
      );
      obs.observe(contactSection);
    }

    return () => {
      abort.v = true;
      triggers.forEach((st) => st.kill());
      obs?.disconnect();
    };
  }, [lang, t]);

  return (
    <>
      <Preloader />
      <div className="ds-atmosphere" aria-hidden="true" />

      <nav className="top">
        <div className="nav-inner">
          <a href="#top" className="nav-mark" aria-label={t.a11y.home}>
            <DS2Mark className="nav-mark-svg" />
          </a>
          <div className="nav-right">
            <ul className="nav-links">
              <li><Link className="nav-roll" href="/about"><span data-text={t.nav.about}>{t.nav.about}</span></Link></li>
              <li><Link className="nav-roll" href="/portfolio"><span data-text={t.nav.portfolio}>{t.nav.portfolio}</span></Link></li>
            </ul>
            <LangToggle />
            <span className="nav-merge">
              <ContactCTA size="sm" label={t.cta.send} onOpen={() => openChat(t.hero.book.draft)} />
            </span>
            <MobileMenu onContact={() => openChat()} />
          </div>
        </div>
      </nav>

      <a id="top" />

      {/* â”€â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="hero hero--glass" data-tint="color-mix(in oklab, var(--accent) 26%, transparent)">
        <HeroVideo />
        <div className="hero-glass__caption" aria-hidden="true">
          <div className="tagline">
            <span className="tagline-1">{t.hero.tag1}</span>
            <span className="tagline-2">{t.hero.tag2}</span>
          </div>
        </div>

        {/* Top-left: what we build */}
        <ul className="hero-tags" aria-label={t.hero.what}>
          {t.hero.tags.map((tag) => (
            <li key={tag}>
              <span className="hero-tags__slash" aria-hidden="true">/</span>
              {tag}
            </li>
          ))}
        </ul>

        {/* Bottom-right: book a call (opens the Telegram contact panel) */}
        <div className="hero-book">
          <div className="hero-book__avatar" aria-hidden="true">
            <DS2Mark />
          </div>
          <div className="hero-book__body">
            <div className="hero-book__title">{t.hero.book.title}</div>
            <button
              type="button"
              className="hero-book__cta"
              onClick={() => openChat(t.hero.book.draft)}
            >
              {t.hero.book.cta}
              <span className="hero-book__arrow" aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>

      {/* ─── Services — scroll-driven circle ─── */}
      <ServicesCircle onContact={() => openChat()} />

      {/* ─── Decision intelligence tools (for larger organisations) ───
          Temporarily hidden (Jun 2026): Dimitris wants the section redesigned
          before it ships on the landing page. /tools itself stays live. */}
      {SHOW_TOOLS_TEASER && (
      <section className="section ttease" id="tools" data-surface="ink">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">{t.toolsTeaser.eyebrow}</div>
            <h2 key={`tt-${lang}`} className="section-title">{t.toolsTeaser.title}<em>{t.toolsTeaser.titleEm}</em></h2>
            <p className="section-sub">{t.toolsTeaser.sub}</p>
          </div>
          <div className="ttease__grid">
            {t.tools.items.map((tool) => (
              <a key={tool.slug} className="ttease__card" href={`/tools/${tool.slug}`}>
                <span className="ttease__bg" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/tools/posters/${tool.slug}.webp`} alt="" loading="lazy" />
                </span>
                <span className="ttease__in">
                  <span className="ttease__head">
                    <span className="ttease__name">{tool.name}</span>
                    <span className="ttease__role">{tool.role}</span>
                  </span>
                  <span className="ttease__benefit">{tool.benefit}</span>
                  <span className="ttease__stats">
                    {tool.stats.slice(0, 2).map((st) => (
                      <span className="ttease__stat" key={st.label}>
                        <strong>{st.value}</strong> {st.label}
                      </span>
                    ))}
                  </span>
                </span>
              </a>
            ))}
          </div>
          <div className="feat-cta">
            <Link href="/tools" className="feat-viewall">{t.toolsTeaser.cta} &#8594;</Link>
          </div>
        </div>
      </section>
      )}

      {/* â”€â”€â”€ Powered by â€” the stack we build on (between Services & Featured) â”€â”€â”€â”€ */}
      <PoweredBy />

      {/* â”€â”€â”€ Featured work â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="section" id="featured" data-surface="ink aurora" data-tint="color-mix(in oklab, var(--hue-2) 18%, transparent)">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">{t.featured.eyebrow}</div>
            <h2 key={lang} className="section-title">{t.featured.title}<em>{t.featured.titleEm}</em></h2>
            <p className="section-sub">{t.featured.sub}</p>
          </div>
          <div className="feat-list">
            {t.featured.items.map((it) => (
              <a key={it.url} className="feat-row" href={it.url} target="_blank" rel="noopener noreferrer">
                <span className="feat-row__main">
                  <span className="feat-row__name">{it.name}</span>
                  <span className="feat-row__tag">{it.tag}</span>
                </span>
                <span className="feat-thumb" aria-hidden="true">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/portfolio/${it.img}.png`} alt="" loading="lazy" />
                </span>
                <span className="feat-row__arrow" aria-hidden="true">&#8599;</span>
              </a>
            ))}
          </div>
          <div className="feat-cta">
            <a href="/portfolio" className="feat-viewall">{t.featured.viewAll} &#8594;</a>
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ Thesis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <PortalJourney />

      {/* Engagement modes (consulting-only / build-only / end-to-end) were folded
          into the Services copy — clients pick one of three buyable categories. */}

      {/* â”€â”€â”€ Founders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {/* Founders / team section now lives on the About page. */}

      {/* â”€â”€â”€ Contact â€” macOS Mail compose â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="section" id="contact" data-surface="ink aurora" data-tint="color-mix(in oklab, var(--hue-2) 18%, transparent)">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">{t.contact.eyebrow}</div>
            <h2 key={lang} className="section-title">{t.contact.title}<em>{t.contact.titleEm}</em>{t.contact.titleEnd}</h2>
            <p className="section-sub">{t.contact.sub}</p>
          </div>
          <div className="compose-shell">
            <div className="compose-window">
              <div className="compose-titlebar">
                <div className="traffic-lights"><span /><span /><span /></div>
                <div className="compose-title">{t.contact.newMessage}</div>
                <div />
              </div>
              <div className="compose-toolbar">
                <div className="toolbar-btn" title={t.contact.tools.attach}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.5l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8L13.7 4.7a3.5 3.5 0 0 1 5 5L9.9 18.5a1.5 1.5 0 0 1-2.1-2.1L16 8.2"/></svg></div>
                <div className="toolbar-btn" title={t.contact.tools.format}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z"/></svg></div>
                <div className="toolbar-btn" title={t.contact.tools.image}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5L5 20"/></svg></div>
                <div className="toolbar-divider" />
                <div className="toolbar-btn" title={t.contact.tools.sign}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17c4-1 6-9 9-9s4 8 9 9"/><path d="M3 21h18"/></svg></div>
                <div className="toolbar-btn" title={t.contact.tools.stationery}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/></svg></div>
                <div style={{ flex: 1 }} />
                <div className="toolbar-btn" title={t.contact.tools.send}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg></div>
              </div>
              <div className="compose-headers">
                <div className="row">
                  <span className="label">{t.contact.from}</span>
                  <span className="value">you@yourcompany.com</span>
                </div>
                <div className="row">
                  <span className="label">{t.contact.to}</span>
                  <span className="value"><span className="pill">ds2consulting.contact@gmail.com</span></span>
                </div>
                <div className="row">
                  <span className="label">{t.contact.subject}</span>
                  <span className="value" id="compose-subject" />
                </div>
              </div>
              <div className="compose-body" id="compose-body" />
              <div className="compose-footer">
                <div className="compose-foot-meta">
                  <span className="dot" />
                  <span id="compose-status">{t.contact.statusDrafting}</span>
                </div>
                <div className="compose-actions">
                  <ContactCTA size="sm" label={t.cta.send} onOpen={() => openChat()} />
                </div>
              </div>
            </div>
            <div className="compose-caption">
              {t.contact.caption}
              <a href="mailto:ds2consulting.contact@gmail.com">ds2consulting.contact@gmail.com</a>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter onContact={() => openChat()} />

      <ContactPanel open={chatOpen} onClose={() => setChatOpen(false)} initialDraft={chatDraft} />
    </>
  );
}
