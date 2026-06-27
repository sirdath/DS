import { redirect } from 'next/navigation'
import type { ReactNode } from 'react'
import { AdminRail } from '@/app/admin/(app)/admin-rail'
import { resolveWorkspaceSession } from '../lib/workspace-auth'
import { ProductsTabs } from './products-tabs'
import '@/app/admin/admin.css'

// Products is just another tab in the SAME shell as the admin — it renders the very
// same left rail (AdminRail) with "Products" active, so switching Admin ⇄ Products is
// seamless (the navbar never resets). The products content keeps its --ws-* styling
// (those tokens come from .ws-root in the root layout, an ancestor of this shell).
export default async function WorkspaceAppLayout({ children }: { children: ReactNode }) {
  const session = await resolveWorkspaceSession()
  if (!session) redirect('/products/login')

  return (
    <div className="admin-shell">
      <AdminRail />
      <main className="admin-main">
        <div className="ws-tabbar">
          <ProductsTabs />
        </div>
        <div className="ws-main__in">{children}</div>
      </main>
    </div>
  )
}
