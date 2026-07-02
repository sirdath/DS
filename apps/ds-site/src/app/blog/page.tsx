import type { Metadata } from 'next'
import Link from 'next/link'
import PageChrome from '../_site-chrome'
import { formatArticleDate, loadPublishedArticles, SITE_URL } from './lib/blog-source'
import { NewsletterForm } from './newsletter-form'
import './blog.css'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Blog — DS2, Digital Solutions Consulting',
  description:
    'Practical, honest articles on websites, applied AI and running a business online — from a senior team in Athens and London.',
  alternates: { canonical: `${SITE_URL}/blog` },
}

export default async function BlogIndexPage() {
  const articles = await loadPublishedArticles()
  return (
    <PageChrome>
      <main className="section section--first blog">
        <div className="wrap">
          <div className="section-head reveal">
            <div className="eyebrow">DS2 · Blog</div>
            <h2 className="section-title">
              Notes that hold up<em> in practice</em>
            </h2>
            <p className="section-sub">
              What things really cost, what creates risk, and what we would do differently — for websites, applied AI
              and running a business online. In Greek and English.
            </p>
          </div>

          {articles.length === 0 ? (
            <p className="blog-empty">Nothing published yet — the first articles are on their way.</p>
          ) : (
            <div className="blog-list">
              {articles.map((a) => (
                <article className="blog-row reveal" key={a.id}>
                  <div className="blog-row__meta">
                    <span className="blog-row__date">{formatArticleDate(a.publishedAt, a.lang)}</span>
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
            <NewsletterForm lang="en" />
          </div>
        </div>
      </main>
    </PageChrome>
  )
}
