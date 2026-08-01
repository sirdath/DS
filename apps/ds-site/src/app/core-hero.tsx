"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useLang } from "./i18n";
import s from "./core-hero.module.css";

type Service = { n: string; g: string; b: string; w: string; r: string; img: string; pos?: string };

// Each service shows a real screenshot of something we've actually built:
// live client sites (portfolio/), our own products (tools/posters/), and
// ready-to-tailor concepts (templates/). `pos` crops the near-square card to
// the meaningful part of a wide screenshot.
const SERVICES: Service[] = [
  { n: "Websites", g: "BUILD", b: "Your public face, rebuilt to convert.", w: "A fast, on-brand marketing site that turns visitors into enquiries, and that you can update yourself.", r: "€2,500 – €7,000", img: "/portfolio/globalteamplans.webp", pos: "left center" },
  { n: "Web apps", g: "BUILD", b: "Logged-in products that hold up at scale.", w: "A product behind a login, with accounts, dashboards and real data, built to stay fast as you grow.", r: "€8,000 – €30,000", img: "/portfolio/nodebook.webp", pos: "right center" },
  { n: "SaaS products", g: "BUILD", b: "Subscription software, end to end.", w: "Subscription software from sign-up to billing, plus the infrastructure and admin behind it.", r: "€15,000 – €60,000+", img: "/portfolio/dataportfolio.webp", pos: "right center" },
  { n: "Web shops", g: "BUILD", b: "Storefronts that actually check out.", w: "An online store that actually sells: catalogue, cart, payments and order management, ready for real traffic.", r: "€4,000 – €15,000", img: "/templates/atelier.webp" },
  { n: "Platforms", g: "BUILD", b: "Multi-sided systems with real users.", w: "A system that connects different kinds of users, with the accounts, permissions and rails between them.", r: "€20,000 – €80,000+", img: "/portfolio/neurovault.webp" },
  { n: "Automation", g: "REWIRE", b: "The work behind the work, put on rails.", w: "The repetitive jobs your team does by hand, put on rails so they just happen, reliably.", r: "€3,000 – €15,000", img: "/tools/posters/competitor-watch.webp" },
  { n: "AI agents", g: "REWIRE", b: "Staff that never sleeps and never forgets.", w: "An AI worker that handles a real task on its own, day and night: answering, sorting, drafting, following up.", r: "€6,000 – €25,000", img: "/tools/posters/ai-receptionist.webp" },
  { n: "AI integration", g: "REWIRE", b: "Your existing stack, made to think.", w: "Your current tools and data wired into AI, so the stack you already use starts thinking for you.", r: "€4,000 – €20,000", img: "/tools/posters/review-intelligence.webp" },
  { n: "Data & predictions", g: "REWIRE", b: "Decisions before the quarter closes.", w: "Dashboards and forecasts built from your own numbers, so you decide before the quarter closes.", r: "€5,000 – €25,000", img: "/tools/posters/site-selection.webp", pos: "left center" },
  { n: "CRM systems", g: "BESPOKE", b: "Your pipeline, in exactly your shape.", w: "Your sales pipeline in exactly your shape: contacts, deals and follow-ups that fit how you actually work.", r: "€5,000 – €20,000", img: "/tools/posters/collections.webp" },
  { n: "Marketplaces", g: "BESPOKE", b: "Supply, demand and the rails between.", w: "Two sides of a market and the transactions between them, with trust, payments and payouts built in.", r: "€25,000 – €90,000+", img: "/portfolio/dreambug.webp", pos: "right center" },
  { n: "Booking systems", g: "BESPOKE", b: "Calendars that never double-book.", w: "Availability, calendars and payments that never double-book, for appointments, classes or rentals.", r: "€4,000 – €18,000", img: "/templates/padel.webp" },
];

const imgFor = (i: number) => SERVICES[i]?.img ?? "/portfolio/globalteamplans.webp";

const HEX_CLIP = "polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)";

