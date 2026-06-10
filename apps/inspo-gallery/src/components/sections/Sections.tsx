import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";
import logoWhite from "@/assets/logo-white.png";
import logoOutline from "@/assets/logo-outline.png";
import logoBlack from "@/assets/logo-black.png";

/* ============================================================
   01 — GENESIS  (minimal, parallax mouse, soft halo)
============================================================ */
export const Section01 = () => {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const tx = useSpring(mx, { stiffness: 60, damping: 20 });
  const ty = useSpring(my, { stiffness: 60, damping: 20 });

  useEffect(() => {
    const h = (e: MouseEvent) => {
      mx.set((e.clientX / window.innerWidth - 0.5) * 40);
      my.set((e.clientY / window.innerHeight - 0.5) * 40);
    };
    window.addEventListener("mousemove", h);
    return () => window.removeEventListener("mousemove", h);
  }, [mx, my]);

  return (
    <section className="snap-section grain flex items-center justify-center bg-background">
      <motion.div
        className="absolute h-[60vmin] w-[60vmin] rounded-full opacity-40 blur-3xl"
        style={{ x: tx, y: ty, background: "radial-gradient(circle, hsl(180 100% 60% / 0.6), transparent 70%)" }}
      />
      <motion.div style={{ x: useTransform(tx, v => v * -0.3), y: useTransform(ty, v => v * -0.3) }} className="relative z-10">
        <motion.img
          src={logoWhite}
          alt="DS2"
          className="w-[min(60vw,720px)] drop-shadow-[0_0_60px_hsl(180_100%_60%/0.4)]"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          viewport={{ once: false }}
        />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_30%,hsl(var(--background))_85%)]" />
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 text-center font-mono text-xs tracking-[0.5em] text-muted-foreground">
        IN THE BEGINNING
      </div>
    </section>
  );
};

/* ============================================================
   02 — VOID  (starfield + orbiting logo)
============================================================ */
export const Section02 = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = canvasRef.current!;
    const ctx = c.getContext("2d")!;
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize(); window.addEventListener("resize", resize);
    const stars = Array.from({ length: 400 }, () => ({
      x: (Math.random() - 0.5) * c.width,
      y: (Math.random() - 0.5) * c.height,
      z: Math.random() * c.width,
    }));
    let raf = 0;
    const draw = () => {
      ctx.fillStyle = "rgba(10,10,10,0.35)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.save();
      ctx.translate(c.width / 2, c.height / 2);
      stars.forEach(s => {
        s.z -= 4;
        if (s.z <= 0) s.z = c.width;
        const k = 128 / s.z;
        const px = s.x * k;
        const py = s.y * k;
        const size = (1 - s.z / c.width) * 2.5;
        ctx.fillStyle = `hsla(0,0%,100%,${1 - s.z / c.width})`;
        ctx.fillRect(px, py, size, size);
      });
      ctx.restore();
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);

  return (
    <section className="snap-section flex items-center justify-center bg-background">
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      <motion.div
        className="relative z-10 flex h-[80vmin] w-[80vmin] items-center justify-center"
        animate={{ rotate: 360 }}
        transition={{ duration: 80, ease: "linear", repeat: Infinity }}
      >
        <div className="absolute inset-0 rounded-full border border-foreground/10" />
        <div className="absolute inset-[10%] rounded-full border border-foreground/5" />
        <motion.div
          className="absolute"
          animate={{ rotate: -360 }}
          transition={{ duration: 80, ease: "linear", repeat: Infinity }}
        >
          <img src={logoWhite} alt="DS2" className="w-[min(45vw,560px)]" />
        </motion.div>
      </motion.div>
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 font-serif-display text-2xl italic text-muted-foreground">
        through the void
      </div>
    </section>
  );
};

