"use client";

import { useState } from "react";
import { useLang } from "./i18n";
import s from "./expertise.module.css";

// Institution wordmarks. Drop the OFFICIAL, licensed file into
// public/logos/institutions/{slug}.svg (or .png) and it appears automatically —
// no code change. Until then a clean text wordmark shows.
// ⚠ Only display institutions the team has a genuine, verifiable connection to.
const LOGOS = [
  { slug: "henley", name: "Henley Business School" },
  { slug: "ucl", name: "UCL" },
  { slug: "groningen", name: "Hanze UAS Groningen" },
  // PwC hidden for now — re-add this line to bring it back (the asset is still
  // in public/logos/institutions/pwc.png).
  { slug: "intelmatix", name: "INTELMATIX" },
  { slug: "school", name: "St Catherine's" },
];

// Tries {slug}.svg then {slug}.png, then falls back to the text wordmark.
function Logo({ slug, name }: { slug: string; name: string }) {
  const [ext, setExt] = useState<"svg" | "png" | "text">("svg");
  if (ext === "text") return <span translate="no">{name}</span>;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      className={s.logoImg}
      src={`/logos/institutions/${slug}.${ext}`}
      alt={name}
      loading="lazy"
      onError={() => setExt(ext === "svg" ? "png" : "text")}
    />
  );
}

const COPY = {
  en: {
    eyebrow: "What we do well",
    f1role: "Head of Engineering & Data",
    f1bg: "Business · Data science · Machine learning",
    f1city: "London",
    f2role: "Head of Strategy & Consulting",
    f2bg: "Business management · Sales · Marketing",
    f2city: "Athens",
  },
  el: {
    eyebrow: "Σε τι είμαστε καλοί",
    f1role: "Επικεφαλής Μηχανικής & Data",
    f1bg: "Business · Data science · Machine learning",
    f1city: "Λονδίνο",
    f2role: "Επικεφαλής Στρατηγικής & Consulting",
    f2bg: "Διοίκηση · Πωλήσεις · Marketing",
    f2city: "Αθήνα",
  },
} as const;

/* Original flat-illustration avatars (placeholders for real headshots). */
function SpikyAvatar() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="100" height="100" fill="#12161d" />
      <ellipse cx="50" cy="30" rx="44" ry="36" fill="#1a2230" />
      <path d="M12 100 V92 c0-20 17-30 38-30 s38 10 38 30 V100 Z" fill="#242a35" />
      <path d="M50 62 l-9 13 M50 62 l9 13" stroke="#333b47" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M43 55 h14 v10 c0 5-14 5-14 0 Z" fill="#dca67e" />
      <circle cx="31" cy="44" r="4.2" fill="#e0ac83" />
      <circle cx="69" cy="44" r="4.2" fill="#e0ac83" />
      <ellipse cx="50" cy="42" rx="19" ry="21.5" fill="#e7b78d" />
      <path d="M30 47 L30 40 L34 27 L37 38 L41 23 L45 37 L50 21 L55 37 L59 23 L63 38 L66 27 L70 40 L70 47 C 70 34 62 29 50 29 C 38 29 30 34 30 47 Z" fill="#1b1c22" />
      <circle cx="43.5" cy="42.5" r="1.7" fill="#2a231d" />
      <circle cx="56.5" cy="42.5" r="1.7" fill="#2a231d" />
      <path d="M40 38 q3.5 -1.6 7 0 M53 38 q3.5 -1.6 7 0" stroke="#1b1c22" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M45 49.5 q5 3.5 10 0" stroke="#b57a55" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}
function BlondAvatar() {
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="100" height="100" fill="#12161d" />
      <ellipse cx="50" cy="30" rx="44" ry="36" fill="#1a2230" />
      <path d="M12 100 V92 c0-20 17-30 38-30 s38 10 38 30 V100 Z" fill="#2b3340" />
      <path d="M50 62 l-9 13 M50 62 l9 13" stroke="#3a4552" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M43 55 h14 v10 c0 5-14 5-14 0 Z" fill="#e7b48c" />
      <circle cx="31" cy="44" r="4.2" fill="#eab98f" />
      <circle cx="69" cy="44" r="4.2" fill="#eab98f" />
      <ellipse cx="50" cy="42" rx="19" ry="21.5" fill="#f0c49d" />
      <path d="M29 47 C 27 22 73 22 71 47 C 71 33 63 28 50 28 C 37 28 29 33 29 47 Z" fill="#e1c069" />
      <path d="M29 47 C 30 36 34 30 41 28 C 36 33 34 40 34 47 Z" fill="#d3ac4e" />
      <circle cx="43.5" cy="42.5" r="1.7" fill="#33291f" />
      <circle cx="56.5" cy="42.5" r="1.7" fill="#33291f" />
      <path d="M40 38 q3.5 -1.6 7 0 M53 38 q3.5 -1.6 7 0" stroke="#c9a44e" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M45 49.5 q5 3.5 10 0" stroke="#c2825f" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export default function Expertise() {
  const { lang } = useLang();
  const c = COPY[lang];

  const strip = (
    <div className={s.logo} aria-hidden="true">
      {LOGOS.flatMap((l) => [
        <Logo key={l.slug} slug={l.slug} name={l.name} />,
        <i key={`${l.slug}-dot`} className={s.dot} />,
      ])}
    </div>
  );

  const founders = [
    { role: c.f1role, bg: c.f1bg, city: c.f1city, Avatar: BlondAvatar },
    { role: c.f2role, bg: c.f2bg, city: c.f2city, Avatar: SpikyAvatar },
  ];

  return (
    <section className={s.expertise} id="expertise" aria-label={lang === "el" ? "Η εξειδίκευσή μας" : "Our expertise"}>
      <div className={s.head}>
        <div className={s.eyebrow}>{c.eyebrow}</div>
        <h2 className={s.title}>
          {lang === "el" ? (
            <>Μια ομάδα που <em>το έχει κάνει</em>.</>
          ) : (
            <>A team that has <em>been there</em>.</>
          )}
        </h2>
      </div>

      <div className={s.marquee} role="img" aria-label={LOGOS.map((l) => l.name).join(", ")}>
        <div className={s.track}>
          {strip}
          {strip}
          {strip}
        </div>
      </div>

      <div className={s.team}>
        <p className={s.blurb}>
          {lang === "el" ? (
            <>Μια μικρή, έμπειρη ομάδα από ειδικούς σε AI και data. Φτιάχνουμε λογισμικό πραγματικά <em>χρήσιμο</em>, που γίνεται αξία που μετριέται.</>
          ) : (
            <>A small, senior team of AI and data experts. We build software that is genuinely <em>useful</em>, and turns into value you can measure.</>
          )}
        </p>

        <div className={s.founders}>
          {founders.map((f) => (
            <div className={s.founder} key={f.role}>
              <div className={s.avatar}>
                <f.Avatar />
              </div>
              <div className={s.fmeta}>
                <div className={s.frole}>{f.role}</div>
                <div className={s.fcity}>{f.city}</div>
                <div className={s.fbg}>{f.bg}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
