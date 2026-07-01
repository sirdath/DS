import 'server-only'

/**
 * The copilot's tool surface over the admin workspace: projects/leads, calendar,
 * planning deadlines, notes and competitors. Definitions carry prescriptive
 * "call this when…" descriptions (Fable under-reaches for tools without them).
 * Executors reuse the existing server actions / loaders, so RLS + validation
 * stay in one place. Every executor returns a JSON string for the tool_result.
 */

import { OUTREACH_STAGES, PROJECT_STATUSES } from '../types'
import { getDataSource } from './get-data-source'
import { partitionProjects, portfolioTotals } from './derive'
import { getAdminDisplayName } from './get-admin-display-name'
import { loadSiteActivity } from './site-activity'
import { computeMetricSources } from './metric-sources'
import { loadEvents } from '../(app)/calendar/lib/calendar-source'
import { loadDeadlines } from '../(app)/planning/lib/deadlines-source'
import { resolveDeadlineCurrent } from '../(app)/planning/lib/metric-source'
import { loadCompetitors } from '../(app)/competitors/lib/competitors-source'
import { loadNotesData } from '../(app)/notes/lib/notes-source'
import { createEvent, deleteEvent, updateEvent } from '../calendar-actions'
import { createDeadline, deleteDeadline, updateDeadline } from '../planning-actions'
import { createNote, updateNote } from '../notes-actions'
import type { Project } from '../types'

interface ToolDef {
  name: string
  description: string
  input_schema: { type: 'object'; properties: Record<string, unknown>; required?: string[] }
}

const str = (d: string) => ({ type: 'string', description: d })
const num = (d: string) => ({ type: 'number', description: d })
const bool = (d: string) => ({ type: 'boolean', description: d })

