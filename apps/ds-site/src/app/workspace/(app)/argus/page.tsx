import Link from 'next/link'
import { DEMO_ARGUS, type ArgusCompetitor, type ArgusMovement } from './demo-data'
import './argus.css'

const TYPE_LABEL: Record<ArgusMovement['type'], string> = {
  pricing: 'Pricing',
  offer: 'Offer',
  content: 'Content',
  seo: 'SEO',
  social: 'Social',
  reviews: 'Reviews',
  hiring: 'Hiring',
}

function MovementRow({ m }: { m: ArgusMovement }) {
  return (
    <li className={`wr-move is-${m.impact}`}>
      <span className="wr-move__rail" aria-hidden />
      <div className="wr-move__body">
        <div className="wr-move__top">
          <span className="wr-move__type">{TYPE_LABEL[m.type]}</span>
          <span className="wr-move__comp">{m.competitor}</span>
          <span className="wr-move__date">{m.date}</span>
        </div>
        <p className="wr-move__headline">{m.headline}</p>
        <p className="wr-move__detail">{m.detail}</p>
      </div>
    </li>
  )
}

function delta(n: number, suffix = '%'): string {
  if (n === 0) return '—'
  return `${n > 0 ? '+' : ''}${n}${suffix}`
}

function CompetitorRow({ c }: { c: ArgusCompetitor }) {
  return (
    <tr>
      <td>
        <span className="wr-comp-name">{c.name}</span>
        {c.note ? <span className="wr-comp-note">{c.note}</span> : null}
      </td>
      <td className="wr-num">
        {c.avgRate} <span className={`wr-delta ${c.rateDelta < 0 ? 'is-down' : c.rateDelta > 0 ? 'is-up' : ''}`}>{delta(c.rateDelta)}</span>
      </td>
      <td className="wr-num">{c.rating.toFixed(1)}★</td>
      <td className="wr-num">{c.reviews}</td>
      <td className="wr-num">+{c.velocity}</td>
      <td className="wr-num">
        {c.instagram} <span className={`wr-delta ${c.followerDelta > 0 ? 'is-up' : ''}`}>{delta(c.followerDelta, 'k')}</span>
      </td>
    </tr>
  )
}

export default function ArgusWorkspacePage() {
  const a = DEMO_ARGUS
  const highCount = a.movements.filter((m) => m.impact === 'high').length

  return (
    <>
      <Link href="/workspace" className="ws-back">
        ← All tools
      </Link>

      <div className="ws-head">
        <span className="ws-head__eyebrow">Argus · Competitor watch</span>
        <h1 className="ws-head__title">This week&rsquo;s movements</h1>
        <p className="ws-head__sub">
          Argus watches your competitors — rates, offers, content, search, social and reviews — and surfaces what
          changed and what to do about it. One briefing a week.
        </p>
      </div>

      <div className="ws-demo-banner">
        <span className="ws-demo-banner__tag">Preview</span>
        <span className="ws-demo-banner__text">
          Example briefing for a demo hotel — the scraper isn&rsquo;t wired yet; this is how Argus will look.
        </span>
      </div>

      <div className="wr">
        <div className="wr-bar">
          <span>
            <strong translate="no">{a.business}</strong> · {a.location}
          </span>
          <span className="wr-dot">·</span>
          <span>{a.competitor_count} competitors</span>
          <span className="wr-dot">·</span>
          <span>{a.week_of}</span>
          {highCount > 0 ? <span className="wr-flag">{highCount} to act on</span> : null}
        </div>

        <section className="wr-card wr-brief">
          <h3 className="wr-h3">The briefing</h3>
          <p>{a.summary}</p>
        </section>

        <div className="wr-cols">
          <section className="wr-card wr-feed">
            <h3 className="wr-h3">Movements</h3>
            <ul className="wr-moves">
              {a.movements.map((m, i) => (
                <MovementRow key={i} m={m} />
              ))}
            </ul>
          </section>

          <section className="wr-card wr-side">
            <h3 className="wr-h3">Do this next</h3>
            <ol className="wr-recs">
              {a.recommendations.map((r, i) => (
                <li key={i}>
                  <span className="wr-rank">{i + 1}</span>
                  <div>
                    <p className="wr-rec-action">{r.action}</p>
                    <p className="wr-rec-why">{r.rationale}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        </div>

        <section className="wr-card">
          <h3 className="wr-h3">Competitor board</h3>
          <div className="wr-table-wrap">
            <table className="wr-table">
              <thead>
                <tr>
                  <th>Competitor</th>
                  <th className="wr-num">Avg rate</th>
                  <th className="wr-num">Rating</th>
                  <th className="wr-num">Reviews</th>
                  <th className="wr-num">New</th>
                  <th className="wr-num">Instagram</th>
                </tr>
              </thead>
              <tbody>
                {a.competitors.map((c) => (
                  <CompetitorRow key={c.url} c={c} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  )
}
