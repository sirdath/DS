"use client";
import { useState } from "react";
import { useT } from "../i18n";

/** Icon per tool (viewBox 0 0 40 40), echoing the services icon style. */
export function ToolIcon({ slug }: { slug: string }) {
  switch (slug) {
    case "competitor-watch": // an eye sweeping a field
      return (
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 20c4.5-7 10-10.5 16-10.5S31.5 13 36 20c-4.5 7-10 10.5-16 10.5S8.5 27 4 20z" />
          <circle cx="20" cy="20" r="4.5" />
          <path d="M20 13v-2.5M27 15l1.6-2M13 15l-1.6-2" opacity="0.6" />
        </svg>
      );
    case "review-intelligence": // a star with signal lines
      return (
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6l4 8.2 9 1.3-6.5 6.3 1.5 9L20 26.6l-8 4.2 1.5-9L7 15.5l9-1.3z" />
          <path d="M33 30h4M33 34h7" opacity="0.6" />
        </svg>
      );
    case "site-selection": // a map pin over a grid
      return (
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 31l8-3 7 3 8-3 7 3M5 25l8-3 7 3 8-3 7 3" opacity="0.5" />
          <path d="M20 4a7 7 0 0 1 7 7c0 5-7 11-7 11s-7-6-7-11a7 7 0 0 1 7-7z" />
          <circle cx="20" cy="11" r="2.4" />
        </svg>
      );
    default: // ai-receptionist — a chat bubble with a calendar tick
      return (
        <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9h22a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H16l-7 6v-6H6a3 3 0 0 1-3-3V12a3 3 0 0 1 3-3z" />
          <path d="M11 17h2M17 17h2M23 17h2" />
          <path d="M30 27l2.5 2.5L37 25" opacity="0.75" />
        </svg>
      );
  }
}

/** Asset manifests — add a slug when its file lands (keeps pages free of 404s).
 *  Posters: /tools/posters/{slug}.webp · Videos: /tools/videos/{slug}.mp4 */
const HAS_POSTER = new Set<string>([]);
const HAS_VIDEO = new Set<string>([]);

/** The tool's media slot, two modes:
 *  - "poster" (storefront cards): the preview image, no playback.
 *  - "video" (detail page): the demo film auto-plays, with the poster as its
 *    first frame.
 *  Until assets land, a designed placeholder keeps the layout final. */
export function ToolMedia({ slug, name, mode = "poster" }: { slug: string; name: string; mode?: "poster" | "video" }) {
  const t = useT();
  const [video, setVideo] = useState(mode === "video" && HAS_VIDEO.has(slug));
  const [poster, setPoster] = useState(HAS_POSTER.has(slug));
  const posterSrc = `/tools/posters/${slug}.webp`;
  return (
    <div className={`tmedia tmedia--${slug}`}>
      {video ? (
        <video
          className="tmedia__video"
          src={`/tools/videos/${slug}.mp4`}
          poster={poster ? posterSrc : undefined}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          aria-label={name}
          onError={() => setVideo(false)}
        />
      ) : poster ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="tmedia__poster" src={posterSrc} alt={name} loading="lazy" onError={() => setPoster(false)} />
      ) : (
        <div className="tmedia__placeholder" aria-hidden="true">
          <span className="tmedia__icon"><ToolIcon slug={slug} /></span>
          <span className="tmedia__soon">{t.tools.videoSoon}</span>
        </div>
      )}
    </div>
  );
}