export const COPILOT_TOOLS: ToolDef[] = [
  {
    name: 'get_workspace_snapshot',
    description:
      'The whole workspace at a glance: portfolio totals, pipeline, open leads, active projects, upcoming events/meetings (14 days), deadlines with live values, and site traffic. Call this FIRST for any broad question ("how are we doing", "what\'s this week") or before multi-step work, so your plan is grounded.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'list_projects',
    description:
      'List projects/leads compactly. Call when the user asks about projects, leads, the funnel or a client and the snapshot is not enough. Filter by status or search by name/company.',
    input_schema: {
      type: 'object',
      properties: {
        status: str(`Optional status filter: ${PROJECT_STATUSES.join(' | ')}`),
        query: str('Optional case-insensitive match on name / client company'),
        includeArchived: bool('Include archived projects (default false)'),
      },
    },
  },
  {
    name: 'get_project',
    description: 'Full detail for one project/lead by id, incl. recent activity log. Call before updating a project you have not read this conversation.',
    input_schema: { type: 'object', properties: { id: str('Project id') }, required: ['id'] },
  },
  {
    name: 'update_project',
    description:
      'Patch a project/lead: status, completion %, money fields, target date, outreach stage or notes. Call when the user asks to change project data. Only include fields being changed.',
    input_schema: {
      type: 'object',
      properties: {
        id: str('Project id'),
        status: str(`New status: ${PROJECT_STATUSES.join(' | ')}`),
        completionPct: num('0-100'),
        contractValue: num('EUR'),
        amountPaid: num('EUR'),
        estimatedValue: num('EUR (leads)'),
        targetDate: str('YYYY-MM-DD or empty to clear'),
        outreachStage: str(`Outreach stage: ${OUTREACH_STAGES.join(' | ')}`),
        notes: str('Replaces the project notes field'),
      },
      required: ['id'],
    },
  },
  {
    name: 'add_project_activity',
    description: 'Append a timestamped activity/log entry to a project ("called them", "sent proposal"). Call when the user reports progress on a project or asks to log something.',
    input_schema: { type: 'object', properties: { id: str('Project id'), body: str('The log entry') }, required: ['id', 'body'] },
  },
  {
    name: 'convert_lead',
    description: 'Convert a lead into an active project (won). Call when the user says a lead is won / signed / converted.',
    input_schema: { type: 'object', properties: { id: str('Project id') }, required: ['id'] },
  },
  {
    name: 'mark_lead_lost',
    description: 'Mark a lead as lost. Call when the user says a lead is dead / lost / passed.',
    input_schema: { type: 'object', properties: { id: str('Project id') }, required: ['id'] },
  },
  {
    name: 'list_events',
    description: 'List calendar events (optionally within a date range). Call for schedule questions when the snapshot window (14 days) is not enough, or to find an event id before editing.',
    input_schema: {
      type: 'object',
      properties: { from: str('YYYY-MM-DD inclusive'), to: str('YYYY-MM-DD inclusive') },
    },
  },
  {
    name: 'create_event',
    description:
      'Add a calendar event. For meetings set color="meeting" plus meetingType (cofounders | shareholders | client | internal) and optionally meetingLink. Call when the user asks to schedule/book anything.',
    input_schema: {
      type: 'object',
      properties: {
        title: str('Event title'),
        eventDate: str('YYYY-MM-DD'),
        startTime: str('HH:MM 24h, omit for all-day'),
        color: str('default | meeting | deadline | personal'),
        assignee: str('dath | stel | both, omit for unassigned'),
        meetingType: str('cofounders | shareholders | client | internal (meetings only)'),
        meetingLink: str('Join URL (meetings only)'),
      },
      required: ['title', 'eventDate'],
    },
  },
  {
    name: 'update_event',
    description: 'Patch a calendar event (title, date, time, color, assignee, done, meeting fields). Call to reschedule, rename, reassign or mark done. Only include fields being changed.',
    input_schema: {
      type: 'object',
      properties: {
        id: str('Event id'),
        title: str('New title'),
        eventDate: str('YYYY-MM-DD'),
        startTime: str('HH:MM, empty string to make all-day'),
        color: str('default | meeting | deadline | personal'),
        assignee: str('dath | stel | both or empty'),
        done: bool('Mark done / not done'),
        meetingType: str('cofounders | shareholders | client | internal or empty'),
        meetingLink: str('Join URL or empty'),
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_event',
    description: 'Delete a calendar event permanently. Only call after the user has confirmed the deletion in this conversation.',
    input_schema: { type: 'object', properties: { id: str('Event id') }, required: ['id'] },
  },
  {
    name: 'list_deadlines',
    description: 'List planning deadlines (date countdowns + metric goals) with live current values. Call for deadline/goal questions or to find an id before editing.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'create_deadline',
    description:
      'Add a planning deadline. kind="date" needs dueDate; kind="metric" needs metricTarget (+ metricUnit, and either metricCurrent or metricSource to auto-track a live figure: collected | mrr | pipeline | outstanding | contract).',
    input_schema: {
      type: 'object',
      properties: {
        kind: str('date | metric'),
        title: str('What has to happen'),
        dueDate: str('YYYY-MM-DD (date kind)'),
        metricCurrent: num('Current value (metric kind, manual)'),
        metricTarget: num('Target value (metric kind)'),
        metricUnit: str('e.g. EUR'),
        metricSource: str('Auto-track: collected | mrr | pipeline | outstanding | contract (metric kind)'),
      },
      required: ['kind', 'title'],
    },
  },
  {
    name: 'update_deadline',
    description: 'Patch a planning deadline (title, due date, metric numbers/source, done). Include kind when switching between date and metric. Only include fields being changed.',
    input_schema: {
      type: 'object',
      properties: {
        id: str('Deadline id'),
        kind: str('date | metric (only when switching kind)'),
        title: str('New title'),
        dueDate: str('YYYY-MM-DD or empty to clear'),
        metricCurrent: num('Current value'),
        metricTarget: num('Target value'),
        metricUnit: str('Unit'),
        metricSource: str('collected | mrr | pipeline | outstanding | contract or empty for manual'),
        done: bool('Mark done / not done'),
      },
      required: ['id'],
    },
  },
  {
    name: 'delete_deadline',
    description: 'Delete a planning deadline permanently. Only call after the user has confirmed the deletion in this conversation.',
    input_schema: { type: 'object', properties: { id: str('Deadline id') }, required: ['id'] },
  },
  {
    name: 'list_competitors',
    description: 'List scanned competitors with status + summary. Call for competitor questions. (New scans run from the Competitors tab, not from here.)',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'list_notes',
    description: 'List note titles + folders (no bodies). Call to find a note before reading or to answer "what notes do we have".',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'get_note',
    description: 'Read one note\'s full body by id.',
    input_schema: { type: 'object', properties: { id: str('Note id') }, required: ['id'] },
  },
  {
    name: 'create_note',
    description: 'Create a note with a title and markdown body (optionally in a folder id from list_notes). Call when the user asks to write something down / save a note.',
    input_schema: {
      type: 'object',
      properties: { title: str('Note title'), body: str('Markdown body'), folderId: str('Folder id, omit for root') },
      required: ['title', 'body'],
    },
  },
]

export const TOOL_LABELS: Record<string, string> = {
  get_workspace_snapshot: 'Reading the workspace',
  list_projects: 'Listing projects',
  get_project: 'Reading a project',
  update_project: 'Updating a project',
  add_project_activity: 'Logging activity',
  convert_lead: 'Converting a lead',
  mark_lead_lost: 'Marking a lead lost',
  list_events: 'Reading the calendar',
  create_event: 'Adding a calendar event',
  update_event: 'Updating an event',
  delete_event: 'Deleting an event',
  list_deadlines: 'Reading deadlines',
  create_deadline: 'Adding a deadline',
  update_deadline: 'Updating a deadline',
  delete_deadline: 'Deleting a deadline',
  list_competitors: 'Reading competitors',
  list_notes: 'Listing notes',
  get_note: 'Reading a note',
  create_note: 'Creating a note',
}

const compactProject = (p: Project) => ({
  id: p.id,
  name: p.name,
  status: p.status,
  outreachStage: p.outreachStage,
  projectType: p.projectType,
  clientCompany: p.clientCompany,
  contractValue: p.contractValue,
  amountPaid: p.amountPaid,
  estimatedValue: p.estimatedValue,
  completionPct: p.completionPct,
  targetDate: p.targetDate,
  archived: p.archived,
})

const asStr = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined)
const asNum = (v: unknown): number | undefined => (typeof v === 'number' && Number.isFinite(v) ? v : undefined)
const asBool = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : undefined)

