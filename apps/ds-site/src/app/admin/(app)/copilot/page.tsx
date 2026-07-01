import { getCredentialStatus } from '@/app/admin/admin-key-actions'
import { CopilotApp } from './copilot-app'
import './copilot.css'

export const dynamic = 'force-dynamic'

export default async function CopilotPage() {
  const credential = await getCredentialStatus()
  return (
    <div className="admin-container cop-page">
      <div className="ds-page-header">
        <p className="ds-page-header__eyebrow">DS2 · Copilot</p>
        <h1 className="ds-page-header__title">Copilot</h1>
        <p className="ds-page-header__sub">
          Ask about, or change, anything in the workspace — projects, leads, calendar, deadlines, notes, competitors. It
          routes each message to the right brain: Haiku for quick actions, Opus for everyday work, Fable for deep
          reasoning — and acts through the same actions the tabs use.
        </p>
      </div>
      <CopilotApp credentialSet={credential.set} />
    </div>
  )
}
