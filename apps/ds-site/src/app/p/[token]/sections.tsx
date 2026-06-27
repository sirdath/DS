import type { ReactNode } from 'react'
import { FamaReportView } from '../../products/(app)/fama/report-view'
import { DEMO_FAMA_REPORT } from '../../products/(app)/fama/demo-report'
import { DEMO_AEGIS_REPORT } from '../../products/(app)/aegis/demo-result'

export interface DeckSection {
  key: string
  name: string
  accent: string
  eyebrow: string
  headline: string
  sub: string
  body: ReactNode
}

const scoreClass = (n: number) => (n >= 90 ? 'is-good' : n >= 50 ? 'is-mid' : 'is-poor')
const SCORE_LABEL: Record<string, string> = {
  performance: 'Performance',
  accessibility: 'Accessibility',
  seo: 'SEO',
  'best-practices': 'Best practices',
}

function AegisShowcase() {
  return (
    <div className="pv2-aegis">
      <div className="pv2-aegis__scores">
        {DEMO_AEGIS_REPORT.scores.map((s) => (
          <div key={s.key} className={`pv2-score ${scoreClass(s.score)}`}>
            <span className="pv2-score__num">{s.score}</span>
            <span className="pv2-score__label">{SCORE_LABEL[s.key] ?? s.key}</span>
          </div>
        ))}
      </div>
      <p className="pv2-aegis__verdict">{DEMO_AEGIS_REPORT.overall_verdict}</p>
    </div>
  )
}

function ArgusShowcase() {
  const watches = ['Pricing changes', 'New launches', 'Hiring signals', 'Review trends', 'Ad campaigns', 'Site redesigns']
  return (
    <div className="pv2-cap">
      <p className="pv2-cap__lead">
        Every week, Argus reads your competitors so you don&rsquo;t have to — and tells you only what changed and why
        it matters.
      </p>
      <div className="pv2-chips">
        {watches.map((w) => (
          <span key={w} className="pv2-chip">{w}</span>
        ))}
      </div>
    </div>
  )
}

function PlutusShowcase() {
  const steps = [
    { t: 'Predict', d: 'Flags the invoices most likely to pay late, before they do.' },
    { t: 'Prioritise', d: 'Ranks exactly who to chase first by amount and risk.' },
    { t: 'Draft', d: 'Writes the reminder in your voice — you approve before it sends.' },
  ]
  return (
    <div className="pv2-steps">
      {steps.map((s, i) => (
        <div key={s.t} className="pv2-step">
          <span className="pv2-step__n">{String(i + 1).padStart(2, '0')}</span>
          <span className="pv2-step__t">{s.t}</span>
          <span className="pv2-step__d">{s.d}</span>
        </div>
      ))}
    </div>
  )
}

function XeniaShowcase() {
  const turns = [
    { who: 'them', text: 'Γεια σας, έχετε τραπέζι για 4 απόψε στις 9;' },
    { who: 'xenia', text: 'Καλησπέρα! Ναι — έχουμε τραπέζι για 4 στις 21:00. Να το κρατήσω; Σε ποιο όνομα;' },
    { who: 'them', text: 'Ναι, στο όνομα Νίκος.' },
    { who: 'xenia', text: 'Κλεισμένο, Νίκο — 4 άτομα, 21:00 απόψε. Θα σας περιμένουμε!' },
  ]
  return (
    <div className="pv2-chat">
      {turns.map((t, i) => (
        <div key={i} className={`pv2-bubble pv2-bubble--${t.who}`}>{t.text}</div>
      ))}
    </div>
  )
}

/** Build one deck section from a tool slug. Returns null for unknown slugs. */
export function buildSection(slug: string): DeckSection | null {
  switch (slug) {
    case 'review-intelligence':
      return {
        key: slug, name: 'Fama', accent: '#6D5DD3',
        eyebrow: 'Fama · Review intelligence',
        headline: 'Every review, read for you.',
        sub: 'Sentiment, themes, reply drafts and the few things to fix next — in Greek and English.',
        body: <div className="pv2-embed"><FamaReportView report={DEMO_FAMA_REPORT} /></div>,
      }
    case 'site-audit':
      return {
        key: slug, name: 'Aegis', accent: '#F5C451',
        eyebrow: 'Aegis · Site audit',
        headline: 'The technical reality, in plain words.',
        sub: 'Speed, accessibility (EU Accessibility Act) and SEO — with the fixes that matter.',
        body: <AegisShowcase />,
      }
    case 'competitor-watch':
      return {
        key: slug, name: 'Argus', accent: '#E896C4',
        eyebrow: 'Argus · Competitor watch',
        headline: 'Know what your market just did.',
        sub: 'Weekly intelligence on your competitors’ moves — without you lifting a finger.',
        body: <ArgusShowcase />,
      }
    case 'collections':
      return {
        key: slug, name: 'Plutus', accent: '#2EC5A8',
        eyebrow: 'Plutus · Collections',
        headline: 'Get paid sooner, without chasing.',
        sub: 'Predicts which invoices pay late, ranks who to chase, and drafts the reminder.',
        body: <PlutusShowcase />,
      }
    case 'ai-receptionist':
      return {
        key: slug, name: 'Xenia', accent: '#60C4A8',
        eyebrow: 'Xenia · AI receptionist',
        headline: 'Books the table while you work.',
        sub: 'Answers enquiries and books appointments by chat or phone, in Greek and English.',
        body: <XeniaShowcase />,
      }
    case 'site-selection':
      return {
        key: slug, name: 'Panoptes', accent: '#22D3EE',
        eyebrow: 'Panoptes · Site selection',
        headline: 'The best place to open, scored.',
        sub: 'Demand, competition and access scored across a city — on a live map.',
        body: (
          <div className="pv2-embed pv2-embed--map">
            <iframe src="/panoptes-viewer?demo=1" title="Panoptes demo map" loading="lazy" />
          </div>
        ),
      }
    default:
      return null
  }
}
