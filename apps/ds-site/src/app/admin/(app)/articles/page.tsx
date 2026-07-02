import { loadAllArticles } from './lib/articles-source'
import { ArticlesClient } from './articles-client'
import './articles.css'

export const dynamic = 'force-dynamic'
// Server actions inherit this segment config — gives the Opus draft call room on Vercel.
export const maxDuration = 300

export default async function ArticlesPage() {
  const articles = await loadAllArticles()
  return (
    <div className="admin-container">
      <div className="ds-page-header">
        <p className="ds-page-header__eyebrow">DS2 · Articles</p>
        <h1 className="ds-page-header__title">Blog engine</h1>
        <p className="ds-page-header__sub">
          AI-drafted, founder-approved. Claude writes the first draft for a target keyword; nothing goes live on
          /blog until you have read it and pressed Publish.
        </p>
      </div>
      <ArticlesClient articles={articles} />
    </div>
  )
}