export default function CoreHero() {
  const { lang } = useLang();

  const heroRef = useRef<HTMLDivElement>(null);
  const hexRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const winGroupRef = useRef<HTMLSpanElement>(null);
  const winNameRef = useRef<HTMLSpanElement>(null);
  const winWhatRef = useRef<HTMLDivElement>(null);
  const winRangeRef = useRef<HTMLSpanElement>(null);
  const winImgRef = useRef<HTMLImageElement>(null);
  const winThumbRefs = [useRef<HTMLImageElement>(null), useRef<HTMLImageElement>(null), useRef<HTMLImageElement>(null)];

  // deterministic hex field (SSR-safe) for the 1900x1220 layer
  const hexes = useMemo(() => {
    const W = 112, H = 130, VS = 96, COLS = 17, ROWS = 13;
    const out: { key: string; i: number; cx: number; cy: number; style: React.CSSProperties }[] = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        const h = ((i * 2654435761) % 1000) / 1000;
        const left = c * W + (r % 2 ? W / 2 : 0);
        const top = r * VS;
        const style: React.CSSProperties = {
          left: left + "px", top: top + "px", width: W - 6 + "px", height: H - 6 + "px",
          clipPath: HEX_CLIP, WebkitClipPath: HEX_CLIP,
        };
        if (h > 0.93) { style.background = "linear-gradient(160deg,#B8E0FF 0%,#2E7FD6 100%)"; style.boxShadow = "0 6px 0 rgba(0,0,0,.5)"; }
        else if (h > 0.86) { style.background = "linear-gradient(160deg,#2a2c30 0%,#14161a 100%)"; style.borderTop = "2px solid #8DCBFF"; }
        else if (h > 0.62) { style.background = "linear-gradient(160deg,#22242a 0%,#101216 100%)"; }
        else if (h > 0.34) { style.background = "linear-gradient(160deg,#191b20 0%,#0c0e12 100%)"; }
        else { style.background = "#0d0f13"; }
        out.push({ key: "h" + i, i, cx: left + (W - 6) / 2, cy: top + (H - 6) / 2, style });
      }
    }
    return out;
  }, []);

  useEffect(() => {
    const ring = ringRef.current, hero = heroRef.current, hex = hexRef.current;
    if (!ring || !hero || !hex) return;

    const cards = Array.from(ring.querySelectorAll<HTMLElement>("[data-i]"));
    const parts = cards.map((el) => ({
      el,
      name: el.querySelector<HTMLElement>("[data-name]"),
      blurb: el.querySelector<HTMLElement>("[data-blurb]"),
      grp: el.querySelector<HTMLElement>("[data-grp]"),
      foot: el.querySelector<HTMLElement>("[data-foot]"),
    }));
    const hexEls = Array.from(hex.querySelectorAll<HTMLElement>("[data-hx]"));
    const glow = hex.querySelector<HTMLElement>("[data-glow]");
    const N = SERVICES.length;
    let cur = 3, target = 3, lastTarget = 3, snapped = false;
    let dragging = false, dragX = 0, dragStart = 0, moved = false;
    let cardW = 258, gap = 198;
    const ptr = { x: -9999, y: -9999 };
    let px = -9999, py = -9999;
    let raf = 0, running = false;

    // shortest signed distance on a ring of N cards → seamless infinite loop
    const wrap = (x: number) => { const r = ((x % N) + N) % N; return r > N / 2 ? r - N : r; };

    const measure = () => {
      cardW = cards[0]?.offsetWidth || 258;
      const mobile = window.innerWidth < 640;
      gap = cardW * (mobile ? 0.9 : 0.767);
    };

    const litState: boolean[] = new Array(parts.length).fill(false);
    const blurbState: boolean[] = new Array(parts.length).fill(false);
    let firstPaint = true;

    // Cached rect + spatial grid: hover only visits the ~2 dozen hexes near the
    // cursor (not all 352), popping with compositor-only 2D transforms + one glow.
    let heroRect = hero.getBoundingClientRect();
    const refreshRect = () => { heroRect = hero.getBoundingClientRect(); };
    const CELL = 150;
    const gcols = Math.ceil(1900 / CELL) + 2;
    const grid = new Map<number, number[]>();
    for (let k = 0; k < hexes.length; k++) {
      const h = hexes[k]; if (!h) continue;
      const key = Math.floor(h.cx / CELL) + Math.floor(h.cy / CELL) * gcols;
      const b = grid.get(key); if (b) b.push(k); else grid.set(key, [k]);
    }
    let popped: number[] = [];
    const R = 135, R2 = R * R;
    const applyHex = () => {
      const cx = ptr.x - (heroRect.width - 1900) / 2;
      const cy = ptr.y - (heroRect.height - 1220) / 2;
      const bx = Math.floor(cx / CELL), by = Math.floor(cy / CELL);
      const next: number[] = [];
      for (let gy = by - 1; gy <= by + 1; gy++) {
        for (let gx = bx - 1; gx <= bx + 1; gx++) {
          const bucket = grid.get(gx + gy * gcols);
          if (!bucket) continue;
          for (let bi = 0; bi < bucket.length; bi++) {
            const k = bucket[bi]!;
            const hxi = hexes[k], el = hexEls[k];
            if (!hxi || !el) continue;
            const dx = hxi.cx - cx, dy = hxi.cy - cy;
            const d2 = dx * dx + dy * dy;
            if (d2 < R2) {
              const t = 1 - Math.sqrt(d2) / R;
              el.style.transform = `translate(${(-dx * t * 0.12).toFixed(1)}px,${(-t * t * 16 - dy * t * 0.12).toFixed(1)}px) scale(${(1 + t * 0.55).toFixed(3)})`;
              el.style.zIndex = String(40 + Math.round(t * 60));
              next.push(k);
            }
          }
        }
      }
      for (let i = 0; i < popped.length; i++) {
        const k = popped[i]!;
        if (next.indexOf(k) === -1) {
          const el = hexEls[k]; if (!el) continue;
          el.style.transform = "";
          el.style.zIndex = "";
        }
      }
      popped = next;
      if (glow) {
        if (ptr.x < -9000) { glow.style.opacity = "0"; }
        else { glow.style.opacity = "1"; glow.style.transform = `translate(${cx.toFixed(0)}px,${cy.toFixed(0)}px)`; }
      }
    };

    const updateCards = () => {
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        if (!p) continue;
        const el = p.el;
        const rel = wrap(i - cur), a = Math.abs(rel);
        const sc = Math.max(0.72, 1 - a * 0.07);
        el.style.transform =
          `translateX(${(rel * gap).toFixed(1)}px) translateY(${(Math.pow(a, 1.4) * 20).toFixed(1)}px) ` +
          `translateZ(${(-a * 60).toFixed(1)}px) rotateY(${(rel * -14).toFixed(2)}deg) scale(${sc.toFixed(3)})`;
        el.style.opacity = a > 3.6 ? "0" : Math.max(0.68, 1 - a * 0.085).toFixed(3);
        el.style.zIndex = String(100 - Math.round(a * 8));
        // Expensive paints (gradient, shadow, text colour) only on lit-state flip —
        // not every frame. Per-frame we touch only transform/opacity/zIndex (composited).
        const lit = 1 - a > 0.5;
        if (lit !== litState[i] || firstPaint) {
          litState[i] = lit;
          el.style.borderColor = lit ? "rgba(141,203,255,.85)" : "rgba(255,255,255,.16)";
          el.style.boxShadow = lit
            ? "0 26px 58px -22px rgba(141,203,255,.55), 0 18px 40px -24px rgba(0,0,0,.9)"
            : "0 16px 32px -20px rgba(0,0,0,.8)";
          if (p.foot) p.foot.style.background = lit
            ? "linear-gradient(to top,#9fd0ff 0%,rgba(159,208,255,.85) 44%,rgba(159,208,255,.16) 78%,rgba(159,208,255,0) 100%)"
            : "linear-gradient(to top,rgba(8,9,10,.94) 0%,rgba(8,9,10,.72) 52%,rgba(8,9,10,0) 100%)";
          if (p.name) p.name.style.color = lit ? "#08131f" : "#f4f3f0";
          if (p.blurb) p.blurb.style.color = lit ? "rgba(8,19,31,.8)" : "rgba(244,243,240,.82)";
          if (p.grp) { p.grp.style.color = lit ? "#08131f" : "#f4f3f0"; p.grp.style.background = lit ? "rgba(255,255,255,.55)" : "rgba(8,9,10,.66)"; p.grp.style.borderColor = lit ? "rgba(8,19,31,.28)" : "rgba(255,255,255,.18)"; }
        }
        const showBlurb = 1 - a > 0.72;
        if (p.blurb && (showBlurb !== blurbState[i] || firstPaint)) {
          blurbState[i] = showBlurb;
          p.blurb.style.opacity = showBlurb ? "1" : "0";
        }
      }
      firstPaint = false;
    };

    const step = () => {
      if (target !== lastTarget) { snapped = false; lastTarget = target; }
      const moving = Math.abs(target - cur) > 0.0006;
      if (moving) { cur += (target - cur) * 0.11; updateCards(); }
      else if (!snapped) { cur = target; updateCards(); snapped = true; }
      applyHex();
      const ptrMoved = Math.abs(ptr.x - px) > 0.5 || Math.abs(ptr.y - py) > 0.5;
      px = ptr.x; py = ptr.y;
      return moving || dragging || ptrMoved;
    };

    const tick = () => {
      const busy = step();
      if (busy) raf = requestAnimationFrame(tick);
      else running = false;
    };
    const wake = () => { if (!running) { running = true; raf = requestAnimationFrame(tick); } };

    // interactions
    const onHeroMove = (e: PointerEvent) => {
      ptr.x = e.clientX - heroRect.left; ptr.y = e.clientY - heroRect.top;
      wake();
    };
    const onHeroLeave = () => { ptr.x = -9999; ptr.y = -9999; wake(); };
    const onDown = (e: PointerEvent) => {
      if ((e.target as HTMLElement)?.closest?.("[data-view]")) return;
      e.preventDefault();
      dragging = true; moved = false; dragX = e.clientX; dragStart = target;
      try { ring.setPointerCapture(e.pointerId); } catch { /* ignore */ }
      wake();
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - dragX;
      if (Math.abs(dx) > 4) moved = true;
      target = dragStart - dx / (gap * 0.66);
      wake();
    };
    const onUp = () => { if (!dragging) return; dragging = false; target = Math.round(target); wake(); };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") { e.preventDefault(); target = Math.round(target) + 1; wake(); }
      if (e.key === "ArrowLeft") { e.preventDefault(); target = Math.round(target) - 1; wake(); }
    };
    const onResize = () => { measure(); refreshRect(); wake(); };
    const onScroll = () => { refreshRect(); };

    hero.addEventListener("pointermove", onHeroMove);
    hero.addEventListener("pointerleave", onHeroLeave);
    ring.addEventListener("pointerdown", onDown);
    ring.addEventListener("pointermove", onMove);
    ring.addEventListener("pointerup", onUp);
    ring.addEventListener("pointercancel", onUp);
    ring.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    // per-card click: centre (unless it was a drag) / view button opens the window
    const onRingClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement;
      const viewBtn = t.closest<HTMLElement>("[data-view]");
      if (viewBtn) { const c = viewBtn.closest<HTMLElement>("[data-i]"); if (c) openWin(+c.dataset.i!); return; }
      if (moved) return;
      const card = t.closest<HTMLElement>("[data-i]");
      if (card) { target = Math.round(target + wrap(+card.dataset.i! - target)); wake(); }
    };
    ring.addEventListener("click", onRingClick);

    // preview window
    function openWin(i: number) {
      const m = modalRef.current; if (!m) return;
      const sv = SERVICES[i]; if (!sv) return;
      const img = imgFor(i);
      if (winGroupRef.current) winGroupRef.current.textContent = sv.g;
      if (winNameRef.current) winNameRef.current.textContent = sv.n;
      if (winWhatRef.current) winWhatRef.current.textContent = sv.w;
      if (winRangeRef.current) winRangeRef.current.textContent = sv.r;
      if (winImgRef.current) { winImgRef.current.src = img; winImgRef.current.style.objectPosition = sv.pos ?? "center"; }
      winThumbRefs.forEach((r) => { if (r.current) r.current.src = img; });
      m.classList.add(s.modalOpen!);
    }
    const closeWin = () => modalRef.current?.classList.remove(s.modalOpen!);
    (hero as HTMLElement & { _closeWin?: () => void })._closeWin = closeWin;

    measure();
    step(); step();
    wake();

    return () => {
      hero.removeEventListener("pointermove", onHeroMove);
      hero.removeEventListener("pointerleave", onHeroLeave);
      ring.removeEventListener("pointerdown", onDown);
      ring.removeEventListener("pointermove", onMove);
      ring.removeEventListener("pointerup", onUp);
      ring.removeEventListener("pointercancel", onUp);
      ring.removeEventListener("keydown", onKey);
      ring.removeEventListener("click", onRingClick);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [hexes]);

  const closeFromBackdrop = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) heroRef.current && (heroRef.current as HTMLElement & { _closeWin?: () => void })._closeWin?.();
  };

  const L = lang === "el"
    ? { ctaTitle: "Πώς μπορούμε να βοηθήσουμε;", ctaSub: "2 ΛΕΠΤΑ · ΧΩΡΙΣ ΚΛΗΣΗ · ΑΠΑΝΤΗΣΗ ΑΥΘΗΜΕΡΟΝ" }
    : { ctaTitle: "How can we help?", ctaSub: "2 MINUTES · NO CALL · SAME-DAY REPLY" };

  return (
    <div className={s.hero} ref={heroRef}>
      <div className={s.hex} ref={hexRef}>
        {hexes.map((h) => (
          <div className={s.hexCell} key={h.key} data-hx={h.i} style={h.style} />
        ))}
        <div className={s.cursorGlow} data-glow />
      </div>
      <div className={s.gradTop} />
      <div className={s.gradSide} />

      <div className={s.center}>
        <div className={s.head}>
          <img className={s.wordmark} src="/hero-core/uploads/ds2-wordmark-outline-white.png" alt="DS2" />
          <h1 className={s.h1}>Digital Solutions <em>consulting</em></h1>
        </div>

        <div className={s.flow}>
          <div className={s.ring} ref={ringRef} tabIndex={0} aria-label="Services carousel">
            {SERVICES.map((sv, i) => (
              <div className={s.card} key={sv.n} data-i={i}>
                <img className={s.cardImg} src={imgFor(i)} alt={`${sv.n} example`} loading="lazy" draggable={false} style={sv.pos ? { objectPosition: sv.pos } : undefined} />
                <span className={s.cardGroup} data-grp>{sv.g}</span>
                <button className={s.cardView} data-view type="button" aria-label={`See ${sv.n} examples`} title="See examples">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
                <div className={s.cardFoot} data-foot>
                  <div className={s.cardName} data-name>{sv.n}</div>
                  <div className={s.cardBlurb} data-blurb>{sv.b}</div>
                </div>
              </div>
            ))}
          </div>
          <button className={`${s.nav} ${s.navPrev}`} type="button" aria-label="Previous service"
            onClick={() => ringRef.current?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft" }))}>‹</button>
          <button className={`${s.nav} ${s.navNext}`} type="button" aria-label="Next service"
            onClick={() => ringRef.current?.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight" }))}>›</button>
        </div>
      </div>

      <div className={s.bar}>
        <Link className={s.cta} href="/assistant">
          <span className={s.ctaSheen} />
          <span className={s.ctaMain}>
            <span className={s.ctaTitle}>{L.ctaTitle}</span>
            <span className={s.ctaSub}>{L.ctaSub}</span>
          </span>
          <span className={s.ctaArrow}>→</span>
        </Link>
      </div>

      <div className={s.modal} ref={modalRef} onClick={closeFromBackdrop}>
        <div className={s.win}>
          <div className={s.winHead}>
            <div className={s.winTitleWrap}>
              <span className={s.winGroup} ref={winGroupRef}>BUILD</span>
              <span className={s.winName} ref={winNameRef}>Web shops</span>
            </div>
            <button className={s.winClose} type="button" aria-label="Close preview"
              onClick={() => modalRef.current?.classList.remove(s.modalOpen!)}>✕</button>
          </div>
          <div className={s.winImg}><img ref={winImgRef} alt="example" src={imgFor(3)} /></div>
          <div className={s.winThumbs}>
            {winThumbRefs.map((r, k) => (
              <div className={s.winThumb} key={k}>
                <img ref={r} alt="" src={imgFor(3)} style={{ objectPosition: `${k * 50}% 50%` }} />
              </div>
            ))}
          </div>
          <div className={s.winFoot}>
            <div>
              <div className={s.winWhat} ref={winWhatRef}>{SERVICES[3]?.w}</div>
              <div className={s.winRangeRow}>
                <span className={s.winRangeLbl}>TYPICAL RANGE</span>
                <span className={s.winRange} ref={winRangeRef}>{SERVICES[3]?.r}</span>
              </div>
            </div>
            <Link className={s.winCta} href="/assistant">Start this project <span>→</span></Link>
          </div>
        </div>
      </div>
    </div>
  );
}
