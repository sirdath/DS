import type { Metadata } from 'next'
import PageChrome from '../_site-chrome'
import { BlogIndexView, type BlogIndexItem } from './blog-index-view'
import { formatArticleDate, loadPublishedArticles, SITE_URL } from './lib/blog-source'
import './blog.css'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Blogs · DS2, Digital Solutions Consulting',
  description:
    'Practical, honest articles on websites, applied AI and running a business online, from a senior team in Athens and London.',
  alternates: { canonical: `${SITE_URL}/blog` },
}

export default async function BlogIndexPage() {
  const articles = await loadPublishedArticles()
  // Dates are formatted here, not in the view: blog-source.ts is `server-only`,
  // and the view has to be a client component to follow the EN/ΕΛ toggle.
  const items: BlogIndexItem[] = articles.map((a) => ({
    id: a.id,
    slug: a.slug,
    lang: a.lang,
    title: a.title,
    description: a.description,
    topic: a.topic,
    date: formatArticleDate(a.publishedAt, a.lang),
  }))
  return (
    <PageChrome>
      <BlogIndexView items={items} />
    </PageChrome>
  )
}
