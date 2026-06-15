import Link from 'next/link'
import { AuditForm } from './audit-form'

export default function AegisWorkspacePage() {
  return (
    <>
      <Link href="/workspace" className="ws-back">
        ← All tools
      </Link>

      <div className="ws-head">
        <span className="ws-head__eyebrow">Aegis · Site audit</span>
        <h1 className="ws-head__title">Audit any site</h1>
        <p className="ws-head__sub">
          Paste a URL — yours or a prospect&rsquo;s. Aegis pulls the technical reality (speed, accessibility,
          SEO) and turns it into the few fixes that matter, with the EU Accessibility Act exposure spelled out.
        </p>
      </div>

      <AuditForm />
    </>
  )
}
