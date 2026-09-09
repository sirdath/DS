"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";
import { useLang } from "../i18n";
import g from "./projects-grid.module.css";

type Filter = "all" | "website" | "product" | "concept";

const projects = [
  { name: "Nodebook", category: "product" as const, image: "/portfolio/nodebook.webp", href: "https://node-book.app", en: { type: "App / Learning / SaaS", year: "2026", line: "Turns any topic into a clear, cited lesson and brings it back before you forget." }, el: { type: "Εφαρμογή / Μάθηση / SaaS", year: "2026", line: "Μετατρέπει κάθε θέμα σε ένα καθαρό, τεκμηριωμένο μάθημα και το επαναφέρει πριν το ξεχάσετε." } },
  { name: "DreamBug", category: "product" as const, image: "/portfolio/dreambug.webp", href: "https://dreambug.app", en: { type: "App / Kids / Offline", year: "2026", line: "Original bedtime stories for kids 2 to 8, every book checked by two people." }, el: { type: "Εφαρμογή / Παιδικά / Offline", year: "2026", line: "Πρωτότυπες βραδινές ιστορίες για παιδιά 2 έως 8, κάθε βιβλίο ελεγμένο από δύο άτομα." } },
  { name: "dataportfolio.co.uk", category: "product" as const, image: "/portfolio/dataportfolio.webp", href: "https://dataportfolio.co.uk", en: { type: "SaaS / Product / Platform", year: "2026", line: "A product idea turned into a clear, working portfolio-building platform." }, el: { type: "SaaS / Προϊόν / Πλατφόρμα", year: "2026", line: "Μια ιδέα προϊόντος έγινε μια καθαρή, λειτουργική πλατφόρμα δημιουργίας portfolio." } },
  { name: "GlobalTeamPlans", category: "website" as const, image: "/portfolio/globalteamplans.webp", href: "https://globalteamplans.com", en: { type: "Website / SEO / Lead gen", year: "2026", line: "A specialist global service made easier to understand, trust and choose." }, el: { type: "Ιστοσελίδα / SEO / Lead gen", year: "2026", line: "Μια εξειδικευμένη διεθνής υπηρεσία, πιο εύκολο να την κατανοήσετε, να την εμπιστευτείτε και να την επιλέξετε." } },
  { name: "Atelier", category: "concept" as const, image: "/templates/atelier.webp", href: "/templates/atelier.webp", en: { type: "Template / Fashion / Commerce", year: "Ready to tailor", line: "A premium buying journey, ready to tailor to a fashion or lifestyle brand." }, el: { type: "Template / Μόδα / Εμπόριο", year: "Έτοιμο για προσαρμογή", line: "Μια premium εμπειρία αγοράς, έτοιμη να προσαρμοστεί σε fashion ή lifestyle brand." } },
  { name: "Padel City", category: "concept" as const, image: "/templates/padel.webp", href: "/templates/padel.webp", en: { type: "Template / Booking / Sport", year: "Ready to tailor", line: "Availability, booking and payment shown as one smooth customer journey." }, el: { type: "Template / Κρατήσεις / Αθλητισμός", year: "Έτοιμο για προσαρμογή", line: "Διαθεσιμότητα, κράτηση και πληρωμή ως μία ομαλή διαδρομή πελάτη." } },
];

const copy = {
  en: { eyebrow: "Selected work and working directions", title: "Projects that make the value visible.", sub: "Real client work sits beside ready-to-tailor directions. The label always tells you which is which.", filters: { all: "All", website: "Websites", product: "Products", concept: "Templates" }, filtersLabel: "Project filters", contact: "Have a project in mind?", contactLink: "How can we help?", contactSub: "CLICK ME · QUICK RESPONSE" },
  el: { eyebrow: "Επιλεγμένα έργα και δημιουργικές κατευθύνσεις", title: "Έργα που κάνουν την αξία ορατή.", sub: "Πραγματική δουλειά πελατών μαζί με κατευθύνσεις έτοιμες για προσαρμογή. Η ετικέτα ξεκαθαρίζει πάντα τι βλέπετε.", filters: { all: "Όλα", website: "Ιστοσελίδες", product: "Προϊόντα", concept: "Templates" }, filtersLabel: "Φίλτρα έργων", contact: "Έχετε ένα έργο στο μυαλό σας;", contactLink: "Πώς μπορούμε να βοηθήσουμε;", contactSub: "ΚΑΝΤΕ ΚΛΙΚ · ΓΡΗΓΟΡΗ ΑΠΑΝΤΗΣΗ" },
} as const;

export default function ProjectsIndex() {
  const { lang } = useLang();
  const c = copy[lang];
  const [filter, setFilter] = useState<Filter>("all");
  const visible = projects.filter((project) => filter === "all" || project.category === filter);

  return <main className="projects-page">
    <section className="projects-hero">
      <div className="projects-hero__image" aria-hidden="true"><img src="/portfolio/dreambug.webp" alt="" /></div>
      <div className="projects-hero__shade" />
      <div className="projects-hero__copy">
        <p>// {c.eyebrow}</p>
        <h1>{c.title}</h1>
        <div><p>{c.sub}</p></div>
      </div>
    </section>

    <section className="projects-index" aria-label={c.eyebrow}>
      <div className="projects-filters" role="group" aria-label={c.filtersLabel}>
        {(Object.keys(c.filters) as Filter[]).map((key) => <button key={key} type="button" className={filter === key ? "is-active" : ""} aria-pressed={filter === key} onClick={() => setFilter(key)}>{c.filters[key]}</button>)}
      </div>

      <div className={g.grid}>
        {visible.map((project, index) => (
          <a className={g.card} key={project.name} href={project.href} target="_blank" rel="noreferrer">
            <div className={g.shot}>
              <img src={project.image} alt={`${project.name} — ${project[lang].type}`} loading="lazy" />
              <span className={g.num}>{String(index + 1).padStart(2, "0")}</span>
              <span className={g.open} aria-hidden="true">↗</span>
            </div>
            <div className={g.meta}>
              <span className={g.name} translate="no">{project.name}</span>
              <span className={g.tags}>{project[lang].type}<span className={g.year}>{project[lang].year}</span></span>
            </div>
          </a>
        ))}
      </div>
    </section>

    <section className="projects-coda">
      <p>{c.contact}</p>
      <Link className="hero-cta hero-cta--inline" href="/assistant">
        <span className="hero-cta__sheen" aria-hidden="true" />
        <span className="hero-cta__main">
          <span className="hero-cta__title">{c.contactLink}</span>
          <span className="hero-cta__sub">{c.contactSub}</span>
        </span>
      </Link>
    </section>
  </main>;
}
