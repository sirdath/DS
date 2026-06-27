import Link from 'next/link'
import { DEMO_FAMA_REPORT } from './demo-report'
import { FamaReportView } from './report-view'

export default function FamaWorkspacePage() {
  return (
    <>
      <Link href="/products" className="ws-back">
        ← All tools
      </Link>

      <div className="ws-head">
        <span className="ws-head__eyebrow">Fama · Review intelligence</span>
        <h1 className="ws-head__title">Your reviews, read</h1>
        <p className="ws-head__sub">
          Fama aggregates your reviews and reads them — sentiment, themes, reply drafts, and the few things to fix
          next, in Greek and English.
        </p>
      </div>

      {/* PLACEHOLDER: example report so the surface shows what a real one looks like.
          Swap DEMO_FAMA_REPORT for the client's live report (and drop the banner). */}
      <div className="ws-demo-banner">
        <span className="ws-demo-banner__tag">Example</span>
        <span className="ws-demo-banner__text">
          Sample report for a demo hotel — this is what yours will look like once a review source is connected.
        </span>
      </div>

      <FamaReportView report={DEMO_FAMA_REPORT} />
    </>
  )
}
