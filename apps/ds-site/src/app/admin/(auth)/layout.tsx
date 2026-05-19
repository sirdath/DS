/**
 * Auth layout — wraps /admin/login and /admin/logout.
 * The parent admin/layout.tsx still provides admin.css.
 * This nested layout is intentionally passthrough — no extra shell or topbar.
 * The login page renders its own full-screen overlay (z-index 200) covering
 * the admin topbar (z-index 100) from the parent layout.
 */
import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>
}
