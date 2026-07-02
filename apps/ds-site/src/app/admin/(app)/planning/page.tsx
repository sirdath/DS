import { redirect } from 'next/navigation'

// Planning merged into the Calendar tab (deadlines live there now, next to the views).
export default function PlanningPage() {
  redirect('/admin/calendar')
}
