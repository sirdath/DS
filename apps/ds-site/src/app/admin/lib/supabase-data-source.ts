/**
 * Supabase-backed implementation of ProjectDataSource.
 *
 * Uses the RLS-enforced SSR client (anon key + session cookie), so only
 * authenticated admin users (via is_admin() RLS policy) can read/write data.
 *
 * Column mapping: DB uses snake_case; the Project interface uses camelCase.
 * rowToProject() and projectToRow() handle the conversion.
 *
 * Date columns (start_date, target_date, delivered_date) are Postgres `date`
 * type and come back as 'YYYY-MM-DD' strings — kept as string|null to match
 * the Project type. Timestamps (created_at, updated_at) are timestamptz ISO.
 *
 * The DB trigger sets updated_at automatically on UPDATE; we never send it.
 */

import type { Project, ProjectActivity, OutreachStage, ProjectStatus, ProjectType } from '../types'
import type { ProjectDataSource, NewProject, ProjectPatch } from './data-source'
import { getSupabaseServerClient } from './supabase-server'

// ── DB row shape ──────────────────────────────────────────────────────────────

interface ProjectRow {
  id: string
  name: string
  url: string
  status: ProjectStatus
  completion_pct: number
  lead: string
  contract_value: number
  amount_paid: number
  retainer_monthly: number | null
  start_date: string | null
  target_date: string | null
  delivered_date: string | null
  client_company: string | null
  client_contact: string | null
  client_email: string | null
  client_phone: string | null
  notes: string
  outreach_stage: OutreachStage | null
  proposal_url: string | null
  estimated_value: number | null
  why_them: string | null
  source: string | null
  repo_url: string | null
  current_website_url: string | null
  project_type: ProjectType
  archived: boolean
  created_at: string
  updated_at: string
}

