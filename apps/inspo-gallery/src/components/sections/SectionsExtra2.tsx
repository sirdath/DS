import { motion, useMotionValue, useSpring, useTransform, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import logoWhite from "@/assets/logo-white.png";
import logoOutline from "@/assets/logo-outline.png";

/* ============================================================
   16 — VORTEX  (gravitational lensing / singularity)
============================================================ */
const VortexPlane = ({ texUrl }: { texUrl: string }) => {
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { viewport, mouse } = useThree();
  const tex = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const t = loader.load(texUrl);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
    return t;
  }, [texUrl]);

  const uniforms = useMemo(
    () => ({
      uTex: { value: tex },
      uTime: { value: 0 },
      uMouse: { value: new THREE.Vector2(0, 0) },
      uAspect: { value: 1 },
    }),
    [tex]
  );

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime();
      matRef.current.uniforms.uMouse.value.lerp(new THREE.Vector2(mouse.x * 0.5, mouse.y * 0.5), 0.05);
      matRef.current.uniforms.uAspect.value = viewport.width / viewport.height;
    }
  });

  return (
    <mesh>
      <planeGeometry args={[viewport.width, viewport.height, 1, 1]} />
      <shaderMaterial
        ref={matRef}
        transparent
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          varying vec2 vUv;
          uniform sampler2D uTex;
          uniform float uTime;
          uniform vec2 uMouse;
          uniform float uAspect;

          void main() {
            vec2 c = vec2(0.5) + uMouse * 0.5;
            vec2 d = vUv - c;
            d.x *= uAspect;
            float r = length(d);
            float angle = atan(d.y, d.x);

            // gravitational swirl + lensing
            float swirl = 1.5 / (r * r + 0.05);
            angle += swirl * 0.04 + uTime * 0.4;
            float warp = 1.0 - exp(-r * 2.5);
            float nr = mix(r, warp * 0.45, 0.6);

            vec2 sampleUv = c + vec2(cos(angle), sin(angle)) * nr;
            sampleUv.x = (sampleUv.x - c.x) / uAspect + c.x;

            // logo aspect placement (square in center)
            vec2 logoUv = (sampleUv - 0.5) / 0.55 + 0.5;
            vec4 logo = vec4(0.0);
            if (logoUv.x > 0.0 && logoUv.x < 1.0 && logoUv.y > 0.0 && logoUv.y < 1.0) {
              logo = texture2D(uTex, logoUv);
            }

            // accretion disk glow
            float disk = exp(-pow(r * 6.0 - 1.5, 2.0)) * (0.6 + 0.4 * sin(angle * 8.0 + uTime * 3.0));
            vec3 hot = mix(vec3(1.0, 0.4, 0.0), vec3(1.0, 0.9, 0.6), disk);
            vec3 col = hot * disk;

            // event horizon
            float horizon = smoothstep(0.12, 0.08, r);
            col = mix(col, vec3(0.0), horizon);

            // logo on top, lensed
            col = mix(col, logo.rgb, logo.a * (1.0 - horizon));

            gl_FragColor = vec4(col, 1.0);
          }
        `}
      />
    </mesh>
  );
};

export const Section16 = () => {
  return (
    <section className="snap-section flex items-center justify-center bg-black">
      <div className="absolute inset-0">
        <Canvas orthographic camera={{ zoom: 100, position: [0, 0, 5] }} dpr={[1, 2]}>
          <VortexPlane texUrl={logoWhite} />
        </Canvas>
      </div>
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.7) 90%)" }} />
      <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.5em] text-muted-foreground">
        SINGULARITY — GRAV. LENSING
      </div>
      <div className="pointer-events-none absolute left-8 top-8 font-mono text-[10px] tracking-widest text-muted-foreground">
        EVENT.HORIZON r₀ = 0.10
      </div>
    </section>
  );
};

/* ============================================================
   17 — MORSE  (logo dissolves into pulsing morse-code orbits)
============================================================ */
const MORSE_MAP: Record<string, string> = {
  D: "-..", S: "...", "2": "..---",
};
const MORSE_SEQ = "DS2".split("").map((c) => MORSE_MAP[c]).join(" ");

export const Section17 = () => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let raf = 0;
    let last = performance.now();
    const loop = (t: number) => {
      if (t - last > 90) {
        setTick((p) => (p + 1) % MORSE_SEQ.length);
        last = t;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const symbol = MORSE_SEQ[tick];

  return (
    <section className="snap-section flex items-center justify-center" style={{ background: "radial-gradient(circle at 50% 50%, #001220 0%, #000508 70%)" }}>
      {/* Concentric orbits */}
      <svg className="absolute inset-0 h-full w-full" viewBox="-100 -100 200 200" preserveAspectRatio="xMidYMid meet">
        {[20, 32, 44, 56, 68, 80].map((r, i) => (
          <circle key={i} cx="0" cy="0" r={r} fill="none" stroke="hsl(180 100% 60% / 0.12)" strokeWidth="0.15" />
        ))}
        {/* Pulsing dots & dashes along orbits */}
        {[20, 32, 44, 56, 68, 80].map((r, ringIdx) => {
          const seq = MORSE_SEQ;
          const N = 28;
          return Array.from({ length: N }).map((_, i) => {
            const ch = seq[(i + tick + ringIdx * 3) % seq.length];
            const angle = (i / N) * Math.PI * 2 + ringIdx * 0.2;
            const x = Math.cos(angle) * r;
            const y = Math.sin(angle) * r;
            const active = ch !== " ";
            const dash = ch === "-";
            return (
              <g key={`${ringIdx}-${i}`} transform={`translate(${x}, ${y}) rotate(${(angle * 180) / Math.PI + 90})`}>
                {dash ? (
                  <rect x="-1.6" y="-0.4" width="3.2" height="0.8" fill={active ? "hsl(180 100% 70%)" : "hsl(180 100% 70% / 0.15)"}>
                    {active && <animate attributeName="opacity" values="1;0.3;1" dur="0.4s" repeatCount="1" />}
                  </rect>
                ) : (
                  <circle r={ch === "." ? 0.7 : 0.3} fill={active ? "hsl(60 100% 70%)" : "hsl(180 100% 70% / 0.15)"}>
                    {active && <animate attributeName="r" values="0.7;1.4;0.7" dur="0.4s" repeatCount="1" />}
                  </circle>
                )}
              </g>
            );
          });
        })}
      </svg>

      {/* Core logo */}
      <motion.div
        className="relative z-10"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 0.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <img
          src={logoWhite}
          alt="DS2"
          className="w-[min(28vw,260px)]"
          style={{ filter: `drop-shadow(0 0 ${symbol === " " ? 8 : 28}px hsl(180 100% 70%))` }}
        />
      </motion.div>

      {/* Morse readout */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 font-mono text-2xl tracking-[0.4em] text-foreground">
        {MORSE_SEQ.split("").map((c, i) => (
          <span key={i} className={i === tick ? "text-[hsl(60_100%_70%)]" : "text-foreground/40"}>
            {c === " " ? "·" : c}
          </span>
        ))}
      </div>
      <div className="pointer-events-none absolute bottom-12 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.5em] text-muted-foreground">
        BROADCAST: D S 2
      </div>
      <div className="pointer-events-none absolute left-8 top-8 font-mono text-[10px] tracking-widest text-muted-foreground">
        TX 90ms · 6 ORBITS
      </div>
    </section>
  );
};

/* ============================================================
   18 — TOPO  (topographic contour map flowing through the logo)
============================================================ */
export const Section18 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d")!;
    const dpr = Math.min(window.devicePixelRatio, 2);
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);

    // Pre-render logo to offscreen low-res canvas to use as a "height field"
    const img = new Image();
    img.src = logoWhite;
    let logoData: Uint8ClampedArray | null = null;
    let lw = 0, lh = 0;
    img.onload = () => {
      lw = 220;
      lh = Math.floor((img.height / img.width) * lw);
      const off = document.createElement("canvas");
      off.width = lw; off.height = lh;
      const octx = off.getContext("2d", { willReadFrequently: true })!;
      octx.drawImage(img, 0, 0, lw, lh);
      logoData = octx.getImageData(0, 0, lw, lh).data;
    };

    let raf = 0;
    let t = 0;
    const draw = () => {
      t += 0.012;
      ctx.fillStyle = "rgb(8, 12, 8)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (!logoData) {
        raf = requestAnimationFrame(draw);
        return;
      }
      const W = canvas.width;
      const H = canvas.height;
      // Place logo in center
      const scale = Math.min(W / lw, H / lh) * 0.7;
      const ox = (W - lw * scale) / 2;
      const oy = (H - lh * scale) / 2;

      // Height field function
      const heightAt = (px: number, py: number) => {
        // Sample logo
        const lx = Math.floor((px - ox) / scale);
        const ly = Math.floor((py - oy) / scale);
        let lum = 0;
        if (lx >= 0 && lx < lw && ly >= 0 && ly < lh) {
          const i = (ly * lw + lx) * 4;
          const a = logoData![i + 3] / 255;
          lum = ((logoData![i] + logoData![i + 1] + logoData![i + 2]) / 3 / 255) * a;
        }
        // Add slow noise for terrain feel
        const n = Math.sin(px * 0.008 + t) * Math.cos(py * 0.008 - t * 0.7) * 0.25
                + Math.sin(px * 0.02 - t * 0.5) * Math.cos(py * 0.018 + t * 0.3) * 0.12;
        return lum * 1.4 + n + 0.5;
      };

      // Marching-squares-ish: sample grid, draw contour lines via threshold transitions
      const STEP = 6 * dpr;
      const LEVELS = 14;
      ctx.lineWidth = 1 * dpr;

      for (let li = 0; li < LEVELS; li++) {
        const level = li / LEVELS * 1.6 + (Math.sin(t * 0.5 + li) * 0.04);
        const hue = 80 + li * 6;
        ctx.strokeStyle = `hsla(${hue}, 70%, ${40 + li * 3}%, ${0.35 + li * 0.04})`;
        ctx.beginPath();
        for (let y = 0; y < H; y += STEP) {
          for (let x = 0; x < W; x += STEP) {
            const a = heightAt(x, y);
            const b = heightAt(x + STEP, y);
            const c = heightAt(x + STEP, y + STEP);
            const d = heightAt(x, y + STEP);
            const idx = (a > level ? 1 : 0) | (b > level ? 2 : 0) | (c > level ? 4 : 0) | (d > level ? 8 : 0);
            if (idx === 0 || idx === 15) continue;
            // Simple: draw line across cell center based on case
            const cx = x + STEP / 2;
            const cy = y + STEP / 2;
            // Approximate edge crossings
            const top: [number, number] = [x + STEP / 2, y];
            const right: [number, number] = [x + STEP, y + STEP / 2];
            const bottom: [number, number] = [x + STEP / 2, y + STEP];
            const left: [number, number] = [x, y + STEP / 2];
            const cases: Record<number, [[number, number], [number, number]][]> = {
              1: [[left, bottom]], 2: [[bottom, right]], 3: [[left, right]],
              4: [[top, right]], 5: [[left, top], [bottom, right]], 6: [[top, bottom]],
              7: [[left, top]], 8: [[left, top]], 9: [[top, bottom]],
              10: [[left, bottom], [top, right]], 11: [[top, right]],
              12: [[left, right]], 13: [[bottom, right]], 14: [[left, bottom]],
            };
            const segs = cases[idx] || [];
            for (const seg of segs) {
              ctx.moveTo(seg[0][0], seg[0][1]);
              ctx.lineTo(seg[1][0], seg[1][1]);
            }
            void cx; void cy;
          }
        }
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section className="snap-section flex items-center justify-center" style={{ background: "#080c08" }}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)" }} />
      <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.5em] text-muted-foreground">
        TOPOGRAPHY — 14 ISOLINES
      </div>
      <div className="pointer-events-none absolute left-8 top-8 font-mono text-[10px] tracking-widest text-muted-foreground">
        ELEVATION SCAN · MARCHING □
      </div>
      <div className="pointer-events-none absolute right-8 bottom-32 font-mono text-[10px] tracking-widest text-muted-foreground">
        ▲ 1.60 ▽ 0.00
      </div>
    </section>
  );
};

/* ============================================================
   19 — HOLO  (holographic foil card with iridescent reflection)
============================================================ */
export const Section19 = () => {
  const cardRef = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const px = useMotionValue(50);
  const py = useMotionValue(50);
  const srx = useSpring(rx, { stiffness: 120, damping: 14 });
  const sry = useSpring(ry, { stiffness: 120, damping: 14 });

  const onMove = (e: React.MouseEvent) => {
    const r = cardRef.current!.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width;
    const y = (e.clientY - r.top) / r.height;
    ry.set((x - 0.5) * 30);
    rx.set(-(y - 0.5) * 30);
    px.set(x * 100);
    py.set(y * 100);
  };
  const onLeave = () => { rx.set(0); ry.set(0); };

  const fgX = useTransform(px, (v) => `${v}%`);
  const fgY = useTransform(py, (v) => `${v}%`);

  return (
    <section
      className="snap-section flex items-center justify-center"
      style={{ background: "linear-gradient(135deg, #0a0a14 0%, #1a0a28 100%)" }}
    >
      {/* Soft ambient light */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/4 top-1/3 h-96 w-96 rounded-full blur-3xl" style={{ background: "hsl(280 80% 40% / 0.25)" }} />
        <div className="absolute right-1/4 bottom-1/3 h-96 w-96 rounded-full blur-3xl" style={{ background: "hsl(180 80% 50% / 0.2)" }} />
      </div>

      <motion.div
        ref={cardRef}
        onMouseMove={onMove}
        onMouseLeave={onLeave}
        style={{
          rotateX: srx,
          rotateY: sry,
          transformPerspective: 1200,
          transformStyle: "preserve-3d",
        }}
        className="relative h-[min(75vh,520px)] w-[min(85vw,360px)] overflow-hidden rounded-3xl"
      >
        {/* Base card */}
        <div
          className="absolute inset-0 rounded-3xl"
          style={{
            background: "linear-gradient(135deg, #1a1a2a, #0a0a18)",
            boxShadow: "0 30px 80px -10px rgba(0,0,0,0.8), inset 0 1px 0 hsla(0,0%,100%,0.1)",
            border: "1px solid hsla(0,0%,100%,0.08)",
          }}
        />
        {/* Holographic foil layer */}
        <motion.div
          className="absolute inset-0 rounded-3xl mix-blend-color-dodge"
          style={{
            background: useTransform(
              [fgX, fgY],
              ([x, y]: string[]) =>
                `radial-gradient(circle at ${x} ${y}, hsla(180,100%,70%,0.9), hsla(280,100%,70%,0.6) 30%, hsla(60,100%,70%,0.5) 50%, hsla(320,100%,70%,0.4) 70%, transparent 90%)`
            ),
          }}
        />
        {/* Diffraction grating stripes */}
        <motion.div
          className="absolute inset-0 rounded-3xl opacity-40 mix-blend-overlay"
          style={{
            background:
              "repeating-linear-gradient(115deg, hsla(180,100%,70%,0.5) 0px, hsla(280,100%,70%,0.5) 2px, hsla(60,100%,70%,0.5) 4px, hsla(320,100%,70%,0.5) 6px, transparent 8px, transparent 14px)",
            x: useTransform(sry, (v) => v * 1.5),
          }}
        />
        {/* Logo */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 p-8" style={{ transform: "translateZ(40px)" }}>
          <motion.img
            src={logoWhite}
            alt="DS2"
            className="w-[55%]"
            style={{
              filter: "drop-shadow(0 8px 20px rgba(0,0,0,0.7))",
              transform: "translateZ(20px)",
            }}
          />
          <div className="flex w-full items-end justify-between font-mono text-[10px] tracking-widest text-foreground/70">
            <div>
              <div className="text-foreground/40">EDITION</div>
              <div>001 / 001</div>
            </div>
            <div className="text-right">
              <div className="text-foreground/40">FOIL</div>
              <div>HOLO·V1</div>
            </div>
          </div>
        </div>
        {/* Glare highlight */}
        <motion.div
          className="pointer-events-none absolute inset-0 rounded-3xl"
          style={{
            background: useTransform(
              [fgX, fgY],
              ([x, y]: string[]) => `radial-gradient(circle at ${x} ${y}, hsla(0,0%,100%,0.35), transparent 30%)`
            ),
          }}
        />
      </motion.div>

      <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.5em] text-muted-foreground">
        HOLOGRAPHIC FOIL — TILT TO SEE
      </div>
      <div className="pointer-events-none absolute left-8 top-8 font-mono text-[10px] tracking-widest text-muted-foreground">
        COLLECTOR.CARD #001
      </div>
    </section>
  );
};

/* ============================================================
   20 — SHATTER  (voronoi-fractured logo, click to explode)
============================================================ */
type Shard = {
  cx: number; cy: number;
  pts: [number, number][];
  // physics state
  x: number; y: number; vx: number; vy: number; rot: number; vrot: number;
};

// Build a deterministic voronoi-ish set of polygons inside the logo bounding box
const buildShards = (count: number): Shard[] => {
  const seeds: { x: number; y: number }[] = [];
  // Pseudo-random but stable
  let s = 1;
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };
  for (let i = 0; i < count; i++) seeds.push({ x: rand(), y: rand() });

  // Sample grid and assign each cell to nearest seed; build polygon as bounding rect of points (approx)
  const RES = 60;
  const buckets: [number, number][][] = seeds.map(() => []);
  for (let y = 0; y < RES; y++) {
    for (let x = 0; x < RES; x++) {
      const px = (x + 0.5) / RES;
      const py = (y + 0.5) / RES;
      let best = 0;
      let bd = Infinity;
      for (let i = 0; i < seeds.length; i++) {
        const dx = seeds[i].x - px;
        const dy = seeds[i].y - py;
        const d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = i; }
      }
      buckets[best].push([px, py]);
    }
  }

  // Convex hull (gift wrap) per bucket
  const hull = (pts: [number, number][]): [number, number][] => {
    if (pts.length < 3) return pts;
    const sorted = [...pts].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cross = (o: number[], a: number[], b: number[]) =>
      (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lower: [number, number][] = [];
    for (const p of sorted) {
      while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) lower.pop();
      lower.push(p);
    }
    const upper: [number, number][] = [];
    for (let i = sorted.length - 1; i >= 0; i--) {
      const p = sorted[i];
      while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) upper.pop();
      upper.push(p);
    }
    return lower.slice(0, -1).concat(upper.slice(0, -1));
  };

  return seeds.map((seed, i) => {
    const pts = hull(buckets[i]);
    return {
      cx: seed.x, cy: seed.y,
      pts: pts.length >= 3 ? pts : [[seed.x - 0.02, seed.y - 0.02], [seed.x + 0.02, seed.y - 0.02], [seed.x, seed.y + 0.02]],
      x: 0, y: 0, vx: 0, vy: 0, rot: 0, vrot: 0,
    };
  });
};

export const Section20 = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shards = useMemo(() => buildShards(40), []);
  const [boom, setBoom] = useState(0);
  const stateRef = useRef(shards.map((s) => ({ ...s })));
  const [, setTick] = useState(0);

  useEffect(() => {
    let raf = 0;
    const loop = () => {
      const st = stateRef.current;
      let any = false;
      for (const s of st) {
        if (Math.abs(s.x) + Math.abs(s.y) + Math.abs(s.vx) + Math.abs(s.vy) > 0.0005) {
          s.vx *= 0.94;
          s.vy *= 0.94;
          s.vy += 0.0006; // gravity
          s.x += s.vx;
          s.y += s.vy;
          s.rot += s.vrot;
          s.vrot *= 0.96;
          // settle back to origin softly when slow
          s.x *= 0.985;
          s.y *= 0.985;
          s.rot *= 0.985;
          any = true;
        } else {
          s.x = 0; s.y = 0; s.vx = 0; s.vy = 0; s.rot = 0; s.vrot = 0;
        }
      }
      if (any) setTick((t) => t + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  const explode = () => {
    setBoom((b) => b + 1);
    for (const s of stateRef.current) {
      const dx = s.cx - 0.5;
      const dy = s.cy - 0.5;
      const d = Math.sqrt(dx * dx + dy * dy) || 0.0001;
      const force = 0.04 + Math.random() * 0.05;
      s.vx = (dx / d) * force;
      s.vy = (dy / d) * force - 0.02;
      s.vrot = (Math.random() - 0.5) * 0.3;
    }
  };

  return (
    <section
      ref={containerRef}
      className="snap-section flex select-none items-center justify-center"
      style={{ background: "radial-gradient(ellipse at center, #1a0008 0%, #050000 80%)" }}
      onClick={explode}
    >
      {/* Cracks SVG overlay */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full opacity-20" viewBox="0 0 100 100" preserveAspectRatio="none">
        {Array.from({ length: 22 }).map((_, i) => {
          const a = (i / 22) * Math.PI * 2;
          const r1 = 15 + (i % 3) * 8;
          const r2 = 50 + (i % 5) * 6;
          return (
            <line key={i}
              x1={50 + Math.cos(a) * r1} y1={50 + Math.sin(a) * r1}
              x2={50 + Math.cos(a) * r2} y2={50 + Math.sin(a) * r2}
              stroke="hsl(0 80% 70%)" strokeWidth="0.1" />
          );
        })}
      </svg>

      <div className="relative h-[min(70vw,560px)] w-[min(70vw,560px)]" data-shatter-box>
        {stateRef.current.map((s, i) => {
          const minX = Math.min(...s.pts.map((p) => p[0]));
          const maxX = Math.max(...s.pts.map((p) => p[0]));
          const minY = Math.min(...s.pts.map((p) => p[1]));
          const maxY = Math.max(...s.pts.map((p) => p[1]));
          const w = (maxX - minX) * 100;
          const h = (maxY - minY) * 100;
          if (w <= 0 || h <= 0) return null;
          const polyPts = s.pts
            .map((p) => `${((p[0] - minX) / (maxX - minX)) * 100}% ${((p[1] - minY) / (maxY - minY)) * 100}%`)
            .join(", ");
          return (
            <div
              key={i}
              className="absolute"
              style={{
                left: `${minX * 100}%`,
                top: `${minY * 100}%`,
                width: `${w}%`,
                height: `${h}%`,
                clipPath: `polygon(${polyPts})`,
                transform: `translate(${s.x * 800}px, ${s.y * 800}px) rotate(${s.rot * 180}deg)`,
                transformOrigin: "center",
                filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.6))",
              }}
            >
              <img
                src={logoWhite}
                alt=""
                className="absolute"
                style={{
                  width: `${(1 / (maxX - minX)) * 100}%`,
                  height: `${(1 / (maxY - minY)) * 100}%`,
                  left: `${-minX / (maxX - minX) * 100}%`,
                  top: `${-minY / (maxY - minY) * 100}%`,
                  maxWidth: "none",
                }}
                draggable={false}
              />
              {/* Edge highlight */}
              <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, hsla(0,80%,70%,0.15), transparent 60%)" }} />
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {boom > 0 && (
          <motion.div
            key={boom}
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 8, opacity: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="pointer-events-none absolute h-32 w-32 rounded-full"
            style={{ background: "radial-gradient(circle, hsla(0,90%,70%,0.5), transparent 70%)" }}
          />
        )}
      </AnimatePresence>

      <div className="pointer-events-none absolute bottom-16 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.5em] text-muted-foreground">
        VORONOI.SHATTER — CLICK TO BREAK
      </div>
      <div className="pointer-events-none absolute right-8 top-8 font-mono text-[10px] tracking-widest text-muted-foreground">
        40 SHARDS · g = 0.06
      </div>
    </section>
  );
};
