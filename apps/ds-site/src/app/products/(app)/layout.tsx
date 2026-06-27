import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { resolveWorkspaceSession } from '../lib/workspace-auth'
import { WsRail } from './ws-rail'

export default async function WorkspaceAppLayout({ children }: { children: ReactNode }) {
  const session = await resolveWorkspaceSession()
  if (!session) redirect('/products/login')

  return (
    <div className="ws-shell">
      <WsRail session={session} />
      <main className="ws-main">
        <div className="ws-main__in">{children}</div>
      </main>
    </div>
  )
}
