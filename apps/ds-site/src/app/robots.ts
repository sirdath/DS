import type { MetadataRoute } from 'next'
import { SITE_URL } from './blog/lib/blog-source'

/**
 * Named AI-training, AI-assistant and bulk-scraping crawlers we ask to stay off
 * the site entirely.
 *
 * This is an honour-system signal, not enforcement. A crawler that ignores
 * robots.txt is not stopped by anything here. It only covers bots that publish a
 * token and respect it.
 *
 * Deliberately NOT listed, so they keep falling through to the `*` rule below
 * and keep crawling normally:
 *   - Googlebot, Bingbot and every other conventional search crawler.
 *   - Applebot (Siri / Spotlight / Safari search). Only Applebot-Extended,
 *     Apple's separate AI-training token, is blocked.
 *   - OAI-SearchBot, Claude-SearchBot, meta-webindexer, PerplexityBot. These
 *     are the answer-engine citation crawlers, so blocking them would remove
 *     us from ChatGPT / Claude / Meta AI / Perplexity answers rather than
 *     protect anything.
 *   - facebookexternalhit, which builds link previews when someone shares a DS
 *     page. Blocking it breaks those previews.
 *   - SemrushBot and AhrefsBot, which are our own SEO tooling.
 *
 * Tokens are matched case-insensitively by the robots.txt spec, so the casing
 * below is the vendor-documented spelling rather than a functional requirement.
 */
const AI_CRAWLER_USER_AGENTS = [
  // OpenAI
  'GPTBot',
  'ChatGPT-User',
  // Anthropic. ClaudeBot and Claude-User are current, the other two are the
  // legacy tokens Anthropic used before ClaudeBot and are kept for old crawlers.
  'ClaudeBot',
  'Claude-User',
  'anthropic-ai',
  'Claude-Web',
  // Google. Google-Extended is training-only and is documented as having no
  // effect on Google Search inclusion or ranking. Googlebot is untouched.
  'Google-Extended',
  // Apple. Training-only token, separate from the Applebot search crawler.
  'Applebot-Extended',
  'FacebookBot',
  'meta-externalagent',
  'meta-externalfetcher',
  // ByteDance
  'Bytespider',
  'TikTokSpider',
  // Perplexity. PerplexityBot (answer-citation indexing) is deliberately left
  // off this list -- blocking it would remove DS2 from Perplexity's answers,
  // the same reason OAI-SearchBot/Claude-SearchBot are left off above.
  // Perplexity-User (live fetch when a person asks Perplexity something)
  // stays blocked, consistent with ChatGPT-User/Claude-User above.
  'Perplexity-User',
  // Common Crawl, whose dataset is a primary source of LLM training corpora.
  'CCBot',
  // Amazon
  'Amazonbot',
  'bedrockbot',
  // Other model developers
  'MistralAI-User',
  'cohere-ai',
  'cohere-training-data-crawler',
  'DeepSeekBot',
  'PanguBot',
  'TongyiBot',
  'Kimi-User',
  'YandexAdditional',
  'YandexAdditionalBot',
  'AI2Bot',
  'Ai2Bot-Dolma',
  'YouBot',
  // Data brokers and dataset builders that resell crawled content for training.
  'omgili',
  'omgilibot',
  'Webzio-Extended',
  'Brightbot',
  'Diffbot',
  'ImagesiftBot',
  'img2dataset',
  'LAIONDownloader',
  'Timpibot',
  'VelenPublicWebCrawler',
  'YaK',
  // Generic scraping frameworks and crawl-as-a-service agents.
  'FirecrawlAgent',
  'Scrapy',
  // Semrush's AI content tools, distinct from the SemrushBot SEO crawler.
  'SemrushBot-OCOB',
  'SemrushBot-SWA',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/api', '/products', '/p/', '/clients'],
      },
      {
        userAgent: AI_CRAWLER_USER_AGENTS,
        disallow: '/',
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