/* ============================================================
   03 — PRISM  (CMYK separation, glitch)
============================================================ */
export const Section03 = () => {
  return (
    <section className="snap-section flex items-center justify-center bg-[hsl(0_0%_96%)]">
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,transparent_98%,hsla(0,0%,0%,0.06)_100%)] bg-[length:100%_8px]" />
      <div className="relative">
        <img src={logoBlack} alt="" aria-hidden className="absolute inset-0 w-[min(60vw,680px)] mix-blend-multiply" style={{ filter: "drop-shadow(8px 0 0 hsl(0 100% 50% / 0.7))" }} />
        <img src={logoBlack} alt="" aria-hidden className="absolute inset-0 w-[min(60vw,680px)] mix-blend-multiply" style={{ filter: "drop-shadow(-6px 0 0 hsl(180 100% 45% / 0.7))" }} />
        <motion.img
          src={logoBlack} alt="DS2"
          className="relative w-[min(60vw,680px)]"
          animate={{ x: [0, -1, 1, 0, 0], y: [0, 1, -1, 0, 0] }}
          transition={{ duration: 0.4, repeat: Infinity, repeatDelay: 2.5 }}
        />
      </div>
      <div className="absolute left-8 top-1/2 -translate-y-1/2 -rotate-90 font-mono text-[10px] tracking-[0.5em] text-black/60">CMYK / RGB / RIP</div>
      <div className="absolute right-8 top-1/2 -translate-y-1/2 rotate-90 font-mono text-[10px] tracking-[0.5em] text-black/60">CHROMATIC ABERRATION</div>
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 font-mono text-xs tracking-[0.4em] text-black/70">/ PRISMATIC SEPARATION /</div>
    </section>
  );
};

/* ============================================================
   04 — FLUX  (animated mesh gradient + liquid logo)
============================================================ */
export const Section04 = () => {
  return (
    <section className="snap-section flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0">
        <motion.div
          className="absolute inset-0"
          animate={{ background: [
            "radial-gradient(60% 60% at 20% 30%, hsl(320 100% 55% / 0.7), transparent 60%), radial-gradient(60% 60% at 80% 70%, hsl(220 100% 55% / 0.7), transparent 60%), radial-gradient(60% 60% at 50% 50%, hsl(280 100% 50% / 0.5), transparent 60%), hsl(0 0% 4%)",
            "radial-gradient(60% 60% at 70% 20%, hsl(180 100% 55% / 0.7), transparent 60%), radial-gradient(60% 60% at 30% 80%, hsl(280 100% 55% / 0.7), transparent 60%), radial-gradient(60% 60% at 60% 50%, hsl(320 100% 50% / 0.5), transparent 60%), hsl(0 0% 4%)",
            "radial-gradient(60% 60% at 20% 30%, hsl(320 100% 55% / 0.7), transparent 60%), radial-gradient(60% 60% at 80% 70%, hsl(220 100% 55% / 0.7), transparent 60%), radial-gradient(60% 60% at 50% 50%, hsl(280 100% 50% / 0.5), transparent 60%), hsl(0 0% 4%)",
          ] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>
      <motion.img
        src={logoWhite} alt="DS2"
        className="relative z-10 w-[min(55vw,640px)]"
        style={{ filter: "url(#liquid)" }}
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      />
      <svg className="absolute h-0 w-0">
        <filter id="liquid">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2">
            <animate attributeName="baseFrequency" values="0.012;0.02;0.012" dur="10s" repeatCount="indefinite" />
          </feTurbulence>
          <feDisplacementMap in="SourceGraphic" scale="18" />
        </filter>
      </svg>
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 font-serif-display text-3xl italic text-foreground/80">flux state</div>
    </section>
  );
};

/* ============================================================
   05 — BRUTAL  (raw concrete + giant type)
============================================================ */
export const Section05 = () => {
  return (
    <section className="snap-section grain flex flex-col items-center justify-center bg-[hsl(50_8%_88%)] text-black">
      <div className="absolute left-0 top-0 flex h-full w-full flex-col justify-between p-10 font-mono text-[10px] tracking-[0.3em] text-black/70">
        <div className="flex justify-between"><span>SYS.05</span><span>BRUTAL/RAW</span><span>NO.AESTHETIC</span></div>
        <div className="flex justify-between"><span>DS2™</span><span>CONCRETE_GREY 88%</span><span>EST.NOW</span></div>
      </div>
      <div className="absolute inset-0 flex items-center overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap font-display text-[28vw] leading-none tracking-tighter text-black/[0.08]">
          <span className="px-8">DS2 — DS2 — DS2 — DS2 —&nbsp;</span>
          <span className="px-8">DS2 — DS2 — DS2 — DS2 —&nbsp;</span>
        </div>
      </div>
      <motion.div
        className="relative z-10 border-[3px] border-black bg-[hsl(50_8%_88%)] p-10"
        whileHover={{ rotate: -1, scale: 1.02 }}
        transition={{ type: "spring", stiffness: 200 }}
      >
        <img src={logoBlack} alt="DS2" className="w-[min(45vw,520px)]" />
      </motion.div>
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 border-2 border-black bg-black px-6 py-2 font-mono text-xs tracking-[0.4em] text-[hsl(50_8%_88%)]">
        FORM • FOLLOWS • FORCE
      </div>
    </section>
  );
};

/* ============================================================
   06 — AURORA  (silky ribbons + warm light)
============================================================ */
export const Section06 = () => {
  return (
    <section className="snap-section flex items-center justify-center overflow-hidden bg-[hsl(220_40%_6%)]">
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute h-[200vh] w-[40vmin] origin-center rounded-full opacity-50 blur-3xl"
          style={{
            background: `linear-gradient(180deg, transparent, hsl(${140 + i * 30} 90% 60% / 0.7), transparent)`,
            left: `${10 + i * 15}%`, top: "-50%",
          }}
          animate={{ rotate: [i * 20 - 20, i * 20 + 20, i * 20 - 20], x: [0, 40, 0] }}
          transition={{ duration: 14 + i * 2, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_50%,hsl(220_40%_6%)_90%)]" />
      <motion.img
        src={logoWhite} alt="DS2"
        className="relative z-10 w-[min(55vw,640px)] drop-shadow-[0_0_80px_hsl(160_100%_60%/0.5)]"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5 }}
        viewport={{ once: false }}
      />
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 font-serif-display text-3xl italic text-foreground/80">aurora</div>
    </section>
  );
};