async function snapshot(): Promise<Record<string, unknown>> {
  const ds = getDataSource()
  const [projects, events, deadlines, activity] = await Promise.all([
    ds.listProjects(),
    loadEvents(),
    loadDeadlines(),
    loadSiteActivity().catch(() => null),
  ])
  const { leads, active } = partitionProjects(projects)
  const totals = portfolioTotals(active)
  const sources = computeMetricSources(projects)
  const today = new Date().toISOString().slice(0, 10)
  const horizon = new Date(Date.now() + 14 * 86_400_000).toISOString().slice(0, 10)
  return {
    today,
    totals,
    pipelineValue: sources.pipeline,
    openLeads: leads.map(compactProject),
    activeProjects: active.map(compactProject),
    upcomingEvents: events
      .filter((e) => !e.done && e.eventDate >= today && e.eventDate <= horizon)
      .map((e) => ({ id: e.id, title: e.title, date: e.eventDate, time: e.startTime, color: e.color, assignee: e.assignee, meetingType: e.meetingType || undefined })),
    deadlines: deadlines.map((d) => ({
      id: d.id,
      kind: d.kind,
      title: d.title,
      dueDate: d.dueDate,
      current: resolveDeadlineCurrent(d, sources),
      target: d.metricTarget,
      unit: d.metricUnit,
      source: d.metricSource || undefined,
      done: d.done,
    })),
    siteActivity: activity,
  }
}

/** Execute one copilot tool. Throws on unknown tool / bad input; the route turns
 *  that into an is_error tool_result so the model can recover. */
