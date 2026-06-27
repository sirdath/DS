import { redirect } from 'next/navigation'

/** Bare /admin/funnel lands on the Leads sub-view. */
export default function FunnelIndex() {
  redirect('/admin/funnel/leads')
}
