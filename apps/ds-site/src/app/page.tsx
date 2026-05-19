"use client";
/* eslint-disable react/no-unescaped-entities */
import Image from "next/image";
import { useEffect, useState } from "react";
import ContactPanel, { ContactCTA } from "./contact-panel";

export default function HomePage() {
  const [chatOpen, setChatOpen] = useState(false);

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
        gl.clearColor(0.039, 0.039, 0.039, 1);
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
              vec3 col = vec3(0.04 + n * 0.06);
              float sheen = smoothstep(0.55, 0.62, n) * 0.12;
              col += vec3(sheen);
              float g = (hash(uv * uRes + uTime) - 0.5) * 0.025;
              col += g;
              col *= 1.0 - 0.4 * length(uv - 0.5);
              gl_FragColor = vec4(col, 1.0);
            }
          `,
          uniforms: {
            uTime: { value: 0 },
            uMouse: { value: [0.5, 0.5] },
            uRes: { value: [1, 1] },
          },
        });
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

      // ─── How we work — proportional bar reveal ───
      const strip = document.querySelector("#how-strip .strip-bar");
      if (strip) {
        ScrollTrigger.create({
          trigger: strip,
          start: "top 85%",
          once: true,
          onEnter: () => strip.classList.add("in"),
        });
      }

      // ─── How we work — segment ↔ detail panel ───
      const howSegs = Array.from(document.querySelectorAll(".strip-seg")) as HTMLElement[];
      const howPanels = Array.from(document.querySelectorAll(".how-panel")) as HTMLElement[];
      if (howSegs.length && howPanels.length) {
        const activateHow = (id: string | undefined) => {
          if (!id) return;
          howSegs.forEach((s) => s.classList.toggle("active", s.dataset.phase === id));
          howPanels.forEach((p) => p.classList.toggle("active", p.dataset.phase === id));
        };
        howSegs.forEach((seg) => {
          const handler = () => activateHow(seg.dataset.phase);
          const onKey = (e: KeyboardEvent) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handler();
            }
          };
          seg.addEventListener("mouseenter", handler);
          seg.addEventListener("click", handler);
          seg.addEventListener("focus", handler);
          seg.addEventListener("keydown", onKey);
          disposers.push(() => {
            seg.removeEventListener("mouseenter", handler);
            seg.removeEventListener("click", handler);
            seg.removeEventListener("focus", handler);
            seg.removeEventListener("keydown", onKey);
          });
        });
      }

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

      // ─── Services — index ↔ detail panel ───
      const svcItems = Array.from(document.querySelectorAll(".svc-item")) as HTMLElement[];
      const svcPanels = Array.from(document.querySelectorAll(".svc-panel")) as HTMLElement[];
      if (svcItems.length) {
        const activate = (id: string | undefined) => {
          if (!id) return;
          svcItems.forEach((i) => i.classList.toggle("active", i.dataset.svc === id));
          svcPanels.forEach((p) => p.classList.toggle("active", p.dataset.svc === id));
        };
        svcItems.forEach((item) => {
          const handler = () => activate(item.dataset.svc);
          item.addEventListener("mouseenter", handler);
          item.addEventListener("click", handler);
          item.addEventListener("focus", handler);
          disposers.push(() => {
            item.removeEventListener("mouseenter", handler);
            item.removeEventListener("click", handler);
            item.removeEventListener("focus", handler);
          });
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
        // One unified CTA everywhere + the hero ghost link — GSAP magnetic.
        initMagnetic(".cta", 0.2, 0.65);
        initMagnetic(".btn-ghost", 0.2, 0.7);
      }

      // ─── SplitReveal — word-by-word title reveal on scroll ───
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
        gsap.set(spans, { yPercent: 110, autoAlpha: 0 });
        ScrollTrigger.create({
          trigger: el,
          start: "top 82%",
          once: true,
          onEnter: () =>
            gsap.to(spans, { yPercent: 0, autoAlpha: 1, duration: 0.7, stagger: 0.04, ease: "power3.out", overwrite: true }),
        });
      });

      disposers.push(() => ScrollTrigger.getAll().forEach((st) => st.kill()));

      // ─── Compose typewriter — types subject + body when contact in view ───
      const subjectEl = document.getElementById("compose-subject");
      const bodyEl = document.getElementById("compose-body");
      const statusEl = document.getElementById("compose-status");
      const contactSection = document.getElementById("contact");
      if (subjectEl && bodyEl && contactSection) {
        const draft = {
          subject: "Our website looks like it was built in 2014.",
          body: [
            "Hi DS2, we run a <hl>family-owned restaurant group</hl> with four locations around the city. Our current site is a template we haven't touched in years and it shows.",
            "We want something that actually looks <hl>premium</hl>, loads fast on a phone, with online bookings and menus we can keep updated ourselves.",
            "Could we grab 30 minutes next week to talk it through?",
          ],
        };
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
        }
        const typeInto = async (el: Element, text: string, speed = 8) => {
          let out = "";
          for (let i = 0; i < text.length; i++) {
            if (typeAbort.aborted) return;
            const rest = text.slice(i);
            if (rest.startsWith("<hl>")) {
              out += "<hl>";
              i += 3;
              continue;
            }
            if (rest.startsWith("</hl>")) {
              out += "</hl>";
              i += 4;
              continue;
            }
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
        let started = false;
        const start = async () => {
          if (started) return;
          started = true;
          if (statusEl) statusEl.textContent = "Drafting · Athens / London";
          bodyEl.innerHTML = "";
          await typeInto(subjectEl, draft.subject, 9);
          if (typeAbort.aborted) return;
          setHTML(subjectEl, draft.subject, false);
          for (let p = 0; p < draft.body.length; p++) {
            if (typeAbort.aborted) return;
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
          if (statusEl && !typeAbort.aborted) statusEl.textContent = "Ready to send · Athens / London";
        };
        const obs = new IntersectionObserver(
          (entries) => {
            entries.forEach((e) => {
              if (e.isIntersecting) {
                start();
                obs.disconnect();
              }
            });
          },
          { threshold: 0.2 }
        );
        obs.observe(contactSection);
        disposers.push(() => obs.disconnect());
      }
    })();

    return () => {
      cancelled = true;
      typeAbort.aborted = true;
      disposers.forEach((fn) => fn());
    };
  }, []);

  return (
    <>
      <canvas id="shader-bg" />

      <nav className="top">
        <div className="nav-inner">
          <a href="#top" className="nav-mark">
            <Image src="/logos/ds2-logo.png" alt="DS2" width={1136} height={285} priority style={{ height: 26, width: "auto", display: "block", opacity: 0.96 }} />
          </a>
          <div className="nav-right">
            <ul className="nav-links">
              <li><a href="/portfolio">Portfolio</a></li>
              <li><a href="/about">About</a></li>
            </ul>
            <ContactCTA size="sm" onOpen={() => setChatOpen(true)} />
          </div>
        </div>
      </nav>

      <a id="top" />

      {/* ─── Hero ────────────────────────────────────── */}
      <section className="hero">
        <div className="hero-logo-wrap" id="hero-logo-wrap">
          <div className="hero-aura" />
          <Image
            className="logo"
            src="/logos/ds2-logo.png"
            alt="DS2"
            width={1136}
            height={285}
            priority
            sizes="(min-width: 768px) 480px, 58vw"
          />
        </div>
        <div className="tagline">
          <div className="tagline-1">Digital Solutions</div>
          <div className="tagline-2">consulting</div>
        </div>
        <p className="hero-sub">
          A senior team for strategy, engineering, and applied AI. We work best when we can be honest early, even if that means challenging the initial idea.
        </p>
        <div className="cta-row">
          <ContactCTA onOpen={() => setChatOpen(true)} />
          <a href="#services" className="btn btn-ghost">What we do</a>
        </div>
      </section>

      {/* ─── Services — index + sticky detail panel ──── */}
      <section className="section" id="services">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Services</div>
            <h2 className="section-title">Six things we build, <em>and we build them seriously.</em></h2>
            <p className="section-sub">No menu padding. Each of these is something we'd take responsibility for end-to-end, or refuse the engagement.</p>
          </div>
          <div className="svc-split">
            <div className="svc-index" id="svc-index">
              <div className="svc-item active" data-svc="0" tabIndex={0}>
                <div className="svc-item-num">01</div>
                <div className="svc-item-name">Websites</div>
                <div className="svc-item-arrow" />
              </div>
              <div className="svc-item" data-svc="1" tabIndex={0}>
                <div className="svc-item-num">02</div>
                <div className="svc-item-name">Chatbots</div>
                <div className="svc-item-arrow" />
              </div>
              <div className="svc-item" data-svc="2" tabIndex={0}>
                <div className="svc-item-num">03</div>
                <div className="svc-item-name">AI agents</div>
                <div className="svc-item-arrow" />
              </div>
              <div className="svc-item" data-svc="3" tabIndex={0}>
                <div className="svc-item-num">04</div>
                <div className="svc-item-name">Data solutions</div>
                <div className="svc-item-arrow" />
              </div>
              <div className="svc-item" data-svc="4" tabIndex={0}>
                <div className="svc-item-num">05</div>
                <div className="svc-item-name">ML pipelines</div>
                <div className="svc-item-arrow" />
              </div>
              <div className="svc-item" data-svc="5" tabIndex={0}>
                <div className="svc-item-num">06</div>
                <div className="svc-item-name">App development</div>
                <div className="svc-item-arrow" />
              </div>
            </div>
            <div className="svc-detail" id="svc-detail">
              <div className="svc-panel active" data-svc="0">
                <div className="svc-panel-eyebrow">01 · Websites</div>
                <div className="svc-panel-icon"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="5" y="7" width="30" height="22" rx="2"/><path d="M5 13h30"/><circle cx="9" cy="10" r="0.7" fill="currentColor"/><circle cx="12" cy="10" r="0.7" fill="currentColor"/><path d="M14 33h12"/><path d="M20 29v4"/></svg></div>
                <h3 className="svc-panel-title">Marketing and product sites in Next.js / React.</h3>
                <p className="svc-panel-body">Fast, accessible, on-brand, hosted on premium infrastructure. We don't build template sites with plugins glued together. We ship code we'd be willing to maintain ourselves.</p>
                <div className="svc-ship"><strong>Ships:</strong>&nbsp;Production site · design system · hosting &amp; analytics setup</div>
              </div>
              <div className="svc-panel" data-svc="1">
                <div className="svc-panel-eyebrow">02 · Chatbots</div>
                <div className="svc-panel-icon"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M7 9h20a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4H17l-6 5v-5H7a4 4 0 0 1-4-4v-9a4 4 0 0 1 4-4z"/><circle cx="13" cy="17.5" r="1" fill="currentColor"/><circle cx="19" cy="17.5" r="1" fill="currentColor"/><circle cx="25" cy="17.5" r="1" fill="currentColor"/></svg></div>
                <h3 className="svc-panel-title">Production LLM assistants, not toy demos.</h3>
                <p className="svc-panel-body">Grounded retrieval, prompt caching, session memory, cost tracking, a clear knowledge boundary. The kind of chatbot you can put in front of customers and not lose sleep over the bill or the answers.</p>
                <div className="svc-ship"><strong>Ships:</strong>&nbsp;Deployed assistant · evaluation harness · cost dashboard</div>
              </div>
              <div className="svc-panel" data-svc="2">
                <div className="svc-panel-eyebrow">03 · AI agents</div>
                <div className="svc-panel-icon"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="20" cy="20" r="4"/><circle cx="8" cy="8" r="2.5"/><circle cx="32" cy="8" r="2.5"/><circle cx="8" cy="32" r="2.5"/><circle cx="32" cy="32" r="2.5"/><path d="M10 10l7 7M30 10l-7 7M10 30l7-7M30 30l-7-7"/></svg></div>
                <h3 className="svc-panel-title">Multi-step autonomous workflows that actually finish.</h3>
                <p className="svc-panel-body">Research, outreach, analysis, internal automation. Built on the Claude Agent SDK with tool-use, retries, and observability already wired in, not bolted on after the demo lands.</p>
                <div className="svc-ship"><strong>Ships:</strong>&nbsp;Production agent · tool catalogue · run trace UI</div>
              </div>
              <div className="svc-panel" data-svc="3">
                <div className="svc-panel-eyebrow">04 · Data solutions</div>
                <div className="svc-panel-icon"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 33V20"/><path d="M13 33V14"/><path d="M21 33V8"/><path d="M29 33V17"/><path d="M5 33h32"/><circle cx="5" cy="20" r="1.4" fill="currentColor"/><circle cx="13" cy="14" r="1.4" fill="currentColor"/><circle cx="21" cy="8" r="1.4" fill="currentColor"/><circle cx="29" cy="17" r="1.4" fill="currentColor"/></svg></div>
                <h3 className="svc-panel-title">Bring us a dataset, we tell you what it actually says.</h3>
                <p className="svc-panel-body">Descriptive analytics, cohort analysis, dashboards, insight reports. One-off study or a recurring stream of insight. We own the analysis end-to-end and stand behind the conclusions.</p>
                <div className="svc-ship"><strong>Ships:</strong>&nbsp;Insight memo · dashboards · data quality audit</div>
              </div>
              <div className="svc-panel" data-svc="4">
                <div className="svc-panel-eyebrow">05 · ML pipelines</div>
                <div className="svc-panel-icon"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><ellipse cx="10" cy="10" rx="5" ry="2.5"/><path d="M5 10v6c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-6"/><path d="M5 16v6c0 1.4 2.2 2.5 5 2.5s5-1.1 5-2.5v-6"/><path d="M15 18l5 4 5-4"/><path d="M20 22v-6"/><circle cx="30" cy="22" r="5"/><path d="M30 19v6M27 22h6"/></svg></div>
                <h3 className="svc-panel-title">From raw data to served prediction.</h3>
                <p className="svc-panel-body">Model training, evaluation, monitoring, deployment. We build the pipeline, not the notebook. If it can't be retrained next quarter without us in the room, we haven't finished the job.</p>
                <div className="svc-ship"><strong>Ships:</strong>&nbsp;Training &amp; serving stack · drift monitoring · runbooks</div>
              </div>
              <div className="svc-panel" data-svc="5">
                <div className="svc-panel-eyebrow">06 · App development</div>
                <div className="svc-panel-icon"><svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><rect x="12" y="4" width="16" height="32" rx="3"/><path d="M12 9h16"/><path d="M12 31h16"/><circle cx="20" cy="33.5" r="0.9" fill="currentColor"/></svg></div>
                <h3 className="svc-panel-title">Native iOS and Android, cross-platform when it fits.</h3>
                <p className="svc-panel-body">We pick the stack the engagement actually needs, not the one with the busiest GitHub. The phone is a hard surface; the app should feel like it belongs there.</p>
                <div className="svc-ship"><strong>Ships:</strong>&nbsp;Shipped app · TestFlight / Play setup · CI for store releases</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── How we work — proportional duration bar ──── */}
      <section className="section" id="how">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">How we work</div>
            <h2 className="section-title">One week to plan. <em>The rest to build.</em></h2>
            <p className="section-sub">Discovery and framing happen together in week one. Decision in week two. Then we build until it's good.</p>
          </div>
          <div className="how-variant">
            <div className="how-strip" id="how-strip">
              <div className="strip-bar">
                <div className="strip-seg strip-discovery active" data-phase="0" role="button" tabIndex={0} aria-label="Discovery, week one" style={{ flex: 1 }}><span>Discovery</span><span className="seg-week">W1 · parallel</span></div>
                <div className="strip-seg strip-decide" data-phase="1" role="button" tabIndex={0} aria-label="Decide, week two" style={{ flex: 1 }}><span>Decide</span><span className="seg-week">W2</span></div>
                <div className="strip-seg strip-build" data-phase="2" role="button" tabIndex={0} aria-label="Build and deliver, week three onward" style={{ flex: 6 }}><span>Build &amp; deliver</span><span className="seg-week">W3+ &nbsp;→&nbsp; ◆ deliver</span></div>
              </div>
              <div className="strip-axis">
                <span>kickoff</span>
                <span>deliver →</span>
              </div>
            </div>
            <div className="how-detail" id="how-detail">
              <div className="how-panel active" data-phase="0">
                <div className="how-panel-eyebrow">W1 · Discovery</div>
                <p className="how-panel-what">We read the code, the data, the team and the decisions already in flight before we propose anything.</p>
                <p className="how-panel-why">So we can challenge the idea early, while changing direction is still cheap.</p>
              </div>
              <div className="how-panel" data-phase="1">
                <div className="how-panel-eyebrow">W2 · Decide</div>
                <p className="how-panel-what">We frame the risks and lay out the real options with the tradeoffs in your language, then decide on the evidence.</p>
                <p className="how-panel-why">If the call matters it goes to you to sign off, never as a done deal.</p>
              </div>
              <div className="how-panel" data-phase="2">
                <div className="how-panel-eyebrow">W3+ · Build &amp; deliver</div>
                <p className="how-panel-what">We build to quality and keep going until you'd recommend the result, not until the hours run out.</p>
                <p className="how-panel-why">The bar is yours, not ours. Projects end; responsibility doesn't.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Thesis ──────────────────────────────────── */}
      <section className="thesis-section" id="thesis">
        <figure className="thesis">
          <div className="thesis-eyebrow">A working principle</div>
          <blockquote>The biggest cost is <em>lack of knowledge</em>.</blockquote>
          <figcaption>— DS2</figcaption>
        </figure>
      </section>

      {/* ─── Engage ──────────────────────────────────── */}
      <section className="section" id="engage">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">How we engage</div>
            <h2 className="section-title">Three modes. <em>You pick one.</em></h2>
            <p className="section-sub">No bundles, no upsell. Each mode is its own contract, scoped to what you actually need.</p>
          </div>
          <div className="modes">
            <article className="mode m1">
              <div className="mode-head">
                <div className="mode-head-text">
                  <div className="mode-num">MODE 01</div>
                  <h3>Consulting only.</h3>
                  <div className="mode-best"><strong>Best for:</strong> teams who already build, but want a second pair of senior eyes.</div>
                </div>
                <div className="mode-bigfig">01</div>
              </div>
              <p>We pressure-test the plan, the architecture and the team, without writing a line of code.</p>
              <div className="mode-stack">
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">Strategy &amp; diagnostic</div><div className="stack-tag">included</div></div>
                <div className="stack-row"><div className="stack-marker" /><div className="stack-label">Build &amp; delivery</div><div className="stack-tag">—</div></div>
                <div className="stack-row"><div className="stack-marker" /><div className="stack-label">Handover docs</div><div className="stack-tag">—</div></div>
                <div className="stack-row"><div className="stack-marker" /><div className="stack-label">Stewardship</div><div className="stack-tag">add-on</div></div>
              </div>
              <div className="mode-foot">
                <ContactCTA size="sm" onOpen={() => setChatOpen(true)} />
              </div>
            </article>

            <article className="mode m2">
              <div className="mode-head">
                <div className="mode-head-text">
                  <div className="mode-num">MODE 02</div>
                  <h3>Build only.</h3>
                  <div className="mode-best"><strong>Best for:</strong> when the spec is clear and you need senior hands to ship it.</div>
                </div>
                <div className="mode-bigfig">02</div>
              </div>
              <p>You bring the spec. We ship it with senior engineers and weekly visibility, in code we'd maintain ourselves.</p>
              <div className="mode-stack">
                <div className="stack-row"><div className="stack-marker" /><div className="stack-label">Strategy &amp; diagnostic</div><div className="stack-tag">—</div></div>
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">Build &amp; delivery</div><div className="stack-tag">included</div></div>
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">Handover docs</div><div className="stack-tag">included</div></div>
                <div className="stack-row"><div className="stack-marker" /><div className="stack-label">Stewardship</div><div className="stack-tag">add-on</div></div>
              </div>
              <div className="mode-foot">
                <ContactCTA size="sm" onOpen={() => setChatOpen(true)} />
              </div>
            </article>

            <article className="mode m3">
              <div className="mode-head">
                <div className="mode-head-text">
                  <div className="mode-num">MODE 03</div>
                  <h3>End-to-end.</h3>
                  <div className="mode-best"><strong>Best for:</strong> early ideas, ambiguous problems, full accountability under one roof.</div>
                </div>
                <div className="mode-bigfig">03</div>
              </div>
              <p>Strategy, design, build and handoff under one roof. Where challenge-first pays back the most.</p>
              <div className="mode-stack">
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">Strategy &amp; diagnostic</div><div className="stack-tag">included</div></div>
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">Build &amp; delivery</div><div className="stack-tag">included</div></div>
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">Handover docs</div><div className="stack-tag">included</div></div>
                <div className="stack-row on"><div className="stack-marker" /><div className="stack-label">Stewardship</div><div className="stack-tag">included</div></div>
              </div>
              <div className="mode-foot">
                <ContactCTA size="sm" onOpen={() => setChatOpen(true)} />
              </div>
            </article>
          </div>
          <div className="stewardship">
            <span className="stewardship-tag">Optional</span>
            <p><strong>Stewardship.</strong> A monthly retainer after delivery. We keep eyes on what we built. Patching, monitoring, and the occasional honest call when something's drifting.</p>
          </div>
        </div>
      </section>

      {/* ─── Founders ────────────────────────────────── */}
      <section className="section" id="founders">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Team</div>
            <h2 className="section-title">Two senior founders. <em>No layers in between.</em></h2>
            <p className="section-sub">When you talk to DS2, you talk to one of these two. That doesn't change as the engagement grows.</p>
          </div>
          <div className="founders-split" id="founders-split">
            <article className="founder-half left">
              <div className="photo" />
              <div className="founder-role">Founder</div>
              <h3>Head of Strategy &amp; Consulting.</h3>
              <p>Client relationships, commercial strategy, advisory. The person who asks the uncomfortable questions early, so they're not asked late by someone with less context.</p>
              <div className="founder-loc">Athens</div>
            </article>
            <article className="founder-half right">
              <div className="photo" />
              <div className="founder-role">Founder</div>
              <h3>Head of Engineering &amp; Data.</h3>
              <p>Architecture, data and ML, technical delivery. The person who decides whether what we're proposing will still be standing in three years, and says so before we ship it.</p>
              <div className="founder-loc">London</div>
            </article>
          </div>
          <div className="quote-band" style={{ marginTop: 56 }}>
            <blockquote>We don't certify your organisation. We take responsibility for what we build.</blockquote>
          </div>
        </div>
      </section>

      {/* ─── Contact — macOS Mail compose ────────────── */}
      <section className="section" id="contact">
        <div className="wrap">
          <div className="section-head">
            <div className="eyebrow">Contact</div>
            <h2 className="section-title">Tell us what you're <em>actually</em> trying to do.</h2>
            <p className="section-sub">Three lines is enough. We'll write back within the week, usually the same day.</p>
          </div>
          <div className="compose-shell">
            <div className="compose-window">
              <div className="compose-titlebar">
                <div className="traffic-lights"><span /><span /><span /></div>
                <div className="compose-title">New Message</div>
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
                  <span className="label">From:</span>
                  <span className="value">you@yourcompany.com</span>
                </div>
                <div className="row">
                  <span className="label">To:</span>
                  <span className="value"><span className="pill">hello@ds2-consulting.com</span></span>
                </div>
                <div className="row">
                  <span className="label">Subject:</span>
                  <span className="value" id="compose-subject" />
                </div>
              </div>
              <div className="compose-body" id="compose-body" />
              <div className="compose-footer">
                <div className="compose-foot-meta">
                  <span className="dot" />
                  <span id="compose-status">Drafting · Athens / London</span>
                </div>
                <div className="compose-actions">
                  <ContactCTA size="sm" onOpen={() => setChatOpen(true)} />
                </div>
              </div>
            </div>
            <div className="compose-caption">
              {"// Founded 2026. Taking on partners through Q4. Or just write us at "}
              <a href="mailto:hello@ds2-consulting.com">hello@ds2-consulting.com</a>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div>© 2026 DS2 — Digital Solutions Consulting · Athens · London</div>
        <ul className="links">
          <li><a href="#services">Services</a></li>
          <li><a href="/portfolio">Portfolio</a></li>
          <li><a href="/about">About</a></li>
          <li><ContactCTA size="sm" onOpen={() => setChatOpen(true)} /></li>
        </ul>
      </footer>

      <ContactPanel open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
