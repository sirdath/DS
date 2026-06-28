import {
  ExampleObserver,
  formatMoney,
  getSample,
  runWeeklyBriefing,
  type BoardRow,
  type Movement,
  type MovementType,
} from '@ds/argus'
import { DEMO_BRIEFING_PROSE } from './demo-data'
import './argus.css'

const TYPE_LABEL: Record<MovementType, string> = {
  pricing: 'Pricing',
  offer: 'Offer',
  content: 'Content',
  seo: 'SEO',
  social: 'Social',
  reviews: 'Reviews',
  hiring: 'Hiring',
}

function MovementRow({ m }: { m: Movement }) {
  return (
    <li className={`wr-move is-${m.impact}`}>
      <span className="wr-move__rail" aria-hidden />
      <div className="wr-move__body">
        <div className="wr-move__top">
          <span className="wr-move__type">{TYPE_LABEL[m.type]}</span>
          <span className="wr-move__comp" translate="no">
            {m.competitorName}
          </span>
          <span className="wr-move__impact" data-impact={m.impact}>
            {m.impact}
          </span>
        </div>
        <p className="wr-move__headline">{m.headline}</p>
        <p className="wr-move__detail">{m.detail}</p>
      </div>
    </li>
  )
}

function delta(n: number, suffix = '%'): string {
  if (n === 0) return '–'
  return `${n > 0 ? '+' : ''}${n}${suffix}`
}

function CompetitorRow({ c }: { c: BoardRow }) {
  return (
    <tr>
      <td>
        <span className="wr-comp-name" translate="no">
          {c.name}
        </span>
        {c.note ? <span className="wr-comp-note">{c.note}</span> : null}
      </td>
      <td className="ds-num">
        {c.avgRate != null ? formatMoney(c.avgRate, c.currency) : '–'}{' '}
        <span className={`wr-delta ${c.rateDeltaPct < 0 ? 'is-down' : c.rateDeltaPct > 0 ? 'is-up' : ''}`}>{delta(c.rateDeltaPct)}</span>
      </td>
      <td className="ds-num">{c.rating != null ? `${c.rating.toFixed(1)}★` : '–'}</td>
      <td className="ds-num">{c.reviewCount ?? '–'}</td>
      <td className="ds-num">+{c.reviewVelocity}</td>
      <td className="ds-num">
        {c.instagramFollowers != null ? c.instagramFollowers.toLocaleString('en') : '–'}{' '}
        <span className={`wr-delta ${c.followerDeltaPct > 0 ? 'is-up' : ''}`}>{delta(c.followerDeltaPct)}</span>
      </td>
    </tr>
  )
}

export default async function ArgusWorkspacePage() {
  const s = getSample()
  // Movements + board are computed live by the engine (scan-only — no key needed).
  const { briefing } = await runWeeklyBriefing({
    business: s.business,
    competitors: s.competitors,
    observer: new ExampleObserver(s.currMetrics),
    prevSnapshots: s.prevSnapshots,
    weekOf: s.weekOf,
    scanOnly: true,
  })

  // Prose is the bundled example until a per-client observer + key are wired.
  const summary = briefing.summary || DEMO_BRIEFING_PROSE.summary
  const recommendations = briefing.recommendations.length ? briefing.recommendations : DEMO_BRIEFING_PROSE.recommendations
  const highCount = briefing.movements.filter((m) => m.impact === 'high').length
  const weekLabel = new Date(`${briefing.weekOf}T00:00:00Z`).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <>

      <div className="ws-head">
        <span className="ws-head__eyebrow">Argus · Competitor watch</span>
        <h1 className="ws-head__title">This week&rsquo;s movements</h1>
        <p className="ws-head__sub">
          Argus watches your competitors, rates, offers, content, search, social and reviews, detects what changed
          week-over-week, and tells you what to do about it. One briefing a week.
        </p>
      </div>

      <div className="ws-demo-banner">
        <span className="ws-demo-banner__tag">Preview</span>
        <span className="ws-demo-banner__text">
          Movements &amp; the board are computed live by the engine from a demo hotel&rsquo;s metrics; the briefing prose
          is an example. Connect a client&rsquo;s competitors to make it real.
        </span>
      </div>

      <div className="wr">
        <div className="wr-bar">
          <span>
            <strong translate="no">{briefing.business}</strong> · {briefing.location}
          </span>
          <span className="wr-dot">·</span>
          <span>{briefing.competitorCount} competitors</span>
          <span className="wr-dot">·</span>
          <span>week of {weekLabel}</span>
          {highCount > 0 ? <span className="wr-flag">{highCount} to act on</span> : null}
        </div>

        <section className="ds-card wr-brief">
          <h3 className="ds-card__title">The briefing</h3>
          <p>{summary}</p>
        </section>

        <div className="wr-cols">
          <section className="ds-card">
            <h3 className="ds-card__title">Movements</h3>
            <ul className="wr-moves">
              {briefing.movements.map((m, i) => (
                <MovementRow key={`${m.competitorId}-${m.type}-${i}`} m={m} />
              ))}
            </ul>
          </section>

          <section className="ds-card">
            <h3 className="ds-card__title">Do this next</h3>
            <ol className="wr-recs">
              {recommendations.map((r, i) => (
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

        <section className="ds-card">
          <h3 className="ds-card__title">Competitor board</h3>
          <div className="ds-table-wrap">
            <table className="ds-table" style={{ minWidth: 540 }}>
              <thead>
                <tr>
                  <th>Competitor</th>
                  <th className="ds-num">Avg rate</th>
                  <th className="ds-num">Rating</th>
                  <th className="ds-num">Reviews</th>
                  <th className="ds-num">New</th>
                  <th className="ds-num">Instagram</th>
                </tr>
              </thead>
              <tbody>
                {briefing.board.map((c) => (
                  <CompetitorRow key={c.competitorId} c={c} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </>
  )
}
