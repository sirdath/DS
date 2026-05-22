'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getDataSource } from './lib/get-data-source'
import { getSessionUser, isAllowedEmail } from './lib/supabase-server'
import { PROJECT_STATUSES, OUTREACH_STAGES, PROJECT_TYPES } from './types'
import type { ProjectStatus, OutreachStage, ProjectType } from './types'
import type { NewProject, ProjectPatch } from './lib/data-source'
import { TRACKED_SITES } from './lib/sites'

/**
 * Auth guard — must be called at the top of every mutating/reading server action.
 *
 * Dev-only mock mode: if Supabase env vars are absent AND not in production,
 * allow through so keyless local development and the test suite continue to
 * work (Vitest runs without env vars and not in production → returns early).
 *
 * Production always requires a valid session + allowlisted email.
 */
async function assertAdmin(): Promise<void> {
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!hasSupabase) {
    if (process.env.NODE_ENV === 'production') throw new Error('Unauthorized')
    return
  }
  const user = await getSessionUser()
  if (!user || !isAllowedEmail(user.email ?? '')) throw new Error('Unauthorized')
}

function str(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : ''
}
function num(v: FormDataEntryValue | null): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
function nullableStr(v: FormDataEntryValue | null): string | null {
  const s = str(v)
  return s === '' ? null : s
}
function asStatus(v: FormDataEntryValue | null): ProjectStatus {
  const s = str(v)
  return (PROJECT_STATUSES as readonly string[]).includes(s)
    ? (s as ProjectStatus)
    : 'lead'
}
function asOutreachStage(v: FormDataEntryValue | null): OutreachStage | null {
  const s = str(v)
  return (OUTREACH_STAGES as readonly string[]).includes(s)
    ? (s as OutreachStage)
    : null
}
function asProjectType(v: FormDataEntryValue | null): ProjectType {
  const s = str(v)
  return (PROJECT_TYPES as readonly string[]).includes(s)
    ? (s as ProjectType)
    : 'website'
}
function nullableNum(v: FormDataEntryValue | null): number | null {
  const s = str(v)
  if (s === '') return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}
function asSiteSlug(v: FormDataEntryValue | null): string | null {
  const s = str(v)
  return TRACKED_SITES.some(site => site.slug === s) ? s : null
}

function parseProject(fd: FormData): NewProject {
  const name = str(fd.get('name'))
  if (!name) throw new Error('Name is required')
  const completionPct = Math.min(100, Math.max(0, num(fd.get('completionPct'))))
  return {
    name,
    url: str(fd.get('url')),
    status: asStatus(fd.get('status')),
    completionPct,
    lead: str(fd.get('lead')) || 'Dimitris',
    contractValue: num(fd.get('contractValue')),
    amountPaid: num(fd.get('amountPaid')),
    retainerMonthly: fd.get('retainerMonthly') ? num(fd.get('retainerMonthly')) : null,
    startDate: nullableStr(fd.get('startDate')),
    targetDate: nullableStr(fd.get('targetDate')),
    deliveredDate: nullableStr(fd.get('deliveredDate')),
    clientCompany: nullableStr(fd.get('clientCompany')),
    clientContact: nullableStr(fd.get('clientContact')),
    clientEmail: nullableStr(fd.get('clientEmail')),
    clientPhone: nullableStr(fd.get('clientPhone')),
    notes: str(fd.get('notes')),
    outreachStage: asOutreachStage(fd.get('outreachStage')),
    proposalUrl: nullableStr(fd.get('proposalUrl')),
    estimatedValue: nullableNum(fd.get('estimatedValue')),
    whyThem: nullableStr(fd.get('whyThem')),
    source: nullableStr(fd.get('source')),
    repoUrl: nullableStr(fd.get('repoUrl')),
    currentWebsiteUrl: nullableStr(fd.get('currentWebsiteUrl')),
    projectType: asProjectType(fd.get('projectType')),
    siteSlug: asSiteSlug(fd.get('siteSlug')),
    archived: false,
  }
}

export async function createProjectAction(fd: FormData): Promise<void> {
  await assertAdmin()
  const ds = getDataSource()
  await ds.createProject(parseProject(fd))
  revalidatePath('/admin')
  redirect('/admin')
}

export async function updateProjectAction(id: string, fd: FormData): Promise<void> {
  await assertAdmin()
  if (!id) throw new Error('Missing project id')
  const ds = getDataSource()
  const patch: ProjectPatch = parseProject(fd)
  await ds.updateProject(id, patch)
  revalidatePath('/admin')
  revalidatePath(`/admin/project/${id}`)
}

export async function addActivityAction(projectId: string, fd: FormData): Promise<void> {
  await assertAdmin()
  const body = str(fd.get('body'))
  const author = str(fd.get('author')) || 'Dimitris'
  if (!projectId || !body) throw new Error('Missing project or update text')
  await getDataSource().addActivity(projectId, body, author)
  revalidatePath(`/admin/project/${projectId}`)
}

export async function convertLeadAction(id: string): Promise<void> {
  await assertAdmin()
  if (!id) throw new Error('Missing project id')
  await getDataSource().convertLead(id)
  revalidatePath('/admin')
  revalidatePath(`/admin/project/${id}`)
}

export async function markLeadLostAction(id: string): Promise<void> {
  await assertAdmin()
  if (!id) throw new Error('Missing project id')
  await getDataSource().markLeadLost(id)
  revalidatePath('/admin')
}

export async function archiveProjectAction(id: string): Promise<void> {
  await assertAdmin()
  if (!id) throw new Error('Missing project id')
  await getDataSource().archiveProject(id)
  revalidatePath('/admin')
  revalidatePath(`/admin/project/${id}`)
}

export async function unarchiveProjectAction(id: string): Promise<void> {
  await assertAdmin()
  if (!id) throw new Error('Missing project id')
  await getDataSource().unarchiveProject(id)
  revalidatePath('/admin')
  revalidatePath(`/admin/project/${id}`)
}

export async function deleteProjectAction(id: string): Promise<void> {
  await assertAdmin()
  if (!id) throw new Error('Missing project id')
  await getDataSource().deleteProject(id)
  revalidatePath('/admin')
  redirect('/admin')
}
