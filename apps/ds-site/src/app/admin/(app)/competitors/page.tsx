import { loadCompetitors } from './lib/competitors-source'
import { CompetitorsClient } from './competitors-client'
import './competitors.css'

export const dynamic = 'force-dynamic'

export default async function CompetitorsPage() {
  const competitors = await loadCompetitors()
  return (
    <div className="admin-container">
      <div className="ds-page-header">
        <p className="ds-page-header__eyebrow">DS2 · Competitors</p>
        <h1 className="ds-page-header__title">Competitor intelligence</h1>
        <p className="ds-page-header__sub">
          Scan agencies offering services like ours. Each scan scrapes their site and analyses what they do well, what
          they offer that we don&rsquo;t, and what we could build to close the gap.
        </p>
      </div>
      <CompetitorsClient competitors={competitors} />
    </div>
  )
}
