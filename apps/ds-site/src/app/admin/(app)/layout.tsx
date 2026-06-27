import type { ReactNode } from 'react'
import { AdminRail } from './admin-rail'

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <div className="admin-shell">
      <AdminRail />
      <main className="admin-main">{children}</main>
    </div>
  )
}
