"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useLang } from "../i18n";

type Filter = "all" | "website" | "product" | "concept";

const projects = [
  { name: "GlobalTeamPlans", category: "website" as const, year: "2026", image: "/portfolio/globalteamplans.png", href: "https://globalteamplans.com", en: { type: "Website · SEO · Lead generation", line: "A specialist global service made easier to understand, trust and choose." }, el: { type: "Ιστοσελίδα · SEO · Lead generation", line: "Μια εξειδικευμένη διεθνής υπηρεσία έγινε πιο εύκολη στην κατανόηση, την εμπιστοσύνη και την επιλογή." } },
  { name: "dataportfolio.co.uk", category: "product" as const, year: "2026", image: "/portfolio/dataportfolio.png", href: "https://dataportfolio.co.uk", en: { type: "SaaS · Product · Platform", line: "A product idea turned into a clear, working portfolio-building platform." }, el: { type: "SaaS · Προϊόν · Πλατφόρμα", line: "Μια ιδέα προϊόντος έγινε μια καθαρή, λειτουργική πλατφόρμα δημιουργίας portfolio." } },
  { name: "Atelier", category: "concept" as const, year: "Ready to tailor", image: "/templates/atelier.png", href: "/templates/atelier.png", en: { type: "Concept · Fashion commerce", line: "A premium buying journey ready to be shaped around a fashion or lifestyle brand." }, el: { type: "Concept · Fashion commerce", line: "Μια premium εμπειρία αγοράς έτοιμη να προσαρμοστεί σε fashion ή lifestyle brand." } },
  { name: "Padel City", category: "concept" as const, year: "Ready to tailor", image: "/templates/padel.png", href: "/templates/padel.png", en: { type: "Concept · Booking experience", line: "Availability, booking, payment and retention shown as one direct customer journey." }, el: { type: "Concept · Εμπειρία κρατήσεων", line: "Διαθεσιμότητα, κράτηση, πληρωμή και διατήρηση πελατών σε μία άμεση διαδρομή." } },
];

const copy = {
  en: { eyebrow: "Selected work and working directions", title: "Projects that make the value visible.", sub: "Real client work sits beside ready-to-tailor directions. The label always tells you which is which.", cue: "Move across a project to preview it", filters: { all: "All", website: "Websites", product: "Products", concept: "Concepts" }, open: "Open project", contact: "Have a project in mind?", contactLink: "Tell us what you need" },
  el: { eyebrow: "Επιλεγμένα έργα και δημιουργικές κατευθύνσεις", title: "Έργα που κάνουν την αξία ορατή.", sub: "Πραγματική δουλειά πελατών μαζί με κατευθύνσεις έτοιμες για προσαρμογή. Η ετικέτα ξεκαθαρίζει πάντα τι βλέπετε.", cue: "Περάστε πάνω από ένα έργο για προεπισκόπηση", filters: { all: "Όλα", website: "Ιστοσελίδες", product: "Προϊόντα", concept: "Concepts" }, open: "Άνοιγμα έργου", contact: "Έχετε ένα έργο στο μυαλό σας;", contactLink: "Πείτε μας τι χρειάζεστε" },
} as const;

export default function ProjectsIndex() {
  const { lang } = useLang();
  const c = copy[lang];
  const [filter, setFilter] = useState<Filter>("all");
  const visible = projects.filter((project) => filter === "all" || project.category === filter);

  return <main className="projects-page">
    <section className="projects-hero">
      <div className="projects-hero__image" aria-hidden="true"><img src="/templates/padel.png" alt="" /></div>
      <div className="projects-hero__shade" />
      <div className="projects-hero__copy">
        <p>// {c.eyebrow}</p>
        <h1>{c.title}</h1>
        <div><span>{c.cue}</span><p>{c.sub}</p></div>
      </div>
    </section>

    <section className="projects-index" aria-label={c.eyebrow}>
      <div className="projects-filters" role="group" aria-label="Project filters">
        {(Object.keys(c.filters) as Filter[]).map((key) => <button key={key} type="button" className={filter === key ? "is-active" : ""} aria-pressed={filter === key} onClick={() => setFilter(key)}>{c.filters[key]}</button>)}
      </div>
      <div className="projects-list">
        {visible.map((project, index) => <a className="projects-row" key={project.name} href={project.href} target="_blank" rel="noreferrer">
          <span className="projects-row__number">{String(index + 1).padStart(2, "0")}</span>
          <span className="projects-row__main"><strong>{project.name}</strong><small>{project[lang].line}</small></span>
          <span className="projects-row__type">{project[lang].type}</span>
          <span className="projects-row__year">{project.year}</span>
          <span className="projects-row__arrow" aria-label={c.open}>↗</span>
          <span className="projects-row__preview" aria-hidden="true"><img src={project.image} alt="" /></span>
        </a>)}
      </div>
    </section>

    <section className="projects-coda">
      <p>{c.contact}</p><a href="/assistant">{c.contactLink}<span>→</span></a>
    </section>
  </main>;
}
