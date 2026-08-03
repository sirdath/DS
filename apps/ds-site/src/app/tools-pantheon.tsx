"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import Link from "next/link";
import { useLang } from "./i18n";
import s from "./tools-pantheon.module.css";

type Loc = { en: string; el: string };
type Tool = { god: string; slug: string; role: Loc; line: Loc };

// slug matches the tool poster + the /tools/[slug] detail page
const TOOLS: Tool[] = [
  {
    god: "Xenia",
    slug: "ai-receptionist",
    role: { en: "AI receptionist", el: "AI ρεσεψιονίστ" },
    line: {
      en: "Answers enquiries and books appointments, in Greek and English, around the clock.",
      el: "Απαντά και κλείνει ραντεβού, στα ελληνικά και τα αγγλικά, όλο το 24ωρο.",
    },
  },
  {
    god: "Plutus",
    slug: "collections",
    role: { en: "Collections", el: "Εισπράξεις" },
    line: {
      en: "Predicts who pays late, ranks who to chase, and drafts the reminder. You approve.",
      el: "Προβλέπει ποιος πληρώνει αργά, κατατάσσει ποιον να κυνηγήσετε, και συντάσσει την υπενθύμιση. Εσείς εγκρίνετε.",
    },
  },
  {
    god: "Fama",
    slug: "review-intelligence",
    role: { en: "Review intelligence", el: "Ανάλυση κριτικών" },
    line: {
      en: "Every review, every platform, turned into one clear picture and a to-do list.",
      el: "Κάθε κριτική, κάθε πλατφόρμα, σε μία καθαρή εικόνα και μια λίστα ενεργειών.",
    },
  },
  {
    god: "Panoptes",
    slug: "site-selection",
    role: { en: "Site selection", el: "Επιλογή τοποθεσίας" },
    line: {
      en: "Demand, competition and access, scored across a city on an interactive map.",
      el: "Ζήτηση, ανταγωνισμός και πρόσβαση, βαθμολογημένα σε μια πόλη σε διαδραστικό χάρτη.",
    },
  },
  {
    god: "Aegis",
    slug: "site-audit",
    role: { en: "Site audit", el: "Έλεγχος ιστότοπου" },
    line: {
      en: "Speed, accessibility and SEO, with the handful of fixes that actually matter.",
      el: "Ταχύτητα, προσβασιμότητα και SEO, με τις λίγες διορθώσεις που πραγματικά μετράνε.",
    },
  },
  {
    god: "Argus",
    slug: "competitor-watch",
    role: { en: "Competitor watch", el: "Παρακολούθηση ανταγωνισμού" },
    line: {
      en: "Weekly intelligence on every move your market makes, before your Monday meeting.",
      el: "Εβδομαδιαία ενημέρωση για κάθε κίνηση της αγοράς σας, πριν τη συνάντηση της Δευτέρας.",
    },
  },
  {
    god: "NeuroVault",
    slug: "ai-memory",
    role: { en: "AI memory", el: "Μνήμη AI" },
    line: {
      en: "A durable, private memory layer that any AI agent can recall from. Open source.",
      el: "Ένα ανθεκτικό, ιδιωτικό επίπεδο μνήμης που κάθε AI agent μπορεί να ανακαλέσει. Open source.",
    },
  },
  {
    god: "Iris",
    slug: "newsletters",
    role: { en: "Interactive newsletters", el: "Διαδραστικά newsletter" },
    line: {
      en: "Newsletters your customers open, tap and reply to: polls, bookings and offers, in Greek and English.",
      el: "Newsletter που οι πελάτες ανοίγουν, πατούν και απαντούν: ψηφοφορίες, κρατήσεις και προσφορές, στα ελληνικά και τα αγγλικά.",
    },
  },
  {
    god: "Scrath",
    slug: "data-extraction",
    role: { en: "Data extraction", el: "Εξαγωγή δεδομένων" },
    line: {
      en: "Turns any website, even one with no export, into a clean, verified table with a source for every value.",
      el: "Μετατρέπει οποιονδήποτε ιστότοπο, ακόμη κι αυτόν χωρίς εξαγωγή, σε έναν καθαρό, επαληθευμένο πίνακα, με πηγή για κάθε τιμή.",
    },
  },
];

const COPY = {
  en: {
    eyebrow: "The pantheon",
    sub: "Productized services named after the gods who would run them. You subscribe, we run the machinery. Hover a name to meet each one.",
    open: "Open tool",
    all: "See all nine tools",
  },
  el: {
    eyebrow: "Το πάνθεον",
    sub: "Productized υπηρεσίες, με τα ονόματα των θεών που θα τις έτρεχαν. Εσείς εγγράφεστε, εμείς τρέχουμε τη μηχανή. Περάστε πάνω από ένα όνομα για να το γνωρίσετε.",
    open: "Άνοιγμα",
    all: "Δείτε και τα εννέα εργαλεία",
  },
} as const;

export default function ToolsPantheon() {
  const { lang } = useLang();
  const c = COPY[lang];
  const [active, setActive] = useState(3); // Panoptes — a strong first impression

  const a = TOOLS[active]!;

  return (
    <section className={s.pantheon} id="tools-preview" aria-label={lang === "el" ? "Τα εργαλεία μας" : "Our tools"}>
      <div className={s.aura} aria-hidden="true" />
      <div className={s.head}>
        <div className={s.eyebrow}>{c.eyebrow}</div>
        <h2 className={s.title}>
          {lang === "el" ? (
            <>Εννέα εργαλεία, <em>πάντα ενεργά</em>.</>
          ) : (
            <>Nine tools, <em>always on</em>.</>
          )}
        </h2>
        <p className={s.sub}>{c.sub}</p>
      </div>

      <div className={s.body}>
        <div className={s.names} role="tablist">
          {TOOLS.map((t, i) => (
            <button
              key={t.slug}
              type="button"
              role="tab"
              aria-selected={i === active}
              className={`${s.nameBtn}${i === active ? ` ${s.active}` : ""}`}
              onMouseEnter={() => setActive(i)}
              onFocus={() => setActive(i)}
              onClick={() => setActive(i)}
            >
              <span className={s.idx}>{String(i + 1).padStart(2, "0")}</span>
              <span className={s.role}>{t.role[lang]}</span>
              <span className={s.god} translate="no">{t.god}</span>
            </button>
          ))}
        </div>

        <div className={s.preview}>
          <div className={s.shot}>
            <img key={a.slug} src={`/tools/posters/${a.slug}.webp`} alt={`${a.god} — ${a.role[lang]}`} />
          </div>
          <div className={s.info}>
            <div>
              <div className={s.infoRole} translate="no">{a.god}</div>
              <div className={s.infoName}>{a.role[lang]}</div>
              <p className={s.infoLine}>{a.line[lang]}</p>
            </div>
            <Link className={s.open} href={`/tools/${a.slug}`}>
              {c.open} <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      <div className={s.allWrap}>
        <Link className={s.all} href="/tools">
          {c.all} <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
