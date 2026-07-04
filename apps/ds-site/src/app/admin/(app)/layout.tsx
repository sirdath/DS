import type { ReactNode } from 'react'
import { AdminRail } from './admin-rail'
import { getCurrentRole } from '@/app/admin/lib/roles'

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Default to the least-privilege nav if the role can't be resolved (the
  // middleware has already gated access; this only shapes which links show).
  const role = (await getCurrentRole()) ?? 'employee'
  return (
    <div className="admin-shell">
      <AdminRail role={role} />
      <main className="admin-main">{children}</main>
    </div>
  )
}
