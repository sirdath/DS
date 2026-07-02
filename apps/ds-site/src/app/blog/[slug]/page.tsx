import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { renderMarkdown } from '@/app/admin/(app)/notes/markdown'
import PageChrome from '../../_site-chrome'
import {
  formatArticleDate,
  getPublishedArticle,
  loadRelatedArticles,
  SITE_URL,
  type BlogArticle,
} from '../lib/blog-source'
import { NewsletterForm } from '../newsletter-form'
import '../blog.css'

export const revalidate = 3600

const CTA = {
  en: {
    eyebrow: 'A note from us',
    body: 'Thinking about something like this for your business? We work best when we can be honest early — even if that means challenging the initial idea. Tell us what you are planning and we will say what creates risk, what it should cost, and what we would do differently.',
    button: 'Talk to us',
    related: 'Related articles',
    back: 'All articles',
  },
  el: {
    eyebrow: 'Ένα σημείωμα από εμάς',
    body: 'Σκέφτεστε κάτι αντίστοιχο για την επιχείρησή σας; Δουλεύουμε καλύτερα όταν μπορούμε να είμαστε ειλικρινείς από νωρίς — ακόμα κι αν αυτό σημαίνει να αμφισβητήσουμε την αρχική ιδέα. Πείτε μας τι σχεδιάζετε και θα σας πούμε τι δημιουργεί ρίσκο, τι πρέπει να κοστίζει και τι θα κάναμε διαφορετικά.',
    button: 'Μιλήστε μας',
    related: 'Σχετικά άρθρα',
    back: 'Όλα τα άρθρα',
  },
} as const

interface Params {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { slug } = await params
  const article = await getPublishedArticle(slug)
  if (!article) return { title: 'Article not found — DS2' }
  const title = `${article.title} — DS2`
  return {
    title,
    description: article.description,
    alternates: { canonical: `${SITE_URL}/blog/${article.slug}` },
    openGraph: {
      title,
      description: article.description,
      type: 'article',
      url: `${SITE_URL}/blog/${article.slug}`,
      publishedTime: article.publishedAt ?? undefined,
      locale: article.lang === 'el' ? 'el_GR' : 'en_GB',
    },
  }
}

function articleJsonLd(article: BlogArticle): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    inLanguage: article.lang,
    datePublished: article.publishedAt ?? undefined,
    dateModified: article.updatedAt || undefined,
    mainEntityOfPage: `${SITE_URL}/blog/${article.slug}`,
    author: { '@type': 'Organization', name: 'DS2, Digital Solutions Consulting', url: SITE_URL },
    publisher: { '@type': 'Organization', name: 'DS2, Digital Solutions Consulting', url: SITE_URL },
    // '<' escaped so article text can never close the JSON-LD <script> early.
  }).replace(/</g, '\\u003c')
}

export default async function BlogArticlePage({ params }: Params) {
  const { slug } = await params
  const article = await getPublishedArticle(slug)
  if (!article) notFound()
  const related = await loadRelatedArticles(article.topic, article.id)
  const t = CTA[article.lang]

  return (
    <PageChrome>
      <main className="section section--first blog">
        <div className="wrap blog-article" lang={article.lang}>
          <Link className="blog-back" href="/blog">
            ← {t.back}
          </Link>
          <header className="blog-article__head">
            <div className="blog-row__meta">
              <span className="blog-row__date">{formatArticleDate(article.publishedAt, article.lang)}</span>
              {article.topic ? <span className="blog-tag">{article.topic}</span> : null}
            </div>
            <h1 className="blog-article__title">{article.title}</h1>
            {article.description ? <p className="blog-article__lead">{article.description}</p> : null}
          </header>

          {/* renderMarkdown escapes its input before adding a fixed tag set, so
              this HTML cannot carry injected markup (see notes/markdown.ts). */}
          <div className="blog-body" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.bodyMd) }} />

          <aside className="blog-cta">
            <div className="eyebrow">{t.eyebrow}</div>
            <p className="blog-cta__body">{t.body}</p>
            <Link className="blog-cta__btn" href="/#contact">
              {t.button}
            </Link>
          </aside>

          {related.length > 0 ? (
            <section className="blog-related" aria-label={t.related}>
              <h2 className="blog-related__title">{t.related}</h2>
              <div className="blog-related__grid">
                {related.map((r) => (
                  <Link className="blog-related__card" key={r.id} href={`/blog/${r.slug}`}>
                    <span className="blog-row__date">{formatArticleDate(r.publishedAt, r.lang)}</span>
                    <span className="blog-related__name">{r.title}</span>
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <NewsletterForm lang={article.lang} />
        </div>
      </main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: articleJsonLd(article) }} />
    </PageChrome>
  )
}
