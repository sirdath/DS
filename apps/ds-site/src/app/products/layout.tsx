import type { ReactNode } from 'react'
import './workspace.css'

export const metadata = {
  title: 'Products · DS2',
  robots: { index: false, follow: false },
}

/** Root workspace layout — provides the dark shell tokens; the (app) group adds
 *  the gated chrome, the (auth) group renders the bare login. */
export default function WorkspaceLayout({ children }: { children: ReactNode }) {
  return <div className="ws-root">{children}</div>
}
