"use client";
/* eslint-disable react/no-unescaped-entities */
import { useEffect, useState } from "react";
import ContactPanel, { ContactCTA } from "./contact-panel";
import { useT, useLang, LangToggle } from "./i18n";
import PoweredBy from "./powered-by";
import { DS2Mark } from "./ds2-mark";

export default function HomePage() {
  const [chatOpen, setChatOpen] = useState(false);
  const t = useT();
  const { lang } = useLang();

  useEffect(() => {
    let cancelled = false;
    const disposers: Array<() => void> = [];
    const typeAbort = { aborted: false };

    (async () => {
      const [{ default: gsap }, { default: ScrollTrigger }, { default: Lenis }, ogl] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
        import("lenis"),
        import("ogl"),
      ]);
      if (cancelled) return;

      gsap.registerPlugin(ScrollTrigger);

      // ─── Lenis smooth scroll ───
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

      // ─── OGL shader background — dark iridescent metal sheen ───
      const canvas = document.getElementById("shader-bg") as HTMLCanvasElement | null;
      const aura = document.querySelector(".hero-aura");
      if (canvas) {
        const { Renderer, Program, Mesh, Triangle } = ogl;
        const renderer = new Renderer({ canvas, alpha: false, dpr: Math.min(window.devicePixelRatio, 1.25) });
        const gl = renderer.gl;
        gl.clearColor(0.965, 0.965, 0.98, 1);
        const geometry = new Triangle(gl);
        const program = new Program(gl, {
          vertex: `
            attribute vec2 position;
            varying vec2 vUv;
            void main() {
              vUv = position * 0.5 + 0.5;
              gl_Position = vec4(position, 0.0, 1.0);
            }
          `,
          fragment: `
            precision highp float;
            varying vec2 vUv;
            uniform float uTime;
            uniform vec2 uMouse;
            uniform vec2 uRes;
            uniform vec3 uSmokeA;
            uniform vec3 uSmokeB;
            float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
            float noise(vec2 p) {
              vec2 i = floor(p), f = fract(p);
              float a = hash(i), b = hash(i + vec2(1,0)), c = hash(i + vec2(0,1)), d = hash(i + vec2(1,1));
              vec2 u = f*f*(3.0-2.0*f);
              return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
            }
            float fbm(vec2 p) {
              float v = 0.0, a = 0.5;
              for (int i = 0; i < 4; i++) {
                v += a * noise(p);
                p *= 2.0; a *= 0.5;
              }
              return v;
            }
            void main() {
              vec2 uv = vUv;
              vec2 p = uv * 2.0 - 1.0;
              p.x *= uRes.x / uRes.y;
              vec2 m = (uMouse * 2.0 - 1.0);
              m.x *= uRes.x / uRes.y;
              float dToM = length(p - m);
              vec2 flow = vec2(
                fbm(p * 0.8 + uTime * 0.03),
                fbm(p * 0.8 - uTime * 0.025 + 4.0)
              );
              float n = fbm(p * 1.2 + flow * 0.6 + uTime * 0.02);
              n += 0.1 * sin(dToM * 4.0 - uTime * 0.4) * exp(-dToM * 1.2);
              // Light base with a soft two-tone smoke (periwinkle ↔ rose) drifting through it.
              vec3 base = vec3(0.965, 0.965, 0.980);
              vec3 smokeA = uSmokeA;
              vec3 smokeB = uSmokeB;
              float hue = fbm(p * 0.5 - uTime * 0.015 + 9.0);
              vec3 smokeCol = mix(smokeA, smokeB, smoothstep(0.34, 0.74, hue));
              float smoke = smoothstep(0.28, 0.82, n);
              vec3 col = mix(base, smokeCol, smoke * 0.46);
              // gentle bloom toward the cursor
              col = mix(col, smokeA, 0.12 * exp(-dToM * 1.6));
              // fine grain
              float g = (hash(uv * uRes + uTime) - 0.5) * 0.015;
              col += g;
              // soft edge falloff toward the page background
              col = mix(base, col, 1.0 - 0.18 * length(uv - 0.5));
              gl_FragColor = vec4(col, 1.0);
            }
          `,
          uniforms: {
            uTime: { value: 0 },
            uMouse: { value: [0.5, 0.5] },
            uRes: { value: [1, 1] },
            uSmokeA: { value: [0.6, 0.565, 0.945] },
            uSmokeB: { value: [0.965, 0.745, 0.855] },
          },
        });
        // Smoke colours come from CSS (--smoke-a/--smoke-b) so the palette is
        // swappable in one place. Reload after changing them.
        const hexToRgb01 = (hex: string): [number, number, number] | null => {
          const h = hex.trim().replace("#", "");
          if (h.length !== 6) return null;
          const n = parseInt(h, 16);
          if (Number.isNaN(n)) return null;
          return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
        };
        const css = getComputedStyle(document.documentElement);
        const sa = hexToRgb01(css.getPropertyValue("--smoke-a"));
        const sb = hexToRgb01(css.getPropertyValue("--smoke-b"));
        if (sa) program.uniforms.uSmokeA.value = sa;
        if (sb) program.uniforms.uSmokeB.value = sb;
        // Live smoke recolour when the preview style switcher fires.
        const onSmoke = (e: Event) => {
          const d = (e as CustomEvent<{ a: string; b: string }>).detail;
          if (!d) return;
          const na = hexToRgb01(d.a);
          const nb = hexToRgb01(d.b);
          if (na) program.uniforms.uSmokeA.value = na;
          if (nb) program.uniforms.uSmokeB.value = nb;
        };
        window.addEventListener("ds2:smoke", onSmoke as EventListener);
        disposers.push(() => window.removeEventListener("ds2:smoke", onSmoke as EventListener));
        const mesh = new Mesh(gl, { geometry, program });
        const resize = () => {
          renderer.setSize(window.innerWidth, window.innerHeight);
          program.uniforms.uRes.value = [window.innerWidth, window.innerHeight];
        };
        window.addEventListener("resize", resize);
        resize();

        let mx = 0.5,
          my = 0.5,
          tx = 0.5,
          ty = 0.5;
        const onMove = (e: PointerEvent) => {
          tx = e.clientX / window.innerWidth;
          ty = 1.0 - e.clientY / window.innerHeight;
        };
        window.addEventListener("pointermove", onMove);

        let rafId = 0;
        let visible = true;
        let t0 = performance.now();
        let stoppedAt = 0;
        const loop = () => {
          const t = (performance.now() - t0) / 1000;
          mx += (tx - mx) * 0.05;
          my += (ty - my) * 0.05;
          program.uniforms.uTime.value = t;
          program.uniforms.uMouse.value = [mx, my];
          renderer.render({ scene: mesh });
          rafId = requestAnimationFrame(loop);
        };
        const startOGL = () => {
          if (rafId || !visible) return;
          if (stoppedAt) {
            t0 += performance.now() - stoppedAt;
            stoppedAt = 0;
          }
          rafId = requestAnimationFrame(loop);
        };
        const stopOGL = () => {
          if (!rafId) return;
          cancelAnimationFrame(rafId);
          rafId = 0;
          stoppedAt = performance.now();
        };
        loop();

        // Pause the WebGL loop (biggest cost) once the hero scrolls off-screen.
        const heroEl = document.querySelector(".hero");
        let heroObs: IntersectionObserver | null = null;
        if (heroEl && "IntersectionObserver" in window) {
          heroObs = new IntersectionObserver(
            (entries) => {
              entries.forEach((e) => {
                visible = e.isIntersecting;
                if (visible) {
                  startOGL();
                  aura?.classList.remove("paused");
                } else {
                  stopOGL();
                  aura?.classList.add("paused");
                }
              });
            },
            { rootMargin: "100px" }
          );
          heroObs.observe(heroEl);
        }
        const onVisibility = () => {
          if (document.hidden) {
            visible = false;
            stopOGL();
          } else {
            visible = true;
            startOGL();
          }
        };
        document.addEventListener("visibilitychange", onVisibility);

        disposers.push(() => {
          stopOGL();
          window.removeEventListener("resize", resize);
          window.removeEventListener("pointermove", onMove);
          document.removeEventListener("visibilitychange", onVisibility);
          heroObs?.disconnect();
        });
      }

      // ─── Hero aura — mouse-tracked gradient behind the wordmark ───
      const auraWrap = document.getElementById("hero-logo-wrap");
      if (auraWrap) {
        let atx = 50,
          aty = 50,
          acx = 50,
          acy = 50,
          araf = 0;
        const auraTick = () => {
          acx += (atx - acx) * 0.08;
          acy += (aty - acy) * 0.08;
          auraWrap.style.setProperty("--mx", acx.toFixed(1) + "%");
          auraWrap.style.setProperty("--my", acy.toFixed(1) + "%");
          if (Math.abs(atx - acx) > 0.05 || Math.abs(aty - acy) > 0.05) {
            araf = requestAnimationFrame(auraTick);
          } else {
            araf = 0;
          }
        };
        const onAuraMove = (e: PointerEvent) => {
          const r = auraWrap.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          atx = Math.max(-30, Math.min(130, px * 100));
          aty = Math.max(-30, Math.min(130, py * 100));
          if (!araf) araf = requestAnimationFrame(auraTick);
        };
        window.addEventListener("pointermove", onAuraMove);
        disposers.push(() => {
          window.removeEventListener("pointermove", onAuraMove);
          if (araf) cancelAnimationFrame(araf);
        });
      }

      // ─── Hero wordmark — draw-in; mode (filled/gradient/outline) set by the style switcher ───
      const heroLogo = document.getElementById("hero-logo");
      if (heroLogo) {
        const logoEl = heroLogo;
        const strokes = Array.from(logoEl.querySelectorAll<SVGPathElement>(".ltr"));
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let drawTimer: ReturnType<typeof setTimeout> | undefined;
        const runLogo = (mode: string) => {
          clearTimeout(drawTimer);
          gsap.getTweensOf(strokes).forEach((t) => t.kill());
          logoEl.classList.remove("drawn");
          if (reduceMotion || strokes.length === 0) {
            strokes.forEach((p) => gsap.set(p, { strokeDashoffset: 0, strokeOpacity: 1 }));
            if (mode !== "outline") logoEl.classList.add("drawn");
            return;
          }
          strokes.forEach((p, i) => {
            const len = p.getTotalLength();
            gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, strokeOpacity: 1 });
            gsap.to(p, { strokeDashoffset: 0, duration: 1.6, delay: 0.1 + i * 0.18, ease: "power2.inOut" });
          });
          if (mode !== "outline") {
            drawTimer = setTimeout(() => logoEl.classList.add("drawn"), 1900);
          }
        };
        runLogo(document.body.getAttribute("data-logo") || "filled");
        const onLogoStyle = (e: Event) =>
          runLogo((e as CustomEvent<{ mode: string }>).detail?.mode || "filled");
        window.addEventListener("ds2:logostyle", onLogoStyle as EventListener);
        disposers.push(() => {
          clearTimeout(drawTimer);
          window.removeEventListener("ds2:logostyle", onLogoStyle as EventListener);
        });
      }

      // ─── Hash links via Lenis ───
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

      // ─── Hero loaded safety ───
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

      // ─── Founders split-seam reveal ───
      const split = document.getElementById("founders-split");
      if (split) {
        ScrollTrigger.create({
          trigger: split,
          start: "top 80%",
          onEnter: () => split.classList.add("is-revealed"),
          onLeaveBack: () => split.classList.remove("is-revealed"),
        });
      }

      // ─── Services bento — staggered fade-up on scroll ───
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

      // ─── Magnetic — buttons that subtly follow the cursor ───
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

  // ─── Language-dependent imperative effects ───
  // The section titles (word-by-word reveal) and the compose typewriter write to
  // the DOM directly, so React's text swap doesn't reach them. Re-run on `lang`
  // change so they render in the active language. The titles carry key={lang},
  // so React remounts them with fresh text before this effect re-splits them.
  useEffect(() => {
    const abort = { v: false };
    const triggers: Array<{ kill: () => void }> = [];

    // ── Title split-reveal (needs GSAP) ──
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
              wrap.style.cssText = "display:inline-block;overflow:hidden;vertical-align:top;white-space:nowrap;";
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
        gsap.set(spans, { yPercent: 110, autoAlpha: 0 });
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

    // ── Compose typewriter (types the draft email in the active language) ──
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
      <canvas id="shader-bg" />

      <nav className="top">
        <div className="nav-inner">
          <a href="#top" className="nav-mark" aria-label="DS2 — home">
            <DS2Mark className="nav-mark-svg" />
          </a>
          <div className="nav-right">
            <ul className="nav-links">
              <li><a href="/portfolio">{t.nav.portfolio}</a></li>
              <li><a href="/about">{t.nav.about}</a></li>
            </ul>
            <LangToggle />
            <ContactCTA size="sm" label={t.cta.send} onOpen={() => setChatOpen(true)} />
          </div>
        </div>
      </nav>

      <a id="top" />

      {/* ─── Hero ────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-logo-wrap" id="hero-logo-wrap">
          <div className="hero-aura" />
          <svg
            className="logo logo-svg"
            id="hero-logo"
            viewBox="0 0 1136 285"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="DS2"
          >
            <defs>
              {/* Vertical gradient spanning each letter top→bottom (edge to edge):
                  light periwinkle at the top, deep violet at the bottom. */}
              <linearGradient id="dsgrad" gradientUnits="userSpaceOnUse" x1="0" y1="6" x2="0" y2="279">
                <stop className="g-top" offset="0" stopColor="#B4A4F4" />
                <stop className="g-mid" offset="0.5" stopColor="#6D5DD3" />
                <stop className="g-bot" offset="1" stopColor="#3A2B86" />
              </linearGradient>
            </defs>
            <path className="ltr l0" d="M 18 10 L 25 10 L 32 10 L 39 10 L 46 10 L 53 10 L 60 10 L 67 10 L 74 10 L 81 10 L 88 10 L 95 10 L 102 10 L 109 10 L 116 10 L 123 10 L 130 10 L 137 10 L 144 10 L 151 10 L 158 10 L 165 10 L 172 10 L 179 10 L 186 10 L 193 10 L 200 10 L 207 10 L 214 10 L 221 10 L 228 10 L 235 10 L 242 10 L 249 10 L 256 10 L 263 10 L 270 10 L 277 10 L 284 10 L 291 11 L 298 12 L 305 14 L 312 16 L 319 19 L 326 23 L 333 28 L 340 33 L 347 40 L 353 47 L 358 54 L 362 61 L 366 68 L 368 75 L 371 82 L 373 89 L 374 96 L 375 103 L 375 110 L 375 117 L 375 124 L 375 131 L 375 138 L 375 145 L 375 152 L 375 159 L 375 166 L 375 173 L 375 180 L 374 187 L 373 194 L 371 201 L 369 208 L 367 215 L 363 222 L 359 229 L 354 236 L 348 243 L 341 250 L 334 255 L 327 260 L 320 264 L 313 267 L 306 269 L 299 271 L 292 272 L 285 273 L 278 273 L 271 273 L 264 273 L 257 273 L 250 273 L 243 273 L 236 273 L 229 273 L 222 273 L 215 273 L 208 273 L 201 273 L 194 273 L 187 273 L 180 273 L 173 273 L 166 273 L 159 273 L 152 273 L 145 273 L 138 273 L 131 273 L 124 273 L 117 273 L 110 273 L 103 273 L 96 273 L 89 273 L 82 273 L 75 273 L 68 273 L 61 273 L 54 273 L 47 273 L 40 273 L 33 273 L 26 273 L 19 273 L 12 269 L 10 262 L 10 255 L 10 248 L 10 241 L 10 234 L 10 227 L 10 220 L 14 213 L 21 211 L 28 211 L 35 211 L 42 211 L 49 211 L 56 211 L 63 211 L 70 211 L 77 211 L 84 211 L 91 211 L 98 211 L 105 211 L 112 211 L 119 211 L 126 211 L 133 211 L 140 211 L 147 211 L 154 211 L 161 211 L 168 211 L 175 211 L 182 211 L 189 211 L 196 211 L 203 211 L 210 211 L 217 211 L 224 211 L 231 211 L 238 211 L 245 211 L 252 211 L 259 211 L 266 211 L 273 211 L 280 209 L 287 206 L 294 202 L 301 195 L 306 188 L 308 181 L 310 174 L 310 167 L 310 160 L 310 153 L 310 146 L 310 139 L 310 132 L 310 125 L 310 118 L 310 111 L 310 104 L 308 97 L 305 90 L 300 83 L 294 77 L 287 72 L 280 70 L 273 69 L 266 69 L 259 69 L 252 69 L 245 69 L 238 69 L 231 69 L 224 69 L 217 69 L 210 69 L 203 69 L 196 69 L 189 69 L 182 69 L 175 69 L 168 69 L 161 69 L 154 69 L 147 69 L 140 69 L 133 69 L 126 69 L 119 69 L 112 69 L 105 69 L 98 69 L 91 69 L 84 69 L 77 69 L 70 69 L 63 69 L 56 69 L 49 69 L 42 69 L 35 69 L 28 69 L 21 69 L 14 67 L 10 60 L 10 53 L 10 46 L 10 39 L 10 32 L 10 25 L 10 18 L 15 11 Z" />
            <path className="ltr l1" d="M 466 10 L 475 10 L 484 10 L 493 10 L 502 10 L 511 10 L 520 10 L 529 10 L 538 10 L 547 10 L 556 10 L 565 10 L 574 10 L 583 10 L 592 10 L 601 10 L 610 10 L 619 10 L 628 10 L 637 10 L 646 10 L 655 10 L 664 10 L 673 10 L 682 10 L 691 10 L 700 10 L 709 10 L 718 10 L 727 10 L 736 10 L 744 17 L 744 26 L 744 35 L 744 44 L 744 53 L 743 62 L 735 69 L 726 69 L 717 69 L 708 69 L 699 69 L 690 69 L 681 69 L 672 69 L 663 69 L 654 69 L 645 69 L 636 69 L 627 69 L 618 69 L 609 69 L 600 69 L 591 69 L 582 69 L 573 69 L 564 69 L 555 69 L 546 69 L 537 69 L 528 69 L 519 69 L 510 69 L 501 69 L 492 69 L 483 69 L 474 70 L 465 75 L 459 84 L 459 93 L 464 102 L 473 109 L 482 111 L 491 111 L 500 111 L 509 111 L 518 111 L 527 111 L 536 111 L 545 111 L 554 111 L 563 111 L 572 111 L 581 111 L 590 111 L 599 111 L 608 111 L 617 111 L 626 111 L 635 111 L 644 111 L 653 111 L 662 111 L 671 111 L 680 111 L 689 112 L 698 114 L 707 116 L 716 120 L 725 125 L 734 132 L 742 141 L 748 150 L 753 159 L 756 168 L 759 177 L 760 186 L 760 195 L 759 204 L 758 213 L 755 222 L 752 231 L 746 240 L 739 249 L 730 257 L 721 263 L 712 267 L 703 271 L 694 272 L 685 273 L 676 273 L 667 273 L 658 273 L 649 273 L 640 273 L 631 273 L 622 273 L 613 273 L 604 273 L 595 273 L 586 273 L 577 273 L 568 273 L 559 273 L 550 273 L 541 273 L 532 273 L 523 273 L 514 273 L 505 273 L 496 273 L 487 273 L 478 273 L 469 273 L 460 273 L 451 273 L 442 273 L 433 273 L 424 273 L 415 273 L 406 273 L 397 270 L 394 261 L 394 252 L 394 243 L 394 234 L 394 225 L 396 216 L 405 211 L 414 211 L 423 211 L 432 211 L 441 211 L 450 211 L 459 211 L 468 211 L 477 211 L 486 211 L 495 211 L 504 211 L 513 211 L 522 211 L 531 211 L 540 211 L 549 211 L 558 211 L 567 211 L 576 211 L 585 211 L 594 211 L 603 211 L 612 211 L 621 211 L 630 211 L 639 211 L 648 211 L 657 211 L 666 211 L 675 211 L 684 210 L 693 205 L 698 196 L 697 187 L 690 178 L 681 176 L 672 175 L 663 175 L 654 175 L 645 175 L 636 175 L 627 175 L 618 175 L 609 175 L 600 175 L 591 175 L 582 175 L 573 175 L 564 175 L 555 175 L 546 175 L 537 175 L 528 175 L 519 175 L 510 175 L 501 175 L 492 175 L 483 175 L 474 174 L 465 173 L 456 170 L 447 167 L 438 162 L 429 156 L 420 149 L 412 140 L 406 131 L 401 122 L 398 113 L 396 104 L 394 95 L 394 86 L 395 77 L 396 68 L 399 59 L 404 50 L 410 41 L 418 32 L 427 25 L 436 19 L 445 15 L 454 12 L 463 11 Z" />
            <path className="ltr l2" d="M 800 10 L 809 10 L 818 10 L 827 10 L 836 10 L 845 10 L 854 10 L 863 10 L 872 10 L 881 10 L 890 10 L 899 10 L 908 10 L 917 10 L 926 10 L 935 10 L 944 10 L 953 10 L 962 10 L 971 10 L 980 10 L 989 10 L 998 10 L 1007 10 L 1016 10 L 1025 10 L 1034 10 L 1043 10 L 1052 10 L 1061 11 L 1070 13 L 1079 16 L 1088 20 L 1097 26 L 1106 34 L 1113 43 L 1119 52 L 1123 61 L 1126 70 L 1127 79 L 1128 88 L 1128 97 L 1127 106 L 1124 115 L 1121 124 L 1117 133 L 1112 142 L 1104 151 L 1095 159 L 1086 165 L 1077 169 L 1068 172 L 1059 174 L 1050 175 L 1041 175 L 1032 175 L 1023 175 L 1014 175 L 1005 175 L 996 175 L 987 175 L 978 175 L 969 175 L 960 175 L 951 175 L 942 175 L 933 175 L 924 175 L 915 175 L 906 175 L 897 175 L 888 175 L 879 175 L 870 175 L 861 176 L 852 182 L 845 191 L 841 200 L 838 209 L 846 211 L 855 211 L 864 211 L 873 211 L 882 211 L 891 211 L 900 211 L 909 211 L 918 211 L 927 211 L 936 211 L 945 211 L 954 211 L 963 211 L 972 211 L 981 211 L 990 211 L 999 211 L 1008 211 L 1017 211 L 1026 211 L 1035 211 L 1044 211 L 1053 211 L 1062 211 L 1071 211 L 1080 211 L 1089 211 L 1098 211 L 1107 211 L 1116 211 L 1125 215 L 1127 224 L 1127 233 L 1127 242 L 1127 251 L 1127 260 L 1125 269 L 1116 273 L 1107 273 L 1098 273 L 1089 273 L 1080 273 L 1071 273 L 1062 273 L 1053 273 L 1044 273 L 1035 273 L 1026 273 L 1017 273 L 1008 273 L 999 273 L 990 273 L 981 273 L 972 273 L 963 273 L 954 273 L 945 273 L 936 273 L 927 273 L 918 273 L 909 273 L 900 273 L 891 273 L 882 273 L 873 273 L 864 273 L 855 273 L 846 273 L 837 273 L 828 273 L 819 273 L 810 273 L 801 273 L 792 273 L 783 273 L 776 266 L 775 257 L 775 248 L 775 239 L 775 230 L 775 221 L 775 212 L 775 203 L 776 194 L 778 185 L 781 176 L 784 167 L 790 158 L 796 149 L 804 140 L 813 132 L 822 126 L 831 121 L 840 117 L 849 114 L 858 112 L 867 111 L 876 111 L 885 111 L 894 111 L 903 111 L 912 111 L 921 111 L 930 111 L 939 111 L 948 111 L 957 111 L 966 111 L 975 111 L 984 111 L 993 111 L 1002 111 L 1011 111 L 1020 111 L 1029 111 L 1038 111 L 1047 110 L 1056 107 L 1064 99 L 1066 90 L 1064 81 L 1056 73 L 1047 70 L 1038 69 L 1029 69 L 1020 69 L 1011 69 L 1002 69 L 993 69 L 984 69 L 975 69 L 966 69 L 957 69 L 948 69 L 939 69 L 930 69 L 921 69 L 912 69 L 903 69 L 894 69 L 885 69 L 876 69 L 867 69 L 858 69 L 849 69 L 840 69 L 831 69 L 822 69 L 813 69 L 804 69 L 795 66 L 792 57 L 792 48 L 792 39 L 792 30 L 792 21 L 796 12 Z" />
            <path className="ltr-fill fill-d" d="M 18 10 L 25 10 L 32 10 L 39 10 L 46 10 L 53 10 L 60 10 L 67 10 L 74 10 L 81 10 L 88 10 L 95 10 L 102 10 L 109 10 L 116 10 L 123 10 L 130 10 L 137 10 L 144 10 L 151 10 L 158 10 L 165 10 L 172 10 L 179 10 L 186 10 L 193 10 L 200 10 L 207 10 L 214 10 L 221 10 L 228 10 L 235 10 L 242 10 L 249 10 L 256 10 L 263 10 L 270 10 L 277 10 L 284 10 L 291 11 L 298 12 L 305 14 L 312 16 L 319 19 L 326 23 L 333 28 L 340 33 L 347 40 L 353 47 L 358 54 L 362 61 L 366 68 L 368 75 L 371 82 L 373 89 L 374 96 L 375 103 L 375 110 L 375 117 L 375 124 L 375 131 L 375 138 L 375 145 L 375 152 L 375 159 L 375 166 L 375 173 L 375 180 L 374 187 L 373 194 L 371 201 L 369 208 L 367 215 L 363 222 L 359 229 L 354 236 L 348 243 L 341 250 L 334 255 L 327 260 L 320 264 L 313 267 L 306 269 L 299 271 L 292 272 L 285 273 L 278 273 L 271 273 L 264 273 L 257 273 L 250 273 L 243 273 L 236 273 L 229 273 L 222 273 L 215 273 L 208 273 L 201 273 L 194 273 L 187 273 L 180 273 L 173 273 L 166 273 L 159 273 L 152 273 L 145 273 L 138 273 L 131 273 L 124 273 L 117 273 L 110 273 L 103 273 L 96 273 L 89 273 L 82 273 L 75 273 L 68 273 L 61 273 L 54 273 L 47 273 L 40 273 L 33 273 L 26 273 L 19 273 L 12 269 L 10 262 L 10 255 L 10 248 L 10 241 L 10 234 L 10 227 L 10 220 L 14 213 L 21 211 L 28 211 L 35 211 L 42 211 L 49 211 L 56 211 L 63 211 L 70 211 L 77 211 L 84 211 L 91 211 L 98 211 L 105 211 L 112 211 L 119 211 L 126 211 L 133 211 L 140 211 L 147 211 L 154 211 L 161 211 L 168 211 L 175 211 L 182 211 L 189 211 L 196 211 L 203 211 L 210 211 L 217 211 L 224 211 L 231 211 L 238 211 L 245 211 L 252 211 L 259 211 L 266 211 L 273 211 L 280 209 L 287 206 L 294 202 L 301 195 L 306 188 L 308 181 L 310 174 L 310 167 L 310 160 L 310 153 L 310 146 L 310 139 L 310 132 L 310 125 L 310 118 L 310 111 L 310 104 L 308 97 L 305 90 L 300 83 L 294 77 L 287 72 L 280 70 L 273 69 L 266 69 L 259 69 L 252 69 L 245 69 L 238 69 L 231 69 L 224 69 L 217 69 L 210 69 L 203 69 L 196 69 L 189 69 L 182 69 L 175 69 L 168 69 L 161 69 L 154 69 L 147 69 L 140 69 L 133 69 L 126 69 L 119 69 L 112 69 L 105 69 L 98 69 L 91 69 L 84 69 L 77 69 L 70 69 L 63 69 L 56 69 L 49 69 L 42 69 L 35 69 L 28 69 L 21 69 L 14 67 L 10 60 L 10 53 L 10 46 L 10 39 L 10 32 L 10 25 L 10 18 L 15 11 Z" />
            <path className="ltr-fill fill-s" d="M 466 10 L 475 10 L 484 10 L 493 10 L 502 10 L 511 10 L 520 10 L 529 10 L 538 10 L 547 10 L 556 10 L 565 10 L 574 10 L 583 10 L 592 10 L 601 10 L 610 10 L 619 10 L 628 10 L 637 10 L 646 10 L 655 10 L 664 10 L 673 10 L 682 10 L 691 10 L 700 10 L 709 10 L 718 10 L 727 10 L 736 10 L 744 17 L 744 26 L 744 35 L 744 44 L 744 53 L 743 62 L 735 69 L 726 69 L 717 69 L 708 69 L 699 69 L 690 69 L 681 69 L 672 69 L 663 69 L 654 69 L 645 69 L 636 69 L 627 69 L 618 69 L 609 69 L 600 69 L 591 69 L 582 69 L 573 69 L 564 69 L 555 69 L 546 69 L 537 69 L 528 69 L 519 69 L 510 69 L 501 69 L 492 69 L 483 69 L 474 70 L 465 75 L 459 84 L 459 93 L 464 102 L 473 109 L 482 111 L 491 111 L 500 111 L 509 111 L 518 111 L 527 111 L 536 111 L 545 111 L 554 111 L 563 111 L 572 111 L 581 111 L 590 111 L 599 111 L 608 111 L 617 111 L 626 111 L 635 111 L 644 111 L 653 111 L 662 111 L 671 111 L 680 111 L 689 112 L 698 114 L 707 116 L 716 120 L 725 125 L 734 132 L 742 141 L 748 150 L 753 159 L 756 168 L 759 177 L 760 186 L 760 195 L 759 204 L 758 213 L 755 222 L 752 231 L 746 240 L 739 249 L 730 257 L 721 263 L 712 267 L 703 271 L 694 272 L 685 273 L 676 273 L 667 273 L 658 273 L 649 273 L 640 273 L 631 273 L 622 273 L 613 273 L 604 273 L 595 273 L 586 273 L 577 273 L 568 273 L 559 273 L 550 273 L 541 273 L 532 273 L 523 273 L 514 273 L 505 273 L 496 273 L 487 273 L 478 273 L 469 273 L 460 273 L 451 273 L 442 273 L 433 273 L 424 273 L 415 273 L 406 273 L 397 270 L 394 261 L 394 252 L 394 243 L 394 234 L 394 225 L 396 216 L 405 211 L 414 211 L 423 211 L 432 211 L 441 211 L 450 211 L 459 211 L 468 211 L 477 211 L 486 211 L 495 211 L 504 211 L 513 211 L 522 211 L 531 211 L 540 211 L 549 211 L 558 211 L 567 211 L 576 211 L 585 211 L 594 211 L 603 211 L 612 211 L 621 211 L 630 211 L 639 211 L 648 211 L 657 211 L 666 211 L 675 211 L 684 210 L 693 205 L 698 196 L 697 187 L 690 178 L 681 176 L 672 175 L 663 175 L 654 175 L 645 175 L 636 175 L 627 175 L 618 175 L 609 175 L 600 175 L 591 175 L 582 175 L 573 175 L 564 175 L 555 175 L 546 175 L 537 175 L 528 175 L 519 175 L 510 175 L 501 175 L 492 175 L 483 175 L 474 174 L 465 173 L 456 170 L 447 167 L 438 162 L 429 156 L 420 149 L 412 140 L 406 131 L 401 122 L 398 113 L 396 104 L 394 95 L 394 86 L 395 77 L 396 68 L 399 59 L 404 50 L 410 41 L 418 32 L 427 25 L 436 19 L 445 15 L 454 12 L 463 11 Z" />
            <path className="ltr-fill fill-2" d="M 800 10 L 809 10 L 818 10 L 827 10 L 836 10 L 845 10 L 854 10 L 863 10 L 872 10 L 881 10 L 890 10 L 899 10 L 908 10 L 917 10 L 926 10 L 935 10 L 944 10 L 953 10 L 962 10 L 971 10 L 980 10 L 989 10 L 998 10 L 1007 10 L 1016 10 L 1025 10 L 1034 10 L 1043 10 L 1052 10 L 1061 11 L 1070 13 L 1079 16 L 1088 20 L 1097 26 L 1106 34 L 1113 43 L 1119 52 L 1123 61 L 1126 70 L 1127 79 L 1128 88 L 1128 97 L 1127 106 L 1124 115 L 1121 124 L 1117 133 L 1112 142 L 1104 151 L 1095 159 L 1086 165 L 1077 169 L 1068 172 L 1059 174 L 1050 175 L 1041 175 L 1032 175 L 1023 175 L 1014 175 L 1005 175 L 996 175 L 987 175 L 978 175 L 969 175 L 960 175 L 951 175 L 942 175 L 933 175 L 924 175 L 915 175 L 906 175 L 897 175 L 888 175 L 879 175 L 870 175 L 861 176 L 852 182 L 845 191 L 841 200 L 838 209 L 846 211 L 855 211 L 864 211 L 873 211 L 882 211 L 891 211 L 900 211 L 909 211 L 918 211 L 927 211 L 936 211 L 945 211 L 954 211 L 963 211 L 972 211 L 981 211 L 990 211 L 999 211 L 1008 211 L 1017 211 L 1026 211 L 1035 211 L 1044 211 L 1053 211 L 1062 211 L 1071 211 L 1080 211 L 1089 211 L 1098 211 L 1107 211 L 1116 211 L 1125 215 L 1127 224 L 1127 233 L 1127 242 L 1127 251 L 1127 260 L 1125 269 L 1116 273 L 1107 273 L 1098 273 L 1089 273 L 1080 273 L 1071 273 L 1062 273 L 1053 273 L 1044 273 L 1035 273 L 1026 273 L 1017 273 L 1008 273 L 999 273 L 990 273 L 981 273 L 972 273 L 963 273 L 954 273 L 945 273 L 936 273 L 927 273 L 918 273 L 909 273 L 900 273 L 891 273 L 882 273 L 873 273 L 864 273 L 855 273 L 846 273 L 837 273 L 828 273 L 819 273 L 810 273 L 801 273 L 792 273 L 783 273 L 776 266 L 775 257 L 775 248 L 775 239 L 775 230 L 775 221 L 775 212 L 775 203 L 776 194 L 778 185 L 781 176 L 784 167 L 790 158 L 796 149 L 804 140 L 813 132 L 822 126 L 831 121 L 840 117 L 849 114 L 858 112 L 867 111 L 876 111 L 885 111 L 894 111 L 903 111 L 912 111 L 921 111 L 930 111 L 939 111 L 948 111 L 957 111 L 966 111 L 975 111 L 984 111 L 993 111 L 1002 111 L 1011 111 L 1020 111 L 1029 111 L 1038 111 L 1047 110 L 1056 107 L 1064 99 L 1066 90 L 1064 81 L 1056 73 L 1047 70 L 1038 69 L 1029 69 L 1020 69 L 1011 69 L 1002 69 L 993 69 L 984 69 L 975 69 L 966 69 L 957 69 L 948 69 L 939 69 L 930 69 L 921 69 L 912 69 L 903 69 L 894 69 L 885 69 L 876 69 L 867 69 L 858 69 L 849 69 L 840 69 L 831 69 L 822 69 L 813 69 L 804 69 L 795 66 L 792 57 L 792 48 L 792 39 L 792 30 L 792 21 L 796 12 Z" />
          </svg>
        </div>
        <div className="tagline">
          <div className="tagline-1">{t.hero.tag1}</div>
          <div className="tagline-2">{t.hero.tag2}</div>
        </div>
        <p className="hero-sub">{t.hero.sub}</p>
        <div className="cta-row">
          <ContactCTA label={t.cta.send} onOpen={() => setChatOpen(true)} />
          <a href="#services" className="btn btn-ghost">{t.hero.what}</a>
        </div>
      </section>

      {/* ─── Powered by — the stack we build on ──────── */}
      <PoweredBy />

      {/* ─── Services — index + sticky detail panel ──── */}
      <section className="section" id="services">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">{t.services.eyebrow}</div>
            <h2 key={lang} className="section-title">{t.services.title} <em>{t.services.titleEm}</em></h2>
            <p className="section-sub">{t.services.sub}</p>
          </div>
          <div className="svc-grid">
            <article className="svc-cell">
              <div className="svc-cell-top">
                <div className="svc-cell-icon"><svg viewBox="0 0 40 40" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="7" width="30" height="22" rx="2"/><path d="M5 13h30"/><circle cx="9" cy="10" r="0.7" fill="currentColor"/><circle cx="12" cy="10" r="0.7" fill="currentColor"/><path d="M14 33h12"/><path d="M20 29v4"/></svg></div>
                <span className="svc-cell-num">01</span>
              </div>
              <h3 className="svc-cell-name">{t.services.items[0].name}</h3>
              <p className="svc-cell-body">{t.services.items[0].body}</p>
            </article>

            <article className="svc-cell">
              <div className="svc-cell-top">
                <div className="svc-cell-icon"><svg viewBox="0 0 40 40" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 9h20a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4H17l-6 5v-5H7a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4z"/><circle cx="13" cy="17.5" r="1" fill="currentColor"/><circle cx="19" cy="17.5" r="1" fill="currentColor"/><circle cx="25" cy="17.5" r="1" fill="currentColor"/></svg></div>
                <span className="svc-cell-num">02</span>
              </div>
              <h3 className="svc-cell-name">{t.services.items[1].name}</h3>
              <p className="svc-cell-body">{t.services.items[1].body}</p>
            </article>

            <article className="svc-cell">
              <div className="svc-cell-top">
                <div className="svc-cell-icon"><svg viewBox="0 0 40 40" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="20" r="4"/><circle cx="8" cy="8" r="2.5"/><circle cx="32" cy="8" r="2.5"/><circle cx="8" cy="32" r="2.5"/><circle cx="32" cy="32" r="2.5"/><path d="M10 10l7 7M30 10l-7 7M10 30l7-7M30 30l-7-7"/></svg></div>
                <span className="svc-cell-num">03</span>
              </div>
              <h3 className="svc-cell-name">{t.services.items[2].name}</h3>
              <p className="svc-cell-body">{t.services.items[2].body}</p>
            </article>

            <article className="svc-cell">
              <div className="svc-cell-top">
                <div className="svc-cell-icon"><svg viewBox="0 0 40 40" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 33V20"/><path d="M13 33V14"/><path d="M21 33V8"/><path d="M29 33V17"/><path d="M5 33h32"/><circle cx="5" cy="20" r="1.4" fill="currentColor"/><circle cx="13" cy="14" r="1.4" fill="currentColor"/><circle cx="21" cy="8" r="1.4" fill="currentColor"/><circle cx="29" cy="17" r="1.4" fill="currentColor"/></svg></div>
                <span className="svc-cell-num">04</span>
              </div>
              <h3 className="svc-cell-name">{t.services.items[3].name}</h3>
              <p className="svc-cell-body">{t.services.items[3].body}</p>
            </article>

            <article className="svc-cell">
              <div className="svc-cell-top">
                <div className="svc-cell-icon"><svg viewBox="0 0 40 40" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="10" cy="10" rx="5" ry="2.5"/><path d="M5 10v6c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-6"/><path d="M5 16v6c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-6"/><path d="M15 18l5 4 5-4"/><path d="M20 22v-6"/><circle cx="30" cy="22" r="5"/><path d="M30 19v6M27 22h6"/></svg></div>
                <span className="svc-cell-num">05</span>
              </div>
              <h3 className="svc-cell-name">{t.services.items[4].name}</h3>
              <p className="svc-cell-body">{t.services.items[4].body}</p>
            </article>

            <article className="svc-cell">
              <div className="svc-cell-top">
                <div className="svc-cell-icon"><svg viewBox="0 0 40 40" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="12" y="4" width="16" height="32" rx="3"/><path d="M12 9h16"/><path d="M12 31h16"/><circle cx="20" cy="33.5" r="0.9" fill="currentColor"/></svg></div>
                <span className="svc-cell-num">06</span>
              </div>
              <h3 className="svc-cell-name">{t.services.items[5].name}</h3>
              <p className="svc-cell-body">{t.services.items[5].body}</p>
            </article>
          </div>
        </div>
      </section>

      {/* ─── Featured work ───────────────────────────── */}
      <section className="section" id="featured">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">{t.featured.eyebrow}</div>
            <h2 key={lang} className="section-title">{t.featured.title}<em>{t.featured.titleEm}</em></h2>
            <p className="section-sub">{t.featured.sub}</p>
          </div>
          <div className="feat-grid">
            {t.featured.items.map((it) => (
              <a key={it.url} className="feat-card" href={it.url} target="_blank" rel="noopener noreferrer">
                <div className="feat-media">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={`/portfolio/${it.img}.png`} alt={`${it.name} website`} />
                </div>
                <div className="feat-body">
                  <span className="feat-tag">{it.tag}</span>
                  <h3 className="feat-name">{it.name}</h3>
                  <p className="feat-blurb">{it.blurb}</p>
                  <span className="feat-link">{t.featured.visit} &#8599;</span>
                </div>
              </a>
            ))}
          </div>
          <div className="feat-cta">
            <a href="/portfolio" className="feat-viewall">{t.featured.viewAll} &#8594;</a>
          </div>
        </div>
      </section>

      {/* ─── Thesis ──────────────────────────────────── */}
      <section className="thesis-section" id="thesis">
        <figure className="thesis">
          <div className="thesis-eyebrow">{t.thesis.eyebrow}</div>
          <blockquote>{t.thesis.quote}<em>{t.thesis.quoteEm}</em>{t.thesis.quoteEnd}</blockquote>
          <figcaption>{t.thesis.by}</figcaption>
        </figure>
      </section>

      {/* ─── Engage ──────────────────────────────────── */}
      <section className="section" id="engage">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">{t.engage.eyebrow}</div>
            <h2 key={lang} className="section-title">{t.engage.title} <em>{t.engage.titleEm}</em></h2>
            <p className="section-sub">{t.engage.sub}</p>
          </div>
          <div className="modes">
            <article className="mode m1">
              <div className="mode-head">
                <div className="mode-head-text">
                  <div className="mode-num">{t.engage.modes[0].num}</div>
                  <h3>{t.engage.modes[0].title}</h3>
                  <div className="mode-best"><strong>{t.engage.modes[0].bestLabel}</strong>{t.engage.modes[0].best}</div>
                </div>
                <div className="mode-bigfig">01</div>
              </div>
              <p>{t.engage.modes[0].desc}</p>
              <div className="mode-stack">
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.strategy}</div><div className="stack-tag">{t.engage.tags.included}</div></div>
                <div className="stack-row"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.build}</div><div className="stack-tag">{t.engage.tags.none}</div></div>
                <div className="stack-row"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.handover}</div><div className="stack-tag">{t.engage.tags.none}</div></div>
                <div className="stack-row"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.stewardship}</div><div className="stack-tag">{t.engage.tags.addon}</div></div>
              </div>
            </article>

            <article className="mode m2">
              <div className="mode-head">
                <div className="mode-head-text">
                  <div className="mode-num">{t.engage.modes[1].num}</div>
                  <h3>{t.engage.modes[1].title}</h3>
                  <div className="mode-best"><strong>{t.engage.modes[1].bestLabel}</strong>{t.engage.modes[1].best}</div>
                </div>
                <div className="mode-bigfig">02</div>
              </div>
              <p>{t.engage.modes[1].desc}</p>
              <div className="mode-stack">
                <div className="stack-row"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.strategy}</div><div className="stack-tag">{t.engage.tags.none}</div></div>
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.build}</div><div className="stack-tag">{t.engage.tags.included}</div></div>
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.handover}</div><div className="stack-tag">{t.engage.tags.included}</div></div>
                <div className="stack-row"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.stewardship}</div><div className="stack-tag">{t.engage.tags.addon}</div></div>
              </div>
            </article>

            <article className="mode m3">
              <div className="mode-head">
                <div className="mode-head-text">
                  <div className="mode-num">{t.engage.modes[2].num}</div>
                  <h3>{t.engage.modes[2].title}</h3>
                  <div className="mode-best"><strong>{t.engage.modes[2].bestLabel}</strong>{t.engage.modes[2].best}</div>
                </div>
                <div className="mode-bigfig">03</div>
              </div>
              <p>{t.engage.modes[2].desc}</p>
              <div className="mode-stack">
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.strategy}</div><div className="stack-tag">{t.engage.tags.included}</div></div>
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.build}</div><div className="stack-tag">{t.engage.tags.included}</div></div>
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.handover}</div><div className="stack-tag">{t.engage.tags.included}</div></div>
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.stewardship}</div><div className="stack-tag">{t.engage.tags.included}</div></div>
              </div>
            </article>
          </div>
          <div className="stewardship">
            <span className="stewardship-tag">{t.engage.stewardshipTag}</span>
            <p><strong>{t.engage.stewardshipLead}</strong>{t.engage.stewardshipRest}</p>
          </div>
          <div className="engage-cta">
            <p>{t.engage.ctaText}</p>
            <ContactCTA label={t.cta.send} onOpen={() => setChatOpen(true)} />
          </div>
        </div>
      </section>

      {/* ─── Founders ────────────────────────────────── */}
      <section className="section" id="founders">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">{t.founders.eyebrow}</div>
            <h2 key={lang} className="section-title">{t.founders.title} <em>{t.founders.titleEm}</em></h2>
            <p className="section-sub">{t.founders.sub}</p>
          </div>
          <div className="founders-split" id="founders-split">
            <article className="founder-half left">
              <div className="photo" />
              <div className="founder-role">{t.founders.role}</div>
              <h3>{t.founders.f1Title}</h3>
              <p>{t.founders.f1Desc}</p>
              <div className="founder-loc">{t.founders.f1Loc}</div>
            </article>
            <article className="founder-half right">
              <div className="photo" />
              <div className="founder-role">{t.founders.role}</div>
              <h3>{t.founders.f2Title}</h3>
              <p>{t.founders.f2Desc}</p>
              <div className="founder-loc">{t.founders.f2Loc}</div>
            </article>
          </div>
          <div className="quote-band" style={{ marginTop: 56 }}>
            <blockquote>{t.founders.quote}</blockquote>
          </div>
        </div>
      </section>

      {/* ─── Contact — macOS Mail compose ────────────── */}
      <section className="section" id="contact">
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
                <div className="toolbar-btn" title="Attach"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.5l-8.5 8.5a5.5 5.5 0 0 1-7.8-7.8L13.7 4.7a3.5 3.5 0 0 1 5 5L9.9 18.5a1.5 1.5 0 0 1-2.1-2.1L16 8.2"/></svg></div>
                <div className="toolbar-btn" title="Format"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h8a4 4 0 0 1 0 8H6zM6 12h9a4 4 0 0 1 0 8H6z"/></svg></div>
                <div className="toolbar-btn" title="Image"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 15l-5-5L5 20"/></svg></div>
                <div className="toolbar-divider" />
                <div className="toolbar-btn" title="Sign"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M3 17c4-1 6-9 9-9s4 8 9 9"/><path d="M3 21h18"/></svg></div>
                <div className="toolbar-btn" title="Stationery"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 9h6M9 13h6M9 17h4"/></svg></div>
                <div style={{ flex: 1 }} />
                <div className="toolbar-btn" title="Send"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg></div>
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
                  <ContactCTA size="sm" label={t.cta.send} onOpen={() => setChatOpen(true)} />
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

      <footer>
        <div>{t.footer.copyright}</div>
        <ul className="links">
          <li><a href="#services">{t.footer.services}</a></li>
          <li><a href="/portfolio">{t.footer.portfolio}</a></li>
          <li><a href="/about">{t.footer.about}</a></li>
          <li><ContactCTA size="sm" label={t.cta.send} onOpen={() => setChatOpen(true)} /></li>
        </ul>
      </footer>

      <ContactPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
