import { redirect } from 'next/navigation'

// Per-project analytics moved into the admin panel.
export default async function LegacyAnalyticsDetail({
  params,
}: {
  params: Promise<{ project: string }>
}) {
  const { project } = await params
  redirect(`/admin/projects/analytics/${project}`)
}
