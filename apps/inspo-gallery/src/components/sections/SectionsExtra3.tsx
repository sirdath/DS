import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef, useState, useMemo } from "react";
import logoWhite from "@/assets/logo-white.png";
import logoBlack from "@/assets/logo-black.png";
import logoOutline from "@/assets/logo-outline.png";

/* ============================================================
   21 — CONSTELLATION  (draw your own star map)
============================================================ */
export const Section21 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stars] = useState(() =>
    Array.from({ length: 90 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: Math.random() * 1.6 + 0.4,
      tw: Math.random() * Math.PI * 2,
    }))
  );
  const linksRef = useRef<Array<[number, number]>>([]);
  const hoverRef = useRef<number | null>(null);
  const lastRef = useRef<number | null>(null);

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    const resize = () => {
      c.width = c.clientWidth * devicePixelRatio;
      c.height = c.clientHeight * devicePixelRatio;
    };
    resize();
    window.addEventListener("resize", resize);

    const onMove = (e: MouseEvent) => {
      const rect = c.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width;
      const my = (e.clientY - rect.top) / rect.height;
      let best = -1, bd = 0.04;
      stars.forEach((s, i) => {
        const d = Math.hypot(s.x - mx, s.y - my);
        if (d < bd) { bd = d; best = i; }
      });
      hoverRef.current = best === -1 ? null : best;
    };
    const onClick = () => {
      const h = hoverRef.current;
      if (h === null) return;
      if (lastRef.current !== null && lastRef.current !== h) {
        linksRef.current.push([lastRef.current, h]);
      }
      lastRef.current = h;
    };
    const onLeave = () => { hoverRef.current = null; };

    c.addEventListener("mousemove", onMove);
    c.addEventListener("click", onClick);
    c.addEventListener("mouseleave", onLeave);

    const tick = (t: number) => {
      ctx.fillStyle = "rgba(2,4,12,0.35)";
      ctx.fillRect(0, 0, c.width, c.height);

      // links
      ctx.strokeStyle = "rgba(180,220,255,0.7)";
      ctx.lineWidth = 1 * devicePixelRatio;
      ctx.beginPath();
      linksRef.current.forEach(([a, b]) => {
        const sa = stars[a], sb = stars[b];
        ctx.moveTo(sa.x * c.width, sa.y * c.height);
        ctx.lineTo(sb.x * c.width, sb.y * c.height);
      });
      ctx.stroke();

      // preview link
      if (lastRef.current !== null && hoverRef.current !== null && lastRef.current !== hoverRef.current) {
        const sa = stars[lastRef.current], sb = stars[hoverRef.current];
        ctx.strokeStyle = "rgba(255,255,255,0.35)";
        ctx.setLineDash([4, 6]);
        ctx.beginPath();
        ctx.moveTo(sa.x * c.width, sa.y * c.height);
        ctx.lineTo(sb.x * c.width, sb.y * c.height);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // stars
      stars.forEach((s, i) => {
        const tw = 0.6 + Math.sin(t * 0.002 + s.tw) * 0.4;
        const isH = hoverRef.current === i || lastRef.current === i;
        const r = s.r * devicePixelRatio * (isH ? 3 : 1);
        const grad = ctx.createRadialGradient(s.x * c.width, s.y * c.height, 0, s.x * c.width, s.y * c.height, r * 6);
        grad.addColorStop(0, `rgba(255,255,255,${tw})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(s.x * c.width, s.y * c.height, r * 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = `rgba(255,255,255,${tw})`;
        ctx.beginPath();
        ctx.arc(s.x * c.width, s.y * c.height, r, 0, Math.PI * 2);
        ctx.fill();
      });

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      c.removeEventListener("mousemove", onMove);
      c.removeEventListener("click", onClick);
      c.removeEventListener("mouseleave", onLeave);
    };
  }, [stars]);

  return (
    <section className="snap-section relative overflow-hidden bg-[#02040c]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.img
          src={logoOutline}
          alt="DS2 constellation"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 0.9, scale: 1 }}
          viewport={{ once: false, amount: 0.5 }}
          transition={{ duration: 1.4 }}
          className="h-[42vmin] w-[42vmin] object-contain opacity-90 [filter:drop-shadow(0_0_30px_rgba(150,200,255,0.5))]"
        />
      </div>
      <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.4em] text-white/60">
        CLICK STARS TO DRAW THE SKY
      </div>
      <button
        onClick={() => { linksRef.current = []; lastRef.current = null; }}
        className="absolute right-6 top-24 rounded border border-white/20 px-3 py-1 font-mono text-[10px] tracking-widest text-white/70 hover:bg-white/10"
      >
        RESET
      </button>
    </section>
  );
};

/* ============================================================
   22 — FERRO  (ferrofluid metaballs reacting to cursor)
============================================================ */
export const Section22 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    let raf = 0;
    const resize = () => {
      c.width = c.clientWidth;
      c.height = c.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const balls = Array.from({ length: 14 }, () => ({
      x: Math.random() * c.width,
      y: Math.random() * c.height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      r: 60 + Math.random() * 80,
    }));

    const onMove = (e: MouseEvent) => {
      const rect = c.getBoundingClientRect();
      mouseRef.current.x = (e.clientX - rect.left) / rect.width;
      mouseRef.current.y = (e.clientY - rect.top) / rect.height;
    };
    c.addEventListener("mousemove", onMove);

    const tick = () => {
      const w = c.width, h = c.height;
      const mx = mouseRef.current.x * w;
      const my = mouseRef.current.y * h;

      balls.forEach((b) => {
        const dx = mx - b.x, dy = my - b.y;
        const d = Math.hypot(dx, dy) + 0.001;
        const f = Math.min(0.15, 6000 / (d * d));
        b.vx += (dx / d) * f;
        b.vy += (dy / d) * f;
        b.vx *= 0.94; b.vy *= 0.94;
        b.x += b.vx; b.y += b.vy;
        if (b.x < b.r) b.vx += 0.3;
        if (b.x > w - b.r) b.vx -= 0.3;
        if (b.y < b.r) b.vy += 0.3;
        if (b.y > h - b.r) b.vy -= 0.3;
      });

      ctx.clearRect(0, 0, w, h);
      // build metaball field via radial gradients with screen blending
      ctx.globalCompositeOperation = "lighter";
      balls.forEach((b) => {
        const g = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, "rgba(255,255,255,1)");
        g.addColorStop(0.5, "rgba(120,140,200,0.4)");
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = "source-over";

      // threshold pass for metaball look
      const img = ctx.getImageData(0, 0, w, h);
      const d = img.data;
      for (let i = 0; i < d.length; i += 4) {
        const v = d[i];
        if (v > 180) {
          d[i] = 230; d[i + 1] = 235; d[i + 2] = 245; d[i + 3] = 255;
        } else if (v > 120) {
          d[i] = 60; d[i + 1] = 70; d[i + 2] = 110; d[i + 3] = 200;
        } else {
          d[i + 3] = 0;
        }
      }
      ctx.putImageData(img, 0, 0);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      c.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <section className="snap-section relative overflow-hidden bg-gradient-to-br from-[#0a0d18] via-[#11142a] to-[#020308]">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <img src={logoWhite} alt="DS2 ferrofluid" className="h-[34vmin] w-[34vmin] object-contain mix-blend-difference" />
      </div>
      <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.4em] text-white/50">
        FERROFLUID — CURSOR FIELD
      </div>
    </section>
  );
};

/* ============================================================
   23 — ORIGAMI  (folding paper reveal)
============================================================ */
export const Section23 = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [fold, setFold] = useState(0);

  useEffect(() => {
    const el = ref.current!;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting && e.intersectionRatio > 0.4) {
          let v = 0;
          const id = setInterval(() => {
            v += 0.04;
            setFold(Math.min(1, v));
            if (v >= 1) clearInterval(id);
          }, 30);
          return () => clearInterval(id);
        } else {
          setFold(0);
        }
      },
      { threshold: [0, 0.4, 0.8] }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // 6 triangular flaps unfolding
  const flaps = [
    { rot: 0,  origin: "50% 100%" },
    { rot: 60, origin: "50% 100%" },
    { rot: 120,origin: "50% 100%" },
    { rot: 180,origin: "50% 100%" },
    { rot: 240,origin: "50% 100%" },
    { rot: 300,origin: "50% 100%" },
  ];

  return (
    <section ref={ref} className="snap-section relative overflow-hidden bg-[#f3ede1]">
      {/* paper texture */}
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_30%_20%,#d8cdb4_0,transparent_40%),radial-gradient(circle_at_70%_80%,#cdbf9f_0,transparent_45%)]" />
      <div className="absolute inset-0 opacity-20 mix-blend-multiply [background-image:repeating-linear-gradient(45deg,#000_0,#000_1px,transparent_1px,transparent_6px)]" />

      <div className="absolute inset-0 grid place-items-center">
        <div className="relative h-[60vmin] w-[60vmin]" style={{ perspective: 1400 }}>
          {/* base */}
          <div className="absolute inset-0 grid place-items-center">
            <img src={logoBlack} alt="DS2 origami" className="h-[28vmin] w-[28vmin] object-contain opacity-90" />
          </div>
          {/* flaps */}
          {flaps.map((f, i) => (
            <div
              key={i}
              className="absolute inset-0"
              style={{ transform: `rotate(${f.rot}deg)`, transformOrigin: "center" }}
            >
              <div
                className="absolute left-1/2 top-1/2 h-[34vmin] w-[34vmin] -translate-x-1/2 origin-bottom"
                style={{
                  transform: `rotateX(${(1 - fold) * 178}deg)`,
                  transition: "transform 1.2s cubic-bezier(.7,-0.05,.2,1.05)",
                  transformStyle: "preserve-3d",
                  background: "linear-gradient(180deg, #e3d6b8 0%, #bca87f 100%)",
                  clipPath: "polygon(50% 0%, 100% 100%, 0% 100%)",
                  boxShadow: "inset 0 -20px 40px rgba(0,0,0,0.25)",
                }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.4em] text-stone-700">
        ORIGAMI / 折り紙 — UNFOLD
      </div>
      <div className="absolute left-10 top-1/2 -translate-y-1/2 font-serif text-[10vmin] leading-none text-stone-800/15">
        紙
      </div>
    </section>
  );
};

/* ============================================================
   24 — DATAMOSH  (pixel-sorted RGB glitch)
============================================================ */
export const Section24 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hot, setHot] = useState(false);

  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const img = new Image();
    img.src = logoWhite;
    let raf = 0;

    const resize = () => {
      c.width = c.clientWidth;
      c.height = c.clientHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    img.onload = () => {
      const tick = (t: number) => {
        const w = c.width, h = c.height;
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, w, h);

        const size = Math.min(w, h) * 0.5;
        // Motion blur glitch (same color)
        ctx.globalCompositeOperation = "screen";
        const off = hot ? 30 : 8;
        const sway = Math.sin(t * 0.002) * off;
        ctx.filter = "brightness(0) invert(1)"; // force white
        [-1, 0, 1].forEach((i) => {
          const dx = i * sway;
          const dy = i * sway * 0.3;
          ctx.globalAlpha = i === 0 ? 1 : 0.4;
          ctx.save();
          ctx.translate(w / 2 + dx, h / 2 + dy);
          ctx.drawImage(img, -size / 2, -size / 2, size, size);
          ctx.restore();
        });
        ctx.filter = "none";
        ctx.globalAlpha = 1.0;
        ctx.globalCompositeOperation = "source-over";

        // pixel sort bands
        const bandCount = hot ? 28 : 10;
        for (let i = 0; i < bandCount; i++) {
          const y = Math.floor(Math.random() * h);
          const bh = 1 + Math.floor(Math.random() * (hot ? 14 : 5));
          const sx = Math.floor(Math.random() * w * 0.7);
          const sw = Math.floor(w * (0.2 + Math.random() * 0.6));
          try {
            const slice = ctx.getImageData(sx, y, sw, bh);
            const dxOff = (Math.random() - 0.5) * (hot ? 120 : 40);
            ctx.putImageData(slice, sx + dxOff, y);
          } catch {
            /* slice can fall outside the canvas at the edges — skip it */
          }
        }

        // scanlines
        ctx.fillStyle = "rgba(0,0,0,0.18)";
        for (let y = 0; y < h; y += 3) ctx.fillRect(0, y, w, 1);

        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [hot]);

  return (
    <section
      className="snap-section relative overflow-hidden bg-black"
      onMouseEnter={() => setHot(true)}
      onMouseLeave={() => setHot(false)}
    >
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute left-6 top-24 font-mono text-[10px] tracking-[0.4em] text-emerald-400">
        ▌SIGNAL_LOSS::0x{hot ? "FF" : "0A"}
      </div>
      <div className="pointer-events-none absolute right-6 top-24 font-mono text-[10px] tracking-[0.4em] text-rose-400">
        REC ●
      </div>
      <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.4em] text-white/60">
        HOVER TO CORRUPT
      </div>
    </section>
  );
};

/* ============================================================
   25 — TUNNEL  (perspective wormhole — mouse steers depth)
============================================================ */
export const Section25 = () => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const sx = useSpring(mx, { stiffness: 60, damping: 18 });
  const sy = useSpring(my, { stiffness: 60, damping: 18 });

  const ringCount = 22;
  const rings = Array.from({ length: ringCount });

  const handleMove = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    mx.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    my.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
  };

  return (
    <section
      className="snap-section relative overflow-hidden bg-[#06070a]"
      onMouseMove={handleMove}
    >
      {/* Cool dark backdrop — was rainbow #1b0030 purple */}
      <div className="absolute inset-0 [background:radial-gradient(circle_at_center,#0a1422_0%,#020308_70%)]" />

      <div
        className="absolute inset-0 grid place-items-center"
        style={{ perspective: 800 }}
      >
        <motion.div
          className="relative"
          style={{
            transformStyle: "preserve-3d",
            rotateY: useTransform(sx, (v) => v * 18),
            rotateX: useTransform(sy, (v) => -v * 18),
          }}
        >
          {/* Rings: single SF-blue tone, fade with distance. No rainbow. */}
          {rings.map((_, i) => {
            const z = -i * 220;
            const fade = 1 - i / ringCount;
            const size = 60 + i * 6;
            return (
              <motion.div
                key={i}
                className="absolute left-1/2 top-1/2 rounded-full"
                style={{
                  width: `${size}vmin`,
                  height: `${size}vmin`,
                  marginLeft: `-${size / 2}vmin`,
                  marginTop: `-${size / 2}vmin`,
                  transform: `translateZ(${z}px) rotate(${i * 7}deg)`,
                  border: `1.5px solid rgba(150, 200, 245, ${0.55 * fade})`,
                  boxShadow: `0 0 18px rgba(90, 200, 250, ${0.18 * fade})`,
                }}
                animate={{ rotate: [i * 7, i * 7 + 360] }}
                transition={{ duration: 30 + i * 2, repeat: Infinity, ease: "linear" }}
              />
            );
          })}
        </motion.div>
      </div>

      {/* Speed lines — toned down from opacity 40 → 18 */}
      <div className="pointer-events-none absolute inset-0 mix-blend-screen opacity-[0.18] [background:repeating-radial-gradient(circle_at_center,transparent_0,transparent_20px,rgba(255,255,255,0.06)_21px,transparent_22px)]" />

      {/* Always-visible foreground logo — DOM overlay, NOT a 3D-positioned plane
          (was at translateZ(-4940px) so it was a 3-pixel dot at the end of the
          tunnel). Now sits centred on top of the rings, full white, breathing. */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <motion.img
          src={logoWhite}
          alt="DS2 tunnel"
          className="w-[26vmin] object-contain"
          style={{ filter: "drop-shadow(0 0 14px rgba(0,0,0,0.6)) drop-shadow(0 0 28px rgba(90,200,250,0.35))" }}
          animate={{ scale: [1, 1.04, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="pointer-events-none absolute bottom-10 left-1/2 -translate-x-1/2 font-mono text-[10px] tracking-[0.4em] text-white/55">
        WORMHOLE — MOVE CURSOR TO STEER
      </div>
    </section>
  );
};
