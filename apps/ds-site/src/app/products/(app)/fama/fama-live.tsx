'use client'

import { useState } from 'react'
import { DEMO_FAMA_REPORT } from './demo-report'
import { FamaReportView } from './report-view'
import { FamaImportPanel, type LiveRun } from './import-panel'

/** Demo report until a real run lands; then the live report + an honest run line
 *  (review count · what the analysis cost on the founder's key). */
export function FamaLive({ canRun }: { canRun: boolean }) {
  const [run, setRun] = useState<LiveRun | null>(null)

  return (
    <>
      {canRun ? <FamaImportPanel onRun={setRun} /> : null}

      {run ? (
        <div className="ws-demo-banner">
          <span className="ws-demo-banner__tag">Live</span>
          <span className="ws-demo-banner__text">
            {run.report.business.name} — {run.report.review_count} reviews analyzed · ~${run.report.usage.usd.toFixed(2)}
            {run.skipped > 0 ? ` · ${run.skipped} rows skipped` : ''}
            {run.truncated > 0 ? ` · first 60 of ${run.truncated + 60} used` : ''}
          </span>
        </div>
      ) : (
        <div className="ws-demo-banner">
          <span className="ws-demo-banner__tag">Example</span>
          <span className="ws-demo-banner__text">
            Sample report for a demo hotel, this is what yours will look like once a review source is connected.
          </span>
        </div>
      )}

      <FamaReportView report={run ? run.report : DEMO_FAMA_REPORT} />
    </>
  )
}
