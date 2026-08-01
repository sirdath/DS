"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useLang } from "./i18n";
import s from "./selected-work.module.css";

type Loc = { en: string; el: string };
type Project = {
  name: string;
  type: Loc;
  line: Loc;
  image: string;
  href: string;
  url?: string; // display label for the address bar (when href is internal)
  concept?: boolean;
};

// Real shipped work first, clearly-labelled concepts last. Screenshots are real
// captures of the live sites; concepts use the design templates.
const PROJECTS: Project[] = [
  {
    name: "Nodebook",
    type: { en: "App · Learning", el: "Εφαρμογή · Μάθηση" },
    line: {
      en: "Turns any topic into a clear, cited lesson and brings it back before you forget.",
      el: "Μετατρέπει κάθε θέμα σε ένα καθαρό, τεκμηριωμένο μάθημα και το επαναφέρει πριν το ξεχάσετε.",
    },
    image: "/portfolio/nodebook.webp",
    href: "https://node-book.app",
  },
  {
    name: "DreamBug",
    type: { en: "App · Kids", el: "Εφαρμογή · Παιδικά" },
    line: {
      en: "Original bedtime stories for kids 2 to 8, every book checked by two people, works offline.",
      el: "Πρωτότυπες βραδινές ιστορίες για παιδιά 2 έως 8, κάθε βιβλίο ελεγμένο από δύο άτομα, λειτουργεί offline.",
    },
    image: "/portfolio/dreambug.webp",
    href: "https://dreambug.app",
  },
  {
    name: "dataportfolio.co.uk",
    type: { en: "SaaS · Platform", el: "SaaS · Πλατφόρμα" },
    line: {
      en: "A product idea turned into a clear, working portfolio-building platform.",
      el: "Μια ιδέα προϊόντος έγινε μια καθαρή, λειτουργική πλατφόρμα δημιουργίας portfolio.",
    },
    image: "/portfolio/dataportfolio.webp",
    href: "https://dataportfolio.co.uk",
  },
  {
    name: "GlobalTeamPlans",
    type: { en: "Website · Lead generation", el: "Ιστοσελίδα · Lead generation" },
    line: {
      en: "A specialist global service made easier to understand, trust and choose.",
      el: "Μια εξειδικευμένη διεθνής υπηρεσία, πιο εύκολη στην κατανόηση και την επιλογή.",
    },
    image: "/portfolio/globalteamplans.webp",
    href: "https://globalteamplans.com",
  },
  {
    name: "Atelier",
    type: { en: "Template · Fashion commerce", el: "Template · Fashion commerce" },
    line: {
      en: "A premium buying journey, ready to tailor to a fashion or lifestyle brand.",
      el: "Μια premium εμπειρία αγοράς, έτοιμη να προσαρμοστεί σε fashion ή lifestyle brand.",
    },
    image: "/templates/atelier.webp",
    href: "/templates/atelier.webp",
    concept: true,
  },
  {
    name: "Padel City",
    type: { en: "Template · Booking", el: "Template · Κρατήσεις" },
    line: {
      en: "Availability, booking and payment shown as one smooth customer journey.",
      el: "Διαθεσιμότητα, κράτηση και πληρωμή ως μία ομαλή διαδρομή πελάτη.",
    },
    image: "/templates/padel.webp",
    href: "/templates/padel.webp",
    concept: true,
  },
];

const COPY = {
  en: {
    eyebrow: "// Selected work",
    sub: "Real products and sites we've shipped. A couple are templates, ready to tailor to your business. The label tells you which.",
    concept: "Template",
    visit: "Visit ↗",
    preview: "Preview ↗",
    coda: "Have a project in mind?",
    codaCta: "How can we help?",
  },
  el: {
    eyebrow: "// Επιλεγμένα έργα",
    sub: "Πραγματικά προϊόντα και ιστοσελίδες που έχουμε παραδώσει. Κάποια είναι templates, έτοιμα να προσαρμοστούν στη δική σας επιχείρηση. Η ετικέτα σας λέει ποιο είναι ποιο.",
    concept: "Template",
    visit: "Επίσκεψη ↗",
    preview: "Προεπισκόπηση ↗",
    coda: "Έχετε ένα έργο στο μυαλό σας;",
    codaCta: "Πώς μπορούμε να βοηθήσουμε;",
  },
} as const;

export default function SelectedWork() {
  const { lang } = useLang();
  const c = COPY[lang];

  return (
    <section className={s.work} id="work" aria-label={lang === "el" ? "Επιλεγμένα έργα" : "Selected work"}>
      <div className={s.head}>
        <div className={s.eyebrow}>{c.eyebrow}</div>
        <h2 className={s.title}>
          {lang === "el" ? (
            <>Πράγματα που έχουμε <em>φτιάξει</em>.</>
          ) : (
            <>Things we've actually <em>built</em>.</>
          )}
        </h2>
        <p className={s.sub}>{c.sub}</p>
      </div>

      <div className={s.grid}>
        {PROJECTS.map((p) => {
          const external = p.href.startsWith("http");
          const domain = p.url
            ? p.url
            : external
            ? p.href.replace(/^https?:\/\//, "").replace(/\/$/, "")
            : `${p.name.toLowerCase().replace(/\s+/g, "-")} · template`;
          return (
            <a
              key={p.name}
              className={s.card}
              href={p.href}
              target="_blank"
              rel="noreferrer"
            >
              <div className={s.chrome}>
                <span className={s.lights} aria-hidden="true"><i /><i /><i /></span>
                <span className={s.url} translate="no">
                  <span className={s.lock} aria-hidden="true">{p.concept ? "◇" : "🔒"}</span>
                  {domain}
                </span>
              </div>
              <div className={s.shot}>
                <img src={p.image} alt={`${p.name} — ${p.type[lang]}`} loading="lazy" />
              </div>
              <div className={s.meta}>
                <div className={s.tags}>
                  <span className={s.tag}>{p.type[lang]}</span>
                  {p.concept && <span className={s.badge}>{c.concept}</span>}
                </div>
                <div className={s.name} translate="no">{p.name}</div>
                <p className={s.line}>{p.line[lang]}</p>
                <span className={s.open}>{p.concept ? c.preview : c.visit}</span>
              </div>
            </a>
          );
        })}
      </div>

      <div className={s.coda}>
        <div className={s.codaText}>{c.coda}</div>
        <Link className={s.codaCta} href="/assistant">
          {c.codaCta} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
