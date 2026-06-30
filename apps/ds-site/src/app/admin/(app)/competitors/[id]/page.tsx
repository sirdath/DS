import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCompetitor } from '../lib/competitors-source'
import '../competitors.css'

export const dynamic = 'force-dynamic'

export default async function CompetitorDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await getCompetitor(id)
  if (!c) notFound()
  const a = c.analysis

  return (
    <div className="admin-container">
      <Link href="/admin/competitors" className="cmp-back">
        ← All competitors
      </Link>
      <div className="ds-page-header">
        <p className="ds-page-header__eyebrow">DS2 · Competitor</p>
        <h1 className="ds-page-header__title" translate="no">
          {c.name}
        </h1>
        <p className="ds-page-header__sub">
          <a href={c.url} target="_blank" rel="noopener noreferrer">
            {c.url}
          </a>
        </p>
      </div>

      {!a ? (
        <p className="ds-empty">Not analysed yet. Go back and press Scan.</p>
      ) : (
        <div className="cmp-detail">
          <section className="ds-card">
            <p className="cmp-lead">{a.summary}</p>
          </section>

          <div className="cmp-cols">
            <section className="ds-card">
              <h3 className="ds-card__title">Their website, what works</h3>
              <ul className="cmp-list">
                {a.website.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
            <section className="ds-card cmp-take">
              <h3 className="ds-card__title">What we can take / improve</h3>
              <ul className="cmp-list">
                {a.website.takeaways.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          </div>

          <div className="cmp-cols">
            <section className="ds-card">
              <h3 className="ds-card__title">Services they offer</h3>
              <ul className="cmp-list">
                {a.services.offerings.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
            <section className="ds-card cmp-gap">
              <h3 className="ds-card__title">Gaps vs DS2 (they have, we don&rsquo;t)</h3>
              <ul className="cmp-list">
                {a.services.gaps.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          </div>

          <section className="ds-card">
            <h3 className="ds-card__title">Pricing</h3>
            <p className="cmp-pricing">{a.pricing}</p>
          </section>

          <section className="ds-card">
            <h3 className="ds-card__title">Opportunities, what we could build to close the gap</h3>
            <ol className="cmp-opps">
              {a.opportunities.map((o, i) => (
                <li key={i}>
                  <span className="cmp-opp__rank">{i + 1}</span>
                  <div>
                    <p className="cmp-opp__title">{o.title}</p>
                    <p className="cmp-opp__detail">{o.detail}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>
      )}
    </div>
  )
}
