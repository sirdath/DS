import type { MetadataRoute } from 'next'
import { loadPublishedArticles, SITE_URL } from './blog/lib/blog-source'

export const revalidate = 3600

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE_URL}/about`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/portfolio`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/tools`, changeFrequency: 'monthly', priority: 0.7 },
    { url: `${SITE_URL}/blog`, changeFrequency: 'daily', priority: 0.8 },
  ]
  const articles = await loadPublishedArticles(1000)
  const articleRoutes: MetadataRoute.Sitemap = articles.map((a) => ({
    url: `${SITE_URL}/blog/${a.slug}`,
    lastModified: a.updatedAt || a.publishedAt || undefined,
    changeFrequency: 'monthly',
    priority: 0.6,
  }))
  return [...staticRoutes, ...articleRoutes]
}
