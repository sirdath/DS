"use client";
/**
 * "Powered by" — a slow, seamless marquee of the tools we build on.
 * Honest credibility-by-association (our stack, not clients).
 * Logos are simple-icons SVGs rendered as CSS masks so they're monochrome
 * and recolour with one CSS variable once the palette lands.
 */
import { useEffect, useRef } from "react";
import { useT } from "./i18n";

const TOOLS: { slug: string; label: string }[] = [
  { slug: "nextdotjs", label: "Next.js" },
  { slug: "react", label: "React" },
  { slug: "typescript", label: "TypeScript" },
  { slug: "tailwindcss", label: "Tailwind CSS" },
  { slug: "vercel", label: "Vercel" },
  { slug: "supabase", label: "Supabase" },
  { slug: "cloudflare", label: "Cloudflare" },
  { slug: "postgresql", label: "PostgreSQL" },
  { slug: "anthropic", label: "Claude" },
  { slug: "openai", label: "OpenAI" },
  { slug: "googlegemini", label: "Gemini" },
  { slug: "python", label: "Python" },
];

export default function PoweredBy() {
  const t = useT();
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let killed = false;
    let tween: gsap.core.Tween | null = null;
    const viewport = track.parentElement;
    const pause = () => tween?.pause();
    const resume = () => tween?.play();

    import("gsap").then(({ default: gsap }) => {
      if (killed || !track) return;
      // Track holds two identical halves; -50% scrolls exactly one half → seamless loop.
      tween = gsap.to(track, { xPercent: -50, duration: 72, ease: "none", repeat: -1 });
      viewport?.addEventListener("pointerenter", pause);
      viewport?.addEventListener("pointerleave", resume);
    });

    return () => {
      killed = true;
      tween?.kill();
      viewport?.removeEventListener("pointerenter", pause);
      viewport?.removeEventListener("pointerleave", resume);
    };
  }, []);

  // Two identical halves (each = the set twice) so one half always exceeds the
  // viewport on wide screens — the -50% scroll never reveals an empty gap.
  const items = [...TOOLS, ...TOOLS, ...TOOLS, ...TOOLS];

  return (
    <section className="powered" aria-label={t.poweredBy}>
      <div className="powered-eyebrow">{t.poweredBy}</div>
      <div className="powered-viewport">
        <div className="powered-track" ref={trackRef}>
          {items.map((tool, i) => (
            <span
              key={i}
              className="powered-logo"
              title={tool.label}
              aria-hidden={i >= TOOLS.length}
              role={i < TOOLS.length ? "img" : undefined}
              aria-label={i < TOOLS.length ? tool.label : undefined}
              style={{
                WebkitMaskImage: `url(/logos/tools/${tool.slug}.svg)`,
                maskImage: `url(/logos/tools/${tool.slug}.svg)`,
              }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
