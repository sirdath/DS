import 'server-only'
import { getServiceRoleClient } from './supabase-server'

/**
 * Scoped data for the employee dashboard. Everything here is filtered to the
 * signed-in employee's own assignments (admin_project_members). Money columns
 * (contract_value, amount_paid, retainer, estimates) are NEVER selected — an
 * employee only sees a project's name, status and progress, and the titles of
 * notes tagged to those projects.
 */
export interface EmpProject {
  id: string
  name: string
  status: string
  completion: number
}
export interface EmpNote {
  id: string
  title: string
}
export interface EmployeeData {
  projects: EmpProject[]
  notes: EmpNote[]
}

const EMPTY: EmployeeData = { projects: [], notes: [] }

export async function loadEmployeeData(email: string | null): Promise<EmployeeData> {
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!email || !hasSupabase) return EMPTY

  const sb = getServiceRoleClient()

  // Projects this employee is assigned to.
  const { data: mem } = await sb
    .from('admin_project_members')
    .select('project_id')
    .eq('member_email', email)
  const projectIds = (mem ?? []).map((r) => r.project_id as string)
  if (projectIds.length === 0) return EMPTY

  // Non-sensitive project fields only — no money.
  const { data: projs } = await sb
    .from('projects')
    .select('id,name,status,completion_pct')
    .in('id', projectIds)
    .order('status', { ascending: true })
  const projects: EmpProject[] = (projs ?? []).map((p) => ({
    id: p.id as string,
    name: (p.name as string) || 'Untitled project',
    status: p.status as string,
    completion: (p.completion_pct as number) ?? 0,
  }))

  // Notes tagged to those projects — titles only (bodies stay owner-side).
  const { data: links } = await sb
    .from('admin_note_projects')
    .select('note_id')
    .in('project_id', projectIds)
  const noteIds = [...new Set((links ?? []).map((r) => r.note_id as string))]
  let notes: EmpNote[] = []
  if (noteIds.length > 0) {
    const { data: nts } = await sb
      .from('admin_notes')
      .select('id,title')
      .in('id', noteIds)
      .order('updated_at', { ascending: false })
    notes = (nts ?? []).map((n) => ({ id: n.id as string, title: (n.title as string) || 'Untitled' }))
  }

  return { projects, notes }
}
