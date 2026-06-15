import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { resolveWorkspaceSession } from '../lib/workspace-auth'

export default async function WorkspaceAppLayout({ children }: { children: ReactNode }) {
  const session = await resolveWorkspaceSession()
  if (!session) redirect('/workspace/login')

  return (
    <>
      <header className="ws-topbar">
        <Link href="/workspace" className="ws-topbar__brand">
          <span className="ws-topbar__eyebrow">DS2</span>
          <span className="ws-topbar__title">Workspace</span>
        </Link>

        <div className="ws-topbar__right">
          {session.role === 'internal' ? (
            <Link href="/admin" className="ws-admin-link">
              ← Admin
            </Link>
          ) : null}
          <span className="ws-role" data-role={session.role}>
            {session.role === 'internal' ? 'Internal' : 'Client'}
          </span>
          <span className="ws-email">{session.email}</span>
          <form method="post" action="/workspace/logout">
            <button type="submit" className="ws-signout">
              Sign out
            </button>
          </form>
        </div>
      </header>

      <main className="ws-main">{children}</main>
    </>
  )
}
