'use server'

import { revalidatePath } from 'next/cache'
import { getDataSource } from './lib/get-data-source'
import { PROJECT_STATUSES } from './types'
import type { ProjectStatus } from './types'
import type { NewProject, ProjectPatch } from './lib/data-source'

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
  }
}

export async function createProjectAction(fd: FormData): Promise<void> {
  const ds = getDataSource()
  await ds.createProject(parseProject(fd))
  revalidatePath('/admin')
}

export async function updateProjectAction(id: string, fd: FormData): Promise<void> {
  if (!id) throw new Error('Missing project id')
  const ds = getDataSource()
  const patch: ProjectPatch = parseProject(fd)
  await ds.updateProject(id, patch)
  revalidatePath('/admin')
  revalidatePath(`/admin/project/${id}`)
}

export async function addActivityAction(projectId: string, fd: FormData): Promise<void> {
  const body = str(fd.get('body'))
  const author = str(fd.get('author')) || 'Dimitris'
  if (!projectId || !body) throw new Error('Missing project or update text')
  await getDataSource().addActivity(projectId, body, author)
  revalidatePath(`/admin/project/${projectId}`)
}
