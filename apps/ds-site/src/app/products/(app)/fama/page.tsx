import { assertAdmin } from '@/app/admin/lib/assert-admin'
import { FamaLive } from './fama-live'

export const dynamic = 'force-dynamic'

export default async function FamaWorkspacePage() {
  // Founders can run live analyses (billed to their own key); everyone else
  // signed into the products area sees the example report.
  let canRun = false
  try {
    await assertAdmin()
    canRun = true
  } catch {
    canRun = false
  }

  return (
    <>
      <div className="ws-head">
        <span className="ws-head__eyebrow">Fama · Review intelligence</span>
        <h1 className="ws-head__title">Your reviews, read</h1>
        <p className="ws-head__sub">
          Fama aggregates your reviews and reads them, sentiment, themes, reply drafts, and the few things to fix
          next, in Greek and English.
        </p>
      </div>

      <FamaLive canRun={canRun} />
    </>
  )
}
