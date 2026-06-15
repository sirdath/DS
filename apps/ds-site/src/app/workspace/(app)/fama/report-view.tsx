import type { FamaReport } from '@ds/fama'
import './fama.css'

const STARS = ['5', '4', '3', '2', '1'] as const

/** Humanise a snake_case theme id, e.g. "room_quality" → "Room Quality". */
function topicLabel(topic: string): string {
  return topic.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function trendPhrase(trend: number): string {
  if (trend > 0.1) return `improving · +${trend.toFixed(2)}`
  if (trend < -0.1) return `slipping · ${trend.toFixed(2)}`
  return 'holding steady'
}

export function FamaReportView({ report }: { report: FamaReport }) {
  const { business, aggregate: agg } = report
  const total = report.review_count
  const s = agg.sentiment_breakdown
  const replies = report.analyses.filter((a) => a.reply_priority === 'high')

  return (
    <div className="wf">
      {/* Headline stats */}
      <div className="wf__stats">
        <div className="wf__rating">
          <span className="wf__rating-num">{agg.rating_average.toFixed(2)}</span>
          <span className="wf__rating-star">★</span>
          <span className={`wf__trend ${agg.rating_trend < -0.1 ? 'is-down' : agg.rating_trend > 0.1 ? 'is-up' : ''}`}>
            {trendPhrase(agg.rating_trend)}
          </span>
        </div>
        <div className="wf__meta">
          <span>{total} reviews</span>
          <span className="wf__dot">·</span>
          <span>
            {report.date_range.from} → {report.date_range.to}
          </span>
          <span className="wf__dot">·</span>
          <span>
            {agg.language_breakdown.el} Greek · {agg.language_breakdown.en} English
          </span>
        </div>
      </div>

      <p className="wf__summary">{agg.overall_summary}</p>

      <div className="wf__cols">
        {/* Rating distribution */}
        <section className="wf__card">
          <h3 className="wf__h3">Ratings</h3>
          {STARS.map((star) => {
            const count = agg.rating_distribution[star] ?? 0
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            return (
              <div className="wf__bar-row" key={star}>
                <span className="wf__bar-label">{star}★</span>
                <span className="wf__bar-track">
                  <span className="wf__bar-fill" style={{ width: `${pct}%` }} />
                </span>
                <span className="wf__bar-count">{count}</span>
              </div>
            )
          })}
          <div className="wf__sentiment">
            <span className="wf__chip is-pos">{s.positive} positive</span>
            <span className="wf__chip is-neu">{s.neutral} neutral</span>
            <span className="wf__chip is-neg">{s.negative} negative</span>
          </div>
        </section>

        {/* Themes */}
        <section className="wf__card">
          <h3 className="wf__h3">Themes</h3>
          <table className="wf__table">
            <thead>
              <tr>
                <th>Theme</th>
                <th className="wf__num">Mentions</th>
                <th className="wf__num">Net</th>
              </tr>
            </thead>
            <tbody>
              {agg.themes.slice(0, 8).map((t) => {
                const net = t.positive - t.negative
                return (
                  <tr key={t.topic}>
                    <td>{topicLabel(t.topic)}</td>
                    <td className="wf__num">{t.mentions}</td>
                    <td className={`wf__num ${net < 0 ? 'is-down' : 'is-up'}`}>
                      {net > 0 ? `+${net}` : net}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      </div>

      {/* Strengths */}
      <section className="wf__block">
        <h3 className="wf__h3">What&rsquo;s working</h3>
        <ul className="wf__list">
          {agg.strengths.map((st) => (
            <li key={st.theme}>
              <span className="wf__theme">{topicLabel(st.theme)}</span>
              <span className="wf__mentions">{st.mentions} mentions</span>
              <p className="wf__quote">“{st.example}”</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Issues */}
      <section className="wf__block">
        <h3 className="wf__h3">What&rsquo;s costing you</h3>
        <ul className="wf__list">
          {agg.issues.map((issue) => (
            <li key={issue.theme}>
              <span className="wf__theme">{topicLabel(issue.theme)}</span>
              <span className="wf__mentions">{issue.mentions} mentions</span>
              <p className="wf__impact">{issue.impact}</p>
              <p className="wf__fix">
                <span className="wf__fix-label">Fix</span> {issue.recommendation}
              </p>
            </li>
          ))}
        </ul>
      </section>

      {/* Priorities */}
      <section className="wf__block">
        <h3 className="wf__h3">Do this next</h3>
        <ol className="wf__priorities">
          {agg.priorities.map((p) => (
            <li key={p.rank}>
              <span className="wf__rank">{p.rank}</span>
              <div>
                <p className="wf__action">{p.action}</p>
                <p className="wf__rationale">{p.rationale}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Reply queue */}
      {replies.length > 0 ? (
        <section className="wf__block">
          <h3 className="wf__h3">Reply queue</h3>
          <ul className="wf__replies">
            {replies.map((a) => (
              <li key={a.id}>
                <p className="wf__reply-sum">{a.summary}</p>
                <p className="wf__reply-draft">{a.reply_draft}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="wf__foot">
        {report.generated_by} · {business.name}
      </p>
    </div>
  )
}
