import type { MetadataRoute } from 'next'
import { SITE_URL } from './blog/lib/blog-source'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/products', '/p/', '/clients'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
