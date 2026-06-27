import type { Metadata } from 'next'
import { getPresentationByToken } from '../../products/lib/presentation-data'
import { ProductSection } from './product-section'
import { ScrollReveal } from './scroll-reveal'
import { buildSection } from './sections'
import './presentation.css'

// Shared decks are never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false }, title: 'DS2 — products in action' }

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default async function PresentationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const deck = UUID.test(token) ? await getPresentationByToken(token) : null

  if (!deck) {
    return (
      <div className="pv2-root pv2-gone">
        <div className="pv2-gone__card">
          <span className="pv2-gone__eyebrow">DS2</span>
          <h1>This presentation link isn&rsquo;t available</h1>
          <p>It may have been revoked or expired. Ask your DS2 contact for a fresh link.</p>
          <a href="https://ds2-consulting.com" className="pv2-gone__cta">Visit DS2 →</a>
        </div>
      </div>
    )
  }

  const sections = deck.items.map(buildSection).filter((s): s is NonNullable<typeof s> => Boolean(s))

  return (
    <div className="pv2-root">
      <header className="pv2-hero">
        <span className="pv2-hero__eyebrow">DS2 · Digital solutions</span>
        <h1 className="pv2-hero__title">{deck.title || 'What we build'}</h1>
        {deck.clientName ? <p className="pv2-hero__client">Prepared for {deck.clientName}</p> : null}
        <p className="pv2-hero__sub">
          {sections.length} product{sections.length === 1 ? '' : 's'}, in action. Scroll to explore.
        </p>
        <span className="pv2-hero__cue" aria-hidden>↓</span>
      </header>

      {sections.length === 0 ? (
        <section className="pv2-section"><p className="pv2-section__sub">This deck has no products selected.</p></section>
      ) : (
        sections.map((s, i) => <ProductSection key={s.key} section={s} index={i} />)
      )}

      <footer className="pv2-foot">
        <span>Presented by DS2</span>
        <a href="https://ds2-consulting.com">ds2-consulting.com</a>
      </footer>

      <ScrollReveal />
    </div>
  )
}
