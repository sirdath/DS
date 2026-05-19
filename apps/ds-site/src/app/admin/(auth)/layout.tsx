/**
 * Auth layout — wraps /admin/login and /admin/logout.
 * The parent admin/layout.tsx provides admin.css only (no shell or topbar).
 * This nested layout is intentionally passthrough.
 */
import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
