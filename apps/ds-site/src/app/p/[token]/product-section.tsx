import type { CSSProperties } from 'react'
import type { DeckSection } from './sections'

/** One full-bleed product section: an intro panel that resolves into the live demo. */
export function ProductSection({ section, index }: { section: DeckSection; index: number }) {
  return (
    <section className="pv2-section" style={{ '--pv2-accent': section.accent } as CSSProperties}>
      <div className="pv2-section__intro">
        <span className="pv2-section__n">{String(index + 1).padStart(2, '0')}</span>
        <span className="pv2-section__eyebrow">{section.eyebrow}</span>
        <h2 className="pv2-section__headline">{section.headline}</h2>
        <p className="pv2-section__sub">{section.sub}</p>
      </div>
      <div className="pv2-section__stage">{section.body}</div>
    </section>
  )
}
