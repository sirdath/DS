import { redirect } from 'next/navigation'

// Analytics moved into the admin panel (Projects → Analytics tab).
export default function LegacyAnalyticsOverview() {
  redirect('/admin/projects?view=analytics')
}
