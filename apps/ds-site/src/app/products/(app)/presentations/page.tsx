import Link from 'next/link'
import { redirect } from 'next/navigation'
import { listPresentations } from '../../lib/presentation-data'
import { resolveWorkspaceSession } from '../../lib/workspace-auth'
import { PresentationList } from './presentation-list'
import './presentations.css'

export const dynamic = 'force-dynamic'

export default async function PresentationsPage() {
  const session = await resolveWorkspaceSession()
  if (!session) redirect('/products/login')
  if (session.role !== 'internal') redirect('/products')

  const decks = await listPresentations()

  return (
    <>
      <div className="ws-head">
        <span className="ws-head__eyebrow">DS2 · Products</span>
        <h1 className="ws-head__title">Presentations</h1>
        <p className="ws-head__sub">Shareable decks that show our products in action, pick what to showcase, send a link.</p>
      </div>
      <div className="pb-toolbar">
        <Link href="/products/presentations/new" className="pb-newbtn">＋ New presentation</Link>
      </div>
      <PresentationList decks={decks} />
    </>
  )
}
