'use client'

// Type-only import — erased at compile, so the engine never enters the client bundle.
import type { AegisReport, CategoryScore, WebVital } from '@ds/aegis'
import { useState } from 'react'
import { DEMO_AEGIS_REPORT } from './demo-result'
import './aegis.css'

function scoreColor(n: number): string {
  if (n >= 90) return '#7dd3a8'
  if (n >= 50) return '#f5c451'
  return '#ff8d8d'
}
const RATING_COLOR: Record<string, string> = {
  good: '#7dd3a8',
  'needs-improvement': '#f5c451',
  poor: '#ff8d8d',
}
const SEV_CLASS: Record<string, string> = {
  critical: 'is-critical',
  serious: 'is-serious',
  moderate: 'is-moderate',
  minor: 'is-minor',
}
const CAT_LABEL: Record<string, string> = {
  performance: 'Performance',
  accessibility: 'Accessibility',
  seo: 'SEO',
  'best-practices': 'Best practices',
}

function ScoreCard({ s }: { s: CategoryScore }) {
  return (
    <div className="wg-score">
      <span className="wg-score__num" style={{ color: scoreColor(s.score) }}>
        {s.score}
      </span>
      <span className="wg-score__label">{CAT_LABEL[s.key] ?? s.key}</span>
      <span className="wg-score__track">
        <span className="wg-score__fill" style={{ width: `${s.score}%`, background: scoreColor(s.score) }} />
      </span>
    </div>
  )
}

const RATING_LABEL: Record<string, string> = {
  good: 'good',
  'needs-improvement': 'needs improvement',
  poor: 'poor',
}

function Vital({ v }: { v: WebVital }) {
  return (
    <div className="wg-vital">
      <span className="wg-vital__dot" style={{ background: RATING_COLOR[v.rating] }} aria-hidden />
      <span className="wg-vital__label">{v.label}</span>
      <span className="wg-vital__value">{v.displayValue || 'n/a'}</span>
      {/* Visible text label so status is never conveyed by the dot colour alone. */}
      <span className="wg-vital__rating" data-rating={v.rating}>
        {RATING_LABEL[v.rating] ?? v.rating}
      </span>
    </div>
  )
}

function Report({ report: r }: { report: AegisReport }) {
  return (
    <div className="wg">
      <p className="wg__url">
        {r.final_url} · {r.strategy} · {r.generated_by}
      </p>

      <div className="wg-scores">
        {r.scores.map((s) => (
          <ScoreCard key={s.key} s={s} />
        ))}
      </div>

      {r.vitals.length > 0 ? (
        <section className="wg-card">
          <h3 className="wg-h3">Core Web Vitals</h3>
          <div className="wg-vitals">
            {r.vitals.map((v) => (
              <Vital key={v.id} v={v} />
            ))}
          </div>
        </section>
      ) : null}

      {r.overall_verdict ? <p className="wg__verdict">{r.overall_verdict}</p> : null}

      {r.headline_risks.length > 0 ? (
        <section className="wg-block">
          <h3 className="wg-h3">What this is costing you</h3>
          <ul className="wg-list">
            {r.headline_risks.map((risk, i) => (
              <li key={i}>
                <span className="wg-risk">{risk.risk}</span>
                <p className="wg-why">{risk.why_it_matters}</p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {r.priorities.length > 0 ? (
        <section className="wg-block">
          <h3 className="wg-h3">Fix these first</h3>
          <ol className="wg-priorities">
            {r.priorities.map((p) => (
              <li key={p.rank}>
                <span className="wg-rank">{p.rank}</span>
                <div>
                  <p className="wg-action">
                    {p.action} <span className="wg-effort">{p.effort}</span>
                  </p>
                  <p className="wg-rationale">{p.rationale}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section className="wg-block">
        <h3 className="wg-h3">Accessibility &amp; the EU Accessibility Act</h3>
        <p className="wg-eaa">
          {r.accessibility_issue_count} accessibility issue{r.accessibility_issue_count === 1 ? '' : 's'} found.{' '}
          {r.eaa_exposure_note}
        </p>
        {r.accessibility_statement ? (
          <>
            <p className="wg-statement-label">Draft accessibility statement — review before publishing</p>
            <blockquote className="wg-statement">{r.accessibility_statement}</blockquote>
          </>
        ) : null}
      </section>

      {r.findings.length > 0 ? (
        <section className="wg-block">
          <h3 className="wg-h3">Technical findings</h3>
          <ul className="wg-findings">
            {r.findings.slice(0, 14).map((f) => (
              <li key={f.id}>
                <span className={`wg-sev ${SEV_CLASS[f.severity] ?? ''}`}>{f.severity}</span>
                <span className="wg-finding-area">{CAT_LABEL[f.category] ?? f.category}</span>
                <span className="wg-finding-title">
                  {f.title}
                  {f.displayValue ? ` — ${f.displayValue}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

export function AuditForm() {
  const [url, setUrl] = useState('')
  const [strategy, setStrategy] = useState<'mobile' | 'desktop'>('mobile')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [report, setReport] = useState<AegisReport | null>(null)

  async function run() {
    if (busy) return
    const target = url.trim()
    if (!target) {
      setError('Enter a website address to audit.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const res = await fetch('/api/aegis/audit/', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ url: target, strategy }),
      })
      const data = (await res.json()) as { report?: AegisReport; error?: string }
      if (!res.ok || !data.report) setError(data.error ?? 'Something went wrong.')
      else setReport(data.report)
    } catch {
      setError('Network error — try again.')
    } finally {
      setBusy(false)
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      void run()
    }
  }

  return (
    <div className="wg-shell">
      <div className="wg-form">
        <label className="ws-sr-only" htmlFor="wg-url">
          Website address to audit
        </label>
        <input
          id="wg-url"
          className="wg-input"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={onKeyDown}
          type="url"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          placeholder="e.g. example.com"
        />
        <label className="ws-sr-only" htmlFor="wg-device">
          Device
        </label>
        <select
          id="wg-device"
          className="wg-strategy"
          value={strategy}
          onChange={(e) => setStrategy(e.target.value === 'desktop' ? 'desktop' : 'mobile')}
        >
          <option value="mobile">Mobile</option>
          <option value="desktop">Desktop</option>
        </select>
        <button className="wg-run" onClick={() => void run()} disabled={busy} aria-busy={busy}>
          Run audit
          {busy ? <span className="wg-run__spin" aria-hidden /> : null}
        </button>
      </div>

      {busy ? <p className="wg-note">Scanning with PageSpeed Insights — this takes 15–40 seconds.</p> : null}
      {error ? (
        <p className="wg-error" role="alert">
          {error}
        </p>
      ) : null}

      {report ? (
        <Report report={report} />
      ) : !busy ? (
        <>
          <div className="ws-demo-banner" style={{ marginTop: 24 }}>
            <span className="ws-demo-banner__tag">Example</span>
            <span className="ws-demo-banner__text">A sample audit — run your own above to replace it.</span>
          </div>
          <Report report={DEMO_AEGIS_REPORT} />
        </>
      ) : null}
    </div>
  )
}
