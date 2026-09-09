'use client'

import Link from 'next/link'
import { useLang } from '../i18n'
import { NewsletterForm } from './newsletter-form'

/** One row of the index. `date` is pre-formatted on the server because
 *  blog-source.ts is `server-only`; everything else is passed straight through. */
export interface BlogIndexItem {
  id: string
  slug: string
  lang: 'el' | 'en'
  title: string
  description: string
  topic: string
  date: string
}

/** Page-local copy, same shape as portfolio/projects-index.tsx: this wording is
 *  used nowhere else, so it lives beside the page instead of growing the
 *  already 1400-line i18n-dict.ts. */
const copy = {
  en: {
    eyebrow: 'DS2 · Blogs',
    title: 'Notes that hold up',
    titleEm: ' in practice',
    sub: 'What things really cost, what creates risk, and what we would do differently, for websites, applied AI and running a business online. In Greek and English.',
    empty: 'Nothing published yet, the first articles are on their way.',
  },
  el: {
    eyebrow: 'DS2 · Άρθρα',
    title: 'Σημειώσεις που αντέχουν',
    titleEm: ' στην πράξη',
    sub: 'Τι κοστίζουν πραγματικά τα πράγματα, τι δημιουργεί ρίσκο και τι θα κάναμε διαφορετικά, για websites, εφαρμοσμένη AI και τη λειτουργία μιας επιχείρησης online. Στα ελληνικά και στα αγγλικά.',
    empty: 'Δεν έχει δημοσιευτεί κάτι ακόμη, τα πρώτα άρθρα ετοιμάζονται.',
  },
} as const

/** Body of /blog. Client-side so the page follows the EN/ΕΛ toggle like every
 *  other page on the site; the articles themselves are fetched and formatted on
 *  the server and handed down, which keeps /blog statically renderable with ISR
 *  (see the note at the top of lib/blog-source.ts). */
export function BlogIndexView({ items }: { items: BlogIndexItem[] }) {
  const { lang } = useLang()
  const c = copy[lang]
  return (
    <main className="section section--first blog">
      <div className="wrap">
        <div className="section-head reveal">
          <div className="eyebrow">{c.eyebrow}</div>
          <h1 className="section-title">
            {c.title}
            <em>{c.titleEm}</em>
          </h1>
          <p className="section-sub">{c.sub}</p>
        </div>

        {items.length === 0 ? (
          <p className="blog-empty">{c.empty}</p>
        ) : (
          <div className="blog-list">
            {items.map((a) => (
              <article className="blog-row reveal" key={a.id}>
                <div className="blog-row__meta">
                  <span className="blog-row__date">{a.date}</span>
                  {a.topic ? <span className="blog-tag">{a.topic}</span> : null}
                  <span className="blog-tag blog-tag--lang">{a.lang === 'el' ? 'EL' : 'EN'}</span>
                </div>
                <h3 className="blog-row__title">
                  <Link href={`/blog/${a.slug}`}>{a.title}</Link>
                </h3>
                {a.description ? <p className="blog-row__desc">{a.description}</p> : null}
              </article>
            ))}
          </div>
        )}

        <div className="reveal">
          <NewsletterForm lang={lang} />
        </div>
      </div>
    </main>
  )
}