interface ActivityRow {
  id: string
  project_id: string
  body: string
  author: string
  created_at: string
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function rowToProject(row: ProjectRow): Project {
  return {
    id: row.id,
    name: row.name,
    url: row.url,
    status: row.status,
    completionPct: row.completion_pct,
    lead: row.lead,
    contractValue: Number(row.contract_value),
    amountPaid: Number(row.amount_paid),
    retainerMonthly: row.retainer_monthly !== null ? Number(row.retainer_monthly) : null,
    startDate: row.start_date,
    targetDate: row.target_date,
    deliveredDate: row.delivered_date,
    clientCompany: row.client_company,
    clientContact: row.client_contact,
    clientEmail: row.client_email,
    clientPhone: row.client_phone,
    notes: row.notes,
    outreachStage: row.outreach_stage,
    proposalUrl: row.proposal_url,
    estimatedValue: row.estimated_value !== null ? Number(row.estimated_value) : null,
    whyThem: row.why_them,
    source: row.source,
    repoUrl: row.repo_url,
    currentWebsiteUrl: row.current_website_url,
    projectType: row.project_type,
    archived: row.archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

/**
 * Maps a camelCase Project partial to DB snake_case columns.
 * Never includes id, created_at, or updated_at (DB controls those).
 */
function projectToRow(
  input: Partial<NewProject>,
): Partial<Omit<ProjectRow, 'id' | 'created_at' | 'updated_at'>> {
  const row: Partial<Omit<ProjectRow, 'id' | 'created_at' | 'updated_at'>> = {}

  if (input.name !== undefined) row.name = input.name
  if (input.url !== undefined) row.url = input.url
  if (input.status !== undefined) row.status = input.status
  if (input.completionPct !== undefined) row.completion_pct = input.completionPct
  if (input.lead !== undefined) row.lead = input.lead
  if (input.contractValue !== undefined) row.contract_value = input.contractValue
  if (input.amountPaid !== undefined) row.amount_paid = input.amountPaid
  if (input.retainerMonthly !== undefined) row.retainer_monthly = input.retainerMonthly
  if (input.startDate !== undefined) row.start_date = input.startDate
  if (input.targetDate !== undefined) row.target_date = input.targetDate
  if (input.deliveredDate !== undefined) row.delivered_date = input.deliveredDate
  if (input.clientCompany !== undefined) row.client_company = input.clientCompany
  if (input.clientContact !== undefined) row.client_contact = input.clientContact
  if (input.clientEmail !== undefined) row.client_email = input.clientEmail
  if (input.clientPhone !== undefined) row.client_phone = input.clientPhone
  if (input.notes !== undefined) row.notes = input.notes
  if (input.outreachStage !== undefined) row.outreach_stage = input.outreachStage
  if (input.proposalUrl !== undefined) row.proposal_url = input.proposalUrl
  if (input.estimatedValue !== undefined) row.estimated_value = input.estimatedValue
  if (input.whyThem !== undefined) row.why_them = input.whyThem
  if (input.source !== undefined) row.source = input.source
  if (input.repoUrl !== undefined) row.repo_url = input.repoUrl
  if (input.currentWebsiteUrl !== undefined) row.current_website_url = input.currentWebsiteUrl
  if (input.projectType !== undefined) row.project_type = input.projectType
  if (input.archived !== undefined) row.archived = input.archived

  return row
}

function rowToActivity(row: ActivityRow): ProjectActivity {
  return {
    id: row.id,
    projectId: row.project_id,
    body: row.body,
    author: row.author,
    createdAt: row.created_at,
  }
}

// ── SupabaseDataSource ────────────────────────────────────────────────────────

export class SupabaseDataSource implements ProjectDataSource {
  async listProjects(): Promise<Project[]> {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data as ProjectRow[]).map(rowToProject)
  }

  async getProject(id: string): Promise<Project | null> {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .maybeSingle()
    if (error) throw new Error(error.message)
    if (!data) return null
    return rowToProject(data as ProjectRow)
  }

  async createProject(input: NewProject): Promise<Project> {
    const supabase = await getSupabaseServerClient()
    const row = projectToRow(input)
    const { data, error } = await supabase
      .from('projects')
      .insert(row)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return rowToProject(data as ProjectRow)
  }

  async updateProject(id: string, patch: ProjectPatch): Promise<Project> {
    const supabase = await getSupabaseServerClient()
    // Do not include updated_at — the DB trigger sets it.
    const row = projectToRow(patch)
    const { data, error } = await supabase
      .from('projects')
      .update(row)
      .eq('id', id)
      .select()
      .single()
    if (error) throw new Error(error.message)
    return rowToProject(data as ProjectRow)
  }

  async deleteProject(id: string): Promise<void> {
    const supabase = await getSupabaseServerClient()
    const { error } = await supabase.from('projects').delete().eq('id', id)
    if (error) throw new Error(error.message)
  }

  async convertLead(id: string): Promise<Project> {
    return this.updateProject(id, {
      status: 'in_progress',
      outreachStage: 'won',
    })
  }

  async markLeadLost(id: string): Promise<Project> {
    return this.updateProject(id, { outreachStage: 'lost' })
  }

  async archiveProject(id: string): Promise<Project> {
    return this.updateProject(id, { archived: true })
  }

  async unarchiveProject(id: string): Promise<Project> {
    return this.updateProject(id, { archived: false })
  }

  async listActivity(projectId: string): Promise<ProjectActivity[]> {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from('project_activity')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })
    if (error) throw new Error(error.message)
    return (data as ActivityRow[]).map(rowToActivity)
  }

  async addActivity(
    projectId: string,
    body: string,
    author: string,
  ): Promise<ProjectActivity> {
    const supabase = await getSupabaseServerClient()
    const { data, error } = await supabase
      .from('project_activity')
      .insert({ project_id: projectId, body, author })
      .select()
      .single()
    if (error) throw new Error(error.message)
    return rowToActivity(data as ActivityRow)
  }
}
