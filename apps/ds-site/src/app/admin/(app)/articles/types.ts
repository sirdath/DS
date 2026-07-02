export type ArticleStatus = 'draft' | 'review' | 'published'
export type ArticleLang = 'el' | 'en'

export interface AdminArticle {
  id: string
  slug: string
  lang: ArticleLang
  hreflangGroup: string
  title: string
  description: string
  bodyMd: string
  topic: string
  status: ArticleStatus
  publishedAt: string | null
  createdAt: string
  updatedAt: string
}
