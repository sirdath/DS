import type { ReactNode } from 'react'
import { AdminRail } from './admin-rail'
import { CopilotWidget } from './copilot/copilot-widget'
import { getCurrentRole } from '@/app/admin/lib/roles'
import { getCredentialStatus } from '@/app/admin/admin-key-actions'

export default async function AppLayout({ children }: { children: ReactNode }) {
  // Default to the least-privilege nav if the role can't be resolved (the
  // middleware has already gated access; this only shapes which links show).
  const role = (await getCurrentRole()) ?? 'employee'
  // The floating copilot is owner-only (the copilot reads the whole workspace).
  const credentialSet =
    role === 'owner' ? await getCredentialStatus().then((c) => c.set).catch(() => false) : false
  return (
    <div className="admin-shell">
      <AdminRail role={role} />
      <main className="admin-main">{children}</main>
      {role === 'owner' ? <CopilotWidget credentialSet={credentialSet} /> : null}
    </div>
  )
}