/* ============================================================
   07 — PARTICLE  (logo formed from particles)
============================================================ */
export const Section07 = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current!;
    const ctx = c.getContext("2d")!;
    const resize = () => { c.width = innerWidth; c.height = innerHeight; };
    resize(); window.addEventListener("resize", resize);

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = logoWhite;
    const particles: { x: number; y: number; tx: number; ty: number; vx: number; vy: number }[] = [];
    const mouse = { x: -9999, y: -9999 };

    const onMove = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    window.addEventListener("mousemove", onMove);

    img.onload = () => {
      const off = document.createElement("canvas");
      const targetW = Math.min(c.width * 0.5, 700);
      const ratio = img.height / img.width;
      off.width = targetW; off.height = targetW * ratio;
      const octx = off.getContext("2d")!;
      octx.drawImage(img, 0, 0, off.width, off.height);
      const data = octx.getImageData(0, 0, off.width, off.height).data;
      const step = 5;
      const ox = c.width / 2 - off.width / 2;
      const oy = c.height / 2 - off.height / 2;
      for (let y = 0; y < off.height; y += step) {
        for (let x = 0; x < off.width; x += step) {
          const a = data[(y * off.width + x) * 4 + 3];
          if (a > 128) {
            particles.push({
              x: Math.random() * c.width,
              y: Math.random() * c.height,
              tx: ox + x, ty: oy + y, vx: 0, vy: 0,
            });
          }
        }
      }
    };

    let raf = 0;
    const draw = () => {
      ctx.fillStyle = "rgba(10,10,10,0.25)";
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.fillStyle = "hsl(0 0% 98%)";
      particles.forEach(p => {
        const dx = p.tx - p.x;
        const dy = p.ty - p.y;
        p.vx += dx * 0.01; p.vy += dy * 0.01;
        // mouse repulsion
        const mdx = p.x - mouse.x, mdy = p.y - mouse.y;
        const dist2 = mdx * mdx + mdy * mdy;
        if (dist2 < 14000) {
          const f = 600 / Math.max(dist2, 100);
          p.vx += mdx * f * 0.002; p.vy += mdy * f * 0.002;
        }
        p.vx *= 0.85; p.vy *= 0.85;
        p.x += p.vx; p.y += p.vy;
        ctx.fillRect(p.x, p.y, 1.6, 1.6);
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); window.removeEventListener("mousemove", onMove); };
  }, []);

  return (
    <section className="snap-section flex items-center justify-center bg-background">
      <canvas ref={ref} className="absolute inset-0 h-full w-full" />
      <div className="pointer-events-none absolute bottom-20 left-1/2 -translate-x-1/2 font-mono text-xs tracking-[0.4em] text-muted-foreground">
        PARTICLE FIELD — MOVE TO DISTURB
      </div>
    </section>
  );
};

