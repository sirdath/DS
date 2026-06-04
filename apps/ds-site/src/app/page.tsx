"use client";
/* eslint-disable react/no-unescaped-entities */
import { useEffect, useState } from "react";
import ContactPanel, { ContactCTA } from "./contact-panel";
import { useT, useLang, LangToggle } from "./i18n";
import PoweredBy from "./powered-by";
import { DS2Mark } from "./ds2-mark";
import HeroGlassLogo from "./hero-glass-logo";

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

      // â”€â”€â”€ OGL shader background â€” dark iridescent metal sheen â”€â”€â”€
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
              // Light base with a soft two-tone smoke (periwinkle â†” rose) drifting through it.
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

      // â”€â”€â”€ Hero aura â€” mouse-tracked gradient behind the wordmark â”€â”€â”€
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

      // â”€â”€â”€ Hero wordmark â€” draw-in; mode (filled/gradient/outline/laser) set by the style switcher â”€â”€â”€
      const heroLogo = document.getElementById("hero-logo");
      if (heroLogo) {
        const logoEl = heroLogo;
        const strokes = Array.from(logoEl.querySelectorAll<SVGPathElement>(".ltr"));
        const beam = document.getElementById("laser-beam");
        const head = document.getElementById("laser-head");
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let drawTimer: ReturnType<typeof setTimeout> | undefined;
        let laserTl: gsap.core.Timeline | undefined;
        const hideLaserChrome = () => {
          if (beam) gsap.set(beam, { autoAlpha: 0 });
          if (head) gsap.set(head, { autoAlpha: 0 });
        };
        const runLogo = (mode: string) => {
          clearTimeout(drawTimer);
          laserTl?.kill();
          laserTl = undefined;
          gsap.getTweensOf(strokes).forEach((t) => t.kill());
          if (beam) gsap.getTweensOf(beam).forEach((t) => t.kill());
          if (head) gsap.getTweensOf(head).forEach((t) => t.kill());
          logoEl.classList.remove("drawn", "settled");
          hideLaserChrome();

          // â”€â”€ Laser: burn the outline on hot, then let it settle into a calm purple outline â”€â”€
          if (mode === "laser") {
            strokes.forEach((p) => {
              const len = p.getTotalLength();
              gsap.set(p, { strokeDasharray: len, strokeDashoffset: len, strokeOpacity: 1 });
            });
            if (reduceMotion || strokes.length === 0) {
              strokes.forEach((p) => gsap.set(p, { strokeDashoffset: 0 }));
              logoEl.classList.add("settled");
              return;
            }
            laserTl = gsap.timeline({ delay: 0.25 });
            strokes.forEach((p) => {
              const len = p.getTotalLength();
              const start = p.getPointAtLength(0);
              const st = { prog: 0 };
              laserTl!.to(st, {
                prog: 1,
                duration: 1.0,
                ease: "power2.inOut",
                onStart: () => {
                  if (head) { head.setAttribute("cx", String(start.x)); head.setAttribute("cy", String(start.y)); gsap.to(head, { autoAlpha: 1, duration: 0.18 }); }
                  if (beam) { beam.setAttribute("x2", String(start.x)); beam.setAttribute("y2", String(start.y)); gsap.to(beam, { autoAlpha: 1, duration: 0.18 }); }
                },
                onUpdate: () => {
                  const pt = p.getPointAtLength(st.prog * len);
                  p.style.strokeDashoffset = String(len * (1 - st.prog));
                  if (head) { head.setAttribute("cx", String(pt.x)); head.setAttribute("cy", String(pt.y)); }
                  if (beam) { beam.setAttribute("x2", String(pt.x)); beam.setAttribute("y2", String(pt.y)); }
                },
              });
            });
            if (beam && head) laserTl.to([beam, head], { autoAlpha: 0, duration: 0.5 }, ">0.1");
            laserTl.add(() => logoEl.classList.add("settled")); // CSS cools the hot stroke to a calm outline
            return;
          }

          // â”€â”€ Filled / gradient / outline: plain stroke draw-in (fill cross-fades in via .drawn) â”€â”€
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
          laserTl?.kill();
          window.removeEventListener("ds2:logostyle", onLogoStyle as EventListener);
        });
      }

      // â”€â”€â”€ Hash links via Lenis â”€â”€â”€
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
      <div className="ds-atmosphere" aria-hidden="true" />

      <nav className="top">
        <div className="nav-inner">
          <a href="#top" className="nav-mark" aria-label="DS2, home">
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

      {/* â”€â”€â”€ Hero â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="hero hero--glass" data-tint="color-mix(in oklab, var(--accent) 26%, transparent)">
        <HeroGlassLogo />
        <div className="hero-glass__caption" aria-hidden="true">
          <div className="tagline">
            <span className="tagline-1">{t.hero.tag1}</span>
            <span className="tagline-2">{t.hero.tag2}</span>
          </div>
        </div>
      </section>

      {/* â”€â”€â”€ Powered by â€” the stack we build on â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <PoweredBy />

      {/* â”€â”€â”€ Services â€” index + sticky detail panel â”€â”€â”€â”€ */}
      <section className="section" id="services" data-tint="color-mix(in oklab, var(--accent) 16%, transparent)">
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

      {/* â”€â”€â”€ Featured work â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="section" id="featured" data-surface="ink aurora" data-tint="color-mix(in oklab, var(--hue-2) 18%, transparent)">
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

      {/* â”€â”€â”€ Thesis â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="thesis-section" id="thesis" data-tint="color-mix(in oklab, var(--accent) 22%, transparent)">
        <figure className="thesis">
          <div className="thesis-eyebrow">{t.thesis.eyebrow}</div>
          <blockquote>{t.thesis.quote}<em>{t.thesis.quoteEm}</em>{t.thesis.quoteEnd}</blockquote>
          <figcaption>
            <span className="thesis-dash" aria-hidden="true">—</span>
            <DS2Mark className="thesis-mark" aria-label={t.thesis.by} />
          </figcaption>
        </figure>
      </section>

      {/* â”€â”€â”€ Engage â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="section" id="engage" data-tint="color-mix(in oklab, var(--hue-2) 16%, transparent)">
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
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.build}</div><div className="stack-tag">{t.engage.tags.included}</div></div>
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.handover}</div><div className="stack-tag">{t.engage.tags.included}</div></div>
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.stewardship}</div><div className="stack-tag">{t.engage.tags.included}</div></div>
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
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.strategy}</div><div className="stack-tag">{t.engage.tags.included}</div></div>
                <div className="stack-row"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.build}</div><div className="stack-tag">{t.engage.tags.none}</div></div>
                <div className="stack-row"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.handover}</div><div className="stack-tag">{t.engage.tags.none}</div></div>
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
                <div className="stack-row"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.strategy}</div><div className="stack-tag">{t.engage.tags.none}</div></div>
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.build}</div><div className="stack-tag">{t.engage.tags.included}</div></div>
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.handover}</div><div className="stack-tag">{t.engage.tags.included}</div></div>
                <div className="stack-row"><div className="stack-marker" /><div className="stack-label">{t.engage.rows.stewardship}</div><div className="stack-tag">{t.engage.tags.addon}</div></div>
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

      {/* â”€â”€â”€ Founders â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <section className="section" id="founders" data-tint="color-mix(in oklab, var(--accent) 14%, transparent)">
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
        </div>
      </section>

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

      <footer data-surface="ink">
        <div className="wrap footer-inner">
          <div className="footer-top">
            <div className="footer-brand">
              <DS2Mark className="footer-mark" />
              <p className="footer-tagline">{t.hero.tag1} {t.hero.tag2}</p>
              <p className="footer-loc">Athens · London</p>
            </div>
            <nav className="footer-nav" aria-label="Footer">
              <a href="#services">{t.footer.services}</a>
              <a href="/portfolio">{t.footer.portfolio}</a>
              <a href="/about">{t.footer.about}</a>
              <ContactCTA size="sm" label={t.cta.send} onOpen={() => setChatOpen(true)} />
            </nav>
          </div>
          <div className="footer-bottom">{t.footer.copyright}</div>
        </div>
      </footer>

      <ContactPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