export async function runCopilotTool(name: string, input: Record<string, unknown>): Promise<string> {
  const ds = getDataSource()
  switch (name) {
    case 'get_workspace_snapshot':
      return JSON.stringify(await snapshot())
    case 'list_projects': {
      const all = await ds.listProjects()
      const status = asStr(input.status)
      const query = asStr(input.query)?.toLowerCase()
      const rows = all.filter(
        (p) =>
          (asBool(input.includeArchived) || !p.archived) &&
          (!status || p.status === status) &&
          (!query || p.name.toLowerCase().includes(query) || (p.clientCompany ?? '').toLowerCase().includes(query)),
      )
      return JSON.stringify(rows.map(compactProject))
    }
    case 'get_project': {
      const id = asStr(input.id) ?? ''
      const p = await ds.getProject(id)
      if (!p) throw new Error('Project not found')
      const activity = await ds.listActivity(id)
      return JSON.stringify({ ...p, activity: activity.slice(0, 5) })
    }
    case 'update_project': {
      const id = asStr(input.id) ?? ''
      const patch: Record<string, unknown> = {}
      const status = asStr(input.status)
      if (status !== undefined) {
        if (!(PROJECT_STATUSES as readonly string[]).includes(status)) throw new Error(`Invalid status "${status}"`)
        patch.status = status
      }
      const stage = asStr(input.outreachStage)
      if (stage !== undefined) {
        if (!(OUTREACH_STAGES as readonly string[]).includes(stage)) throw new Error(`Invalid outreach stage "${stage}"`)
        patch.outreachStage = stage
      }
      if (asNum(input.completionPct) !== undefined) patch.completionPct = Math.max(0, Math.min(100, asNum(input.completionPct) ?? 0))
      if (asNum(input.contractValue) !== undefined) patch.contractValue = asNum(input.contractValue)
      if (asNum(input.amountPaid) !== undefined) patch.amountPaid = asNum(input.amountPaid)
      if (asNum(input.estimatedValue) !== undefined) patch.estimatedValue = asNum(input.estimatedValue)
      if (input.targetDate !== undefined) patch.targetDate = asStr(input.targetDate) || null
      if (asStr(input.notes) !== undefined) patch.notes = asStr(input.notes)
      if (Object.keys(patch).length === 0) throw new Error('No fields to update')
      const updated = await ds.updateProject(id, patch)
      return JSON.stringify(compactProject(updated))
    }
    case 'add_project_activity': {
      const author = await getAdminDisplayName()
      const entry = await ds.addActivity(asStr(input.id) ?? '', asStr(input.body) ?? '', author)
      return JSON.stringify(entry)
    }
    case 'convert_lead':
      return JSON.stringify(compactProject(await ds.convertLead(asStr(input.id) ?? '')))
    case 'mark_lead_lost':
      return JSON.stringify(compactProject(await ds.markLeadLost(asStr(input.id) ?? '')))
    case 'list_events': {
      const events = await loadEvents()
      const from = asStr(input.from)
      const to = asStr(input.to)
      return JSON.stringify(events.filter((e) => (!from || e.eventDate >= from) && (!to || e.eventDate <= to)))
    }
    case 'create_event': {
      const id = await createEvent({
        title: asStr(input.title) ?? '',
        eventDate: asStr(input.eventDate) ?? '',
        startTime: asStr(input.startTime) || null,
        color: asStr(input.color),
        assignee: asStr(input.assignee),
        meetingType: asStr(input.meetingType),
        meetingLink: asStr(input.meetingLink),
      })
      return JSON.stringify({ ok: true, id })
    }
    case 'update_event': {
      await updateEvent(asStr(input.id) ?? '', {
        title: asStr(input.title),
        eventDate: asStr(input.eventDate),
        startTime: input.startTime !== undefined ? asStr(input.startTime) || null : undefined,
        color: asStr(input.color),
        assignee: asStr(input.assignee),
        done: asBool(input.done),
        meetingType: asStr(input.meetingType),
        meetingLink: asStr(input.meetingLink),
      })
      return JSON.stringify({ ok: true })
    }
    case 'delete_event':
      await deleteEvent(asStr(input.id) ?? '')
      return JSON.stringify({ ok: true })
    case 'list_deadlines': {
      const [deadlines, projects] = await Promise.all([loadDeadlines(), ds.listProjects()])
      const sources = computeMetricSources(projects)
      return JSON.stringify(deadlines.map((d) => ({ ...d, liveCurrent: resolveDeadlineCurrent(d, sources) })))
    }
    case 'create_deadline': {
      const id = await createDeadline({
        kind: asStr(input.kind) ?? 'date',
        title: asStr(input.title) ?? '',
        dueDate: asStr(input.dueDate) ?? null,
        metricCurrent: asNum(input.metricCurrent) ?? null,
        metricTarget: asNum(input.metricTarget) ?? null,
        metricUnit: asStr(input.metricUnit),
        metricSource: asStr(input.metricSource),
      })
      return JSON.stringify({ ok: true, id })
    }
    case 'update_deadline': {
      await updateDeadline(asStr(input.id) ?? '', {
        kind: asStr(input.kind),
        title: asStr(input.title),
        dueDate: input.dueDate !== undefined ? asStr(input.dueDate) || null : undefined,
        metricCurrent: asNum(input.metricCurrent),
        metricTarget: asNum(input.metricTarget),
        metricUnit: asStr(input.metricUnit),
        metricSource: asStr(input.metricSource),
        done: asBool(input.done),
      })
      return JSON.stringify({ ok: true })
    }
    case 'delete_deadline':
      await deleteDeadline(asStr(input.id) ?? '')
      return JSON.stringify({ ok: true })
    case 'list_competitors': {
      const comps = await loadCompetitors()
      return JSON.stringify(comps.map((c) => ({ id: c.id, name: c.name, url: c.url, status: c.status, summary: c.summary })))
    }
    case 'list_notes': {
      const data = await loadNotesData()
      return JSON.stringify({
        folders: data.folders.map((f) => ({ id: f.id, name: f.name, parentId: f.parentId })),
        notes: data.notes.map((n) => ({ id: n.id, title: n.title, folderId: n.folderId, pinned: n.pinned, updatedAt: n.updatedAt })),
      })
    }
    case 'get_note': {
      const data = await loadNotesData()
      const note = data.notes.find((n) => n.id === asStr(input.id))
      if (!note) throw new Error('Note not found')
      return JSON.stringify(note)
    }
    case 'create_note': {
      const id = await createNote(asStr(input.folderId) ?? null)
      await updateNote(id, { title: asStr(input.title) ?? '', body: asStr(input.body) ?? '' })
      return JSON.stringify({ ok: true, id })
    }
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
