import { SAMPLE_BUSINESSES, SAMPLE_KEYS } from '@ds/xenia'
import Link from 'next/link'
import { Chat } from './chat'

export default function XeniaWorkspacePage() {
  // Built server-side so the client bundle never imports the engine (and its key).
  const samples = SAMPLE_KEYS.map((key) => ({
    key,
    name: SAMPLE_BUSINESSES[key].name,
    type: SAMPLE_BUSINESSES[key].type,
  }))

  return (
    <>
      <Link href="/workspace" className="ws-back">
        ← All tools
      </Link>

      <div className="ws-head">
        <span className="ws-head__eyebrow">Xenia · AI receptionist</span>
        <h1 className="ws-head__title">Try the receptionist</h1>
        <p className="ws-head__sub">
          Pick a business and talk to Xenia in Greek or English. She checks availability and books — against a
          demo store, so book away.
        </p>
      </div>

      <Chat samples={samples} />
    </>
  )
}
