/**
 * /blog/rss.xml — RSS 2.0 feed of the latest 20 published articles.
 * Reads through the anon blog source (published rows only) and revalidates
 * hourly with the rest of the blog.
 */

import { loadPublishedArticles, SITE_URL } from '../lib/blog-source'

export const revalidate = 3600

function esc(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export async function GET(): Promise<Response> {
  const articles = await loadPublishedArticles(20)
  const items = articles
    .map((a) => {
      const url = `${SITE_URL}/blog/${a.slug}`
      const pub = a.publishedAt ? `<pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>` : ''
      return [
        '    <item>',
        `      <title>${esc(a.title)}</title>`,
        `      <link>${esc(url)}</link>`,
        `      <guid isPermaLink="true">${esc(url)}</guid>`,
        `      <description>${esc(a.description)}</description>`,
        a.topic ? `      <category>${esc(a.topic)}</category>` : '',
        pub ? `      ${pub}` : '',
        '    </item>',
      ]
        .filter(Boolean)
        .join('\n')
    })
    .join('\n')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DS2 — Blog</title>
    <link>${SITE_URL}/blog</link>
    <atom:link href="${SITE_URL}/blog/rss.xml" rel="self" type="application/rss+xml" />
    <description>Practical, honest articles on websites, applied AI and running a business online — Athens and London.</description>
    <language>en</language>
${items}
  </channel>
</rss>
`
  return new Response(xml, {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
