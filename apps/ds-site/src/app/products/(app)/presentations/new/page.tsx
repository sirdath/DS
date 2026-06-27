import Link from 'next/link'
import { redirect } from 'next/navigation'
import { TOOLS } from '../../../lib/tools-catalog'
import { resolveWorkspaceSession } from '../../../lib/workspace-auth'
import { PresentationBuilder } from '../builder'
import '../presentations.css'

export const dynamic = 'force-dynamic'

export default async function NewPresentationPage() {
  const session = await resolveWorkspaceSession()
  if (!session) redirect('/products/login')
  if (session.role !== 'internal') redirect('/products')

  const tools = TOOLS.filter((t) => t.status !== 'soon').map((t) => ({ slug: t.slug, name: t.name, tagline: t.tagline }))

  return (
    <>
      <Link href="/products/presentations" className="ws-back">← Presentations</Link>
      <div className="ws-head">
        <span className="ws-head__eyebrow">DS2 · Products</span>
        <h1 className="ws-head__title">New presentation</h1>
        <p className="ws-head__sub">Pick the products to showcase and the order. You&rsquo;ll get a link to share with a client.</p>
      </div>
      <PresentationBuilder tools={tools} />
    </>
  )
}