/* ============================================================
   08 — KINETIC  (3D tilt logo + repeat type)
============================================================ */
export const Section08 = () => {
  const ref = useRef<HTMLDivElement>(null);
  const rx = useMotionValue(0);
  const ry = useMotionValue(0);
  const srx = useSpring(rx, { stiffness: 120, damping: 12 });
  const sry = useSpring(ry, { stiffness: 120, damping: 12 });

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current!.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 30); rx.set(-py * 30);
  };
  const reset = () => { rx.set(0); ry.set(0); };

  return (
    <section
      className="snap-section flex items-center justify-center bg-[hsl(45_100%_55%)] text-black"
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={reset}
      style={{ perspective: 1200 } as React.CSSProperties}
    >
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 14 }).map((_, i) => (
          <div key={i} className="absolute left-0 right-0 flex animate-marquee whitespace-nowrap font-mono text-sm font-bold tracking-[0.3em] text-black/80" style={{ top: `${i * 8}%`, animationDuration: `${20 + i * 3}s`, animationDirection: i % 2 ? "reverse" : "normal" }}>
            <span>DS2 / KINETIC / TYPE / IN / MOTION / DS2 / KINETIC / TYPE / IN / MOTION /&nbsp;</span>
            <span>DS2 / KINETIC / TYPE / IN / MOTION / DS2 / KINETIC / TYPE / IN / MOTION /&nbsp;</span>
          </div>
        ))}
      </div>
      <motion.div
        style={{ rotateX: srx, rotateY: sry, transformStyle: "preserve-3d" }}
        className="relative z-10"
      >
        <div className="border-[3px] border-black bg-[hsl(45_100%_55%)] p-8 shadow-[16px_16px_0_hsl(0_0%_0%)]">
          <img src={logoBlack} alt="DS2" className="w-[min(45vw,520px)]" />
        </div>
      </motion.div>
    </section>
  );
};

/* ============================================================
   09 — GLASS  (liquid glass / refraction)
============================================================ */
export const Section09 = () => {
  return (
    <section className="snap-section flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0" style={{
        background: "linear-gradient(135deg, hsl(220 80% 12%), hsl(280 70% 18%), hsl(200 80% 14%))",
      }} />
      {/* floating orbs */}
      {Array.from({ length: 6 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full opacity-60 blur-2xl"
          style={{
            width: 200 + i * 60, height: 200 + i * 60,
            left: `${15 + i * 12}%`, top: `${20 + (i * 13) % 60}%`,
            background: `radial-gradient(circle, hsl(${200 + i * 25} 100% 60%), transparent 70%)`,
          }}
          animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0] }}
          transition={{ duration: 16 + i * 2, repeat: Infinity, ease: "easeInOut" }}
        />
      ))}
      <motion.div
        whileHover={{ scale: 1.04 }}
        className="glass relative z-10 rounded-[36px] p-14 shadow-[0_30px_80px_-20px_hsl(0_0%_0%/0.6)]"
      >
        <div className="pointer-events-none absolute inset-0 rounded-[36px]" style={{
          background: "linear-gradient(135deg, hsla(0,0%,100%,0.4), transparent 40%)",
          mixBlendMode: "overlay",
        }} />
        <img src={logoWhite} alt="DS2" className="relative w-[min(45vw,520px)]" />
      </motion.div>
      <div className="absolute bottom-20 left-1/2 -translate-x-1/2 font-mono text-xs tracking-[0.4em] text-foreground/80">/ LIQUID GLASS /</div>
    </section>
  );
};

/* ============================================================
   10 — INFINITY  (recursive reveal + scan line)
============================================================ */
export const Section10 = () => {
  return (
    <section className="snap-section flex items-center justify-center overflow-hidden bg-background">
      <div className="absolute inset-0" style={{
        backgroundImage: "linear-gradient(hsl(0 0% 14%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 14%) 1px, transparent 1px)",
        backgroundSize: "60px 60px",
        maskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
        WebkitMaskImage: "radial-gradient(ellipse at center, black 30%, transparent 75%)",
      }} />
      <div className="pointer-events-none absolute inset-x-0 z-20 h-px animate-scan" style={{
        background: "linear-gradient(90deg, transparent, hsl(180 100% 60%), transparent)",
        boxShadow: "0 0 20px hsl(180 100% 60%)",
      }} />
      <div className="relative z-10 flex items-center justify-center">
        {[1, 0.78, 0.6, 0.45, 0.32].map((s, i) => (
          <motion.img
            key={i}
            src={i === 0 ? logoWhite : logoOutline}
            alt=""
            className="absolute"
            style={{ width: `${s * 60}vmin`, maxWidth: `${s * 720}px` }}
            initial={{ opacity: 0, scale: s * 1.2 }}
            whileInView={{ opacity: i === 0 ? 1 : 0.4 - i * 0.07, scale: s }}
            transition={{ duration: 1, delay: i * 0.15 }}
            viewport={{ once: false }}
          />
        ))}
      </div>
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 text-center">
        <div className="font-serif-display text-4xl italic text-foreground">infinite forms.</div>
        <div className="mt-3 font-mono text-[10px] tracking-[0.5em] text-muted-foreground">END / OR / BEGINNING</div>
      </div>
    </section>
  );
};
