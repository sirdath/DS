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
import { rememberFact, recallFacts, listFacts, forgetFact } from './brain'
import { loadEvents } from '../(app)/calendar/lib/calendar-source'
import { loadDeadlines } from '../(app)/planning/lib/deadlines-source'
import { resolveDeadlineCurrent } from '../(app)/planning/lib/metric-source'
import { loadCompetitors } from '../(app)/competitors/lib/competitors-source'
import { loadNotesData } from '../(app)/notes/lib/notes-source'
import { loadAllArticles } from '../(app)/articles/lib/articles-source'
import type { ArticleLang, ArticleStatus } from '../(app)/articles/types'
import { createEvent, deleteEvent, updateEvent } from '../calendar-actions'
import { createDeadline, deleteDeadline, updateDeadline } from '../planning-actions'
import {
  createNote,
  createFolder,
  deleteFolder,
  deleteNote,
  moveNote,
  renameFolder,
  togglePin,
  updateNote,
} from '../notes-actions'
import { createArticle, deleteArticle, draftArticle, setArticleStatus, updateArticle } from '../articles-actions'
import { deleteLead, promoteLeadToProject, setLeadFlag, setLeadStatus, updateLeadContact } from '../leads-actions'
import { deleteBrief, markContacted } from '../outreach-actions'
import { LEAD_STATUSES } from '../lib/leads-types'
import type { Project } from '../types'

const ARTICLE_STATUSES: readonly ArticleStatus[] = ['draft', 'review', 'published']

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
  {
    name: 'delete_note',
    description: 'Delete a note permanently. Only call after the user has confirmed the deletion in this conversation.',
    input_schema: { type: 'object', properties: { id: str('Note id') }, required: ['id'] },
  },
  {
    name: 'create_folder',
    description: 'Create a notes folder, optionally nested under a parent folder id from list_notes. Call when the user asks to organise notes into a folder.',
    input_schema: {
      type: 'object',
      properties: { name: str('Folder name'), parentId: str('Parent folder id, omit for top level') },
      required: ['name'],
    },
  },
  {
    name: 'rename_folder',
    description: 'Rename a notes folder.',
    input_schema: { type: 'object', properties: { id: str('Folder id'), name: str('New name') }, required: ['id', 'name'] },
  },
  {
    name: 'delete_folder',
    description: 'Delete a notes folder permanently. Notes inside are preserved (moved to no folder), child folders are deleted too. Only call after the user has confirmed the deletion in this conversation.',
    input_schema: { type: 'object', properties: { id: str('Folder id') }, required: ['id'] },
  },
  {
    name: 'move_note',
    description: 'Move a note into a folder (or to the root). Call when the user asks to re-organise a note.',
    input_schema: {
      type: 'object',
      properties: { id: str('Note id'), folderId: str('Target folder id, omit or empty for root') },
      required: ['id'],
    },
  },
  {
    name: 'pin_note',
    description: 'Pin or unpin a note. Call when the user asks to pin/unpin a note.',
    input_schema: { type: 'object', properties: { id: str('Note id'), pinned: bool('true to pin, false to unpin') }, required: ['id', 'pinned'] },
  },
  {
    name: 'list_articles',
    description: 'List blog articles compactly (title, slug, lang, status, dates). Call for blog/SEO questions or to find an article id before editing.',
    input_schema: {
      type: 'object',
      properties: {
        status: str(`Optional status filter: ${ARTICLE_STATUSES.join(' | ')}`),
        lang: str('Optional language filter: el | en'),
      },
    },
  },
  {
    name: 'get_article',
    description: "Read one article's full detail including its markdown body, by id.",
    input_schema: { type: 'object', properties: { id: str('Article id') }, required: ['id'] },
  },
  {
    name: 'create_article',
    description: 'Create a new article shell (title, language, topic) with an auto-generated slug, status draft. Call when the user asks to start a new blog post. Follow up with draft_article to write the body.',
    input_schema: {
      type: 'object',
      properties: {
        title: str('Working title'),
        lang: str('el | en'),
        topic: str('Short topic brief guiding the draft'),
      },
      required: ['title', 'lang', 'topic'],
    },
  },
  {
    name: 'update_article',
    description: 'Replace an article\'s title, slug, language, description, topic and/or body. Call get_article first. This is a full replace of these fields — pass the current value for any field not being changed.',
    input_schema: {
      type: 'object',
      properties: {
        id: str('Article id'),
        title: str('Title'),
        slug: str('Lowercase-hyphenated slug'),
        lang: str('el | en'),
        description: str('Meta description'),
        topic: str('Topic brief'),
        bodyMd: str('Markdown body'),
      },
      required: ['id', 'title', 'slug', 'lang', 'description', 'topic', 'bodyMd'],
    },
  },
  {
    name: 'set_article_status',
    description: `Move an article between statuses: ${ARTICLE_STATUSES.join(' | ')}. Call when the user asks to publish, send to review or revert to draft.`,
    input_schema: {
      type: 'object',
      properties: { id: str('Article id'), status: str(ARTICLE_STATUSES.join(' | ')) },
      required: ['id', 'status'],
    },
  },
  {
    name: 'draft_article',
    description: 'AI-write a first draft for an article targeting a search keyword (fills body + meta description, moves status to review). Call when the user asks to draft/write a blog post for a keyword. Requires the founder\'s own Anthropic credential to be set up.',
    input_schema: {
      type: 'object',
      properties: { id: str('Article id'), keyword: str('Target search keyword the draft should answer') },
      required: ['id', 'keyword'],
    },
  },
  {
    name: 'delete_article',
    description: 'Delete an article permanently. Only call after the user has confirmed the deletion in this conversation.',
    input_schema: { type: 'object', properties: { id: str('Article id') }, required: ['id'] },
  },
  {
    name: 'set_lead_status',
    description: `Change a marketing lead's funnel status: ${LEAD_STATUSES.join(' | ')}. Call when the user reports progress on a lead.`,
    input_schema: {
      type: 'object',
      properties: { id: str('Lead id'), status: str(LEAD_STATUSES.join(' | ')) },
      required: ['id', 'status'],
    },
  },
  {
    name: 'set_lead_flag',
    description: 'Set a lead\'s verified or contacted flag. Call when the user says a lead was verified or contacted.',
    input_schema: {
      type: 'object',
      properties: { id: str('Lead id'), field: str('verified | contacted'), value: bool('true / false') },
      required: ['id', 'field', 'value'],
    },
  },
  {
    name: 'update_lead_contact',
    description: 'Update a lead\'s phone, email and/or notes. Only include fields being changed.',
    input_schema: {
      type: 'object',
      properties: { id: str('Lead id'), phone: str('Phone number'), email: str('Email'), notes: str('Notes') },
      required: ['id'],
    },
  },
  {
    name: 'delete_lead',
    description: 'Delete a marketing lead permanently. Only call after the user has confirmed the deletion in this conversation.',
    input_schema: { type: 'object', properties: { id: str('Lead id') }, required: ['id'] },
  },
  {
    name: 'promote_lead',
    description: 'Promote a marketing lead into an active project/lead in the pipeline. Call when the user says to move a lead into the funnel proper.',
    input_schema: { type: 'object', properties: { id: str('Lead id') }, required: ['id'] },
  },
  {
    name: 'mark_contacted',
    description: 'Mark a lead as contacted from the outreach surface (sets contacted=true, status=contacted). Call when the user says they reached out to a lead.',
    input_schema: { type: 'object', properties: { leadId: str('Lead id') }, required: ['leadId'] },
  },
  {
    name: 'delete_outreach_brief',
    description: 'Delete an outreach brief permanently. Only call after the user has confirmed the deletion in this conversation.',
    input_schema: { type: 'object', properties: { briefId: str('Outreach brief id') }, required: ['briefId'] },
  },
  {
    name: 'recall',
    description:
      'Search the shared DS2 brain for durable facts relevant to a topic (client preferences, past decisions, who-owns-what, pricing/policy rules). Call at the START of answering whenever prior knowledge about a client, person or decision would help — the brain persists across every conversation, so this is how you "already know" things.',
    input_schema: {
      type: 'object',
      properties: { query: str('What to look up, e.g. "MegaGym contact preference" or "our pricing rules"') },
      required: ['query'],
    },
  },
  {
    name: 'remember',
    description:
      'Save a durable fact to the shared DS2 brain so it persists across every future conversation with either founder. Use for lasting truths: client preferences, decisions made, who owns what, pricing/policy rules. Do NOT save transient chatter, one-off task details, or anything already stored.',
    input_schema: {
      type: 'object',
      properties: {
        content: str('The fact, stated plainly and self-contained, e.g. "MegaGym\'s owner prefers WhatsApp over email."'),
        kind: str('Optional: fact | preference | decision | person | client | rule (default fact)'),
        tags: { type: 'array', items: { type: 'string' }, description: 'Optional short tags, e.g. ["megagym","contact"]' },
      },
      required: ['content'],
    },
  },
  {
    name: 'list_memories',
    description: 'List recent facts stored in the shared DS2 brain. Call to review what is remembered, or to find an id before forgetting one.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'forget_memory',
    description: 'Delete a fact from the shared DS2 brain by id (get the id from list_memories). Only after the founder confirms.',
    input_schema: { type: 'object', properties: { id: str('Fact id from list_memories') }, required: ['id'] },
  },
]

export const TOOL_LABELS: Record<string, string> = {
  recall: 'Recalling from memory',
  remember: 'Saving to memory',
  list_memories: 'Reviewing memory',
  forget_memory: 'Forgetting a memory',
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
  delete_note: 'Deleting a note',
  create_folder: 'Creating a folder',
  rename_folder: 'Renaming a folder',
  delete_folder: 'Deleting a folder',
  move_note: 'Moving a note',
  pin_note: 'Pinning a note',
  list_articles: 'Listing articles',
  get_article: 'Reading an article',
  create_article: 'Creating an article',
  update_article: 'Updating an article',
  set_article_status: 'Changing article status',
  draft_article: 'Drafting an article',
  delete_article: 'Deleting an article',
  set_lead_status: 'Updating a lead status',
  set_lead_flag: 'Updating a lead flag',
  update_lead_contact: 'Updating lead contact info',
  delete_lead: 'Deleting a lead',
  promote_lead: 'Promoting a lead',
  mark_contacted: 'Marking a lead contacted',
  delete_outreach_brief: 'Deleting an outreach brief',
}

/** Tools that delete, mark-lost, or otherwise perform hard-to-reverse writes.
 *  The route should require explicit confirmation before executing these. */
export const DESTRUCTIVE_TOOLS = new Set<string>([
  'mark_lead_lost',
  'delete_event',
  'delete_deadline',
  'delete_note',
  'delete_folder',
  'delete_article',
  'delete_lead',
  'delete_outreach_brief',
  'forget_memory',
])

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

const compactArticle = (a: { id: string; slug: string; lang: ArticleLang; title: string; status: ArticleStatus; publishedAt: string | null; updatedAt: string }) => ({
  id: a.id,
  slug: a.slug,
  lang: a.lang,
  title: a.title,
  status: a.status,
  publishedAt: a.publishedAt,
  updatedAt: a.updatedAt,
})

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
    case 'delete_note':
      await deleteNote(asStr(input.id) ?? '')
      return JSON.stringify({ ok: true })
    case 'create_folder': {
      const name = asStr(input.name) ?? ''
      if (!name) throw new Error('Missing folder name')
      const id = await createFolder(name, asStr(input.parentId) ?? null)
      return JSON.stringify({ ok: true, id })
    }
    case 'rename_folder': {
      const name = asStr(input.name) ?? ''
      if (!name) throw new Error('Missing new name')
      await renameFolder(asStr(input.id) ?? '', name)
      return JSON.stringify({ ok: true })
    }
    case 'delete_folder':
      await deleteFolder(asStr(input.id) ?? '')
      return JSON.stringify({ ok: true })
    case 'move_note':
      await moveNote(asStr(input.id) ?? '', asStr(input.folderId) || null)
      return JSON.stringify({ ok: true })
    case 'pin_note': {
      const pinned = asBool(input.pinned)
      if (pinned === undefined) throw new Error('Missing pinned flag')
      await togglePin(asStr(input.id) ?? '', pinned)
      return JSON.stringify({ ok: true })
    }
    case 'list_articles': {
      const all = await loadAllArticles()
      const status = asStr(input.status)
      const lang = asStr(input.lang)
      const rows = all.filter((a) => (!status || a.status === status) && (!lang || a.lang === lang))
      return JSON.stringify(rows.map(compactArticle))
    }
    case 'get_article': {
      const all = await loadAllArticles()
      const article = all.find((a) => a.id === asStr(input.id))
      if (!article) throw new Error('Article not found')
      return JSON.stringify(article)
    }
    case 'create_article': {
      const title = asStr(input.title) ?? ''
      const lang = asStr(input.lang)
      if (lang !== 'el' && lang !== 'en') throw new Error('lang must be "el" or "en"')
      const article = await createArticle({ title, lang, topic: asStr(input.topic) ?? '' })
      return JSON.stringify(compactArticle(article))
    }
    case 'update_article': {
      const lang = asStr(input.lang)
      if (lang !== 'el' && lang !== 'en') throw new Error('lang must be "el" or "en"')
      await updateArticle(asStr(input.id) ?? '', {
        title: asStr(input.title) ?? '',
        slug: asStr(input.slug) ?? '',
        lang,
        description: asStr(input.description) ?? '',
        topic: asStr(input.topic) ?? '',
        bodyMd: asStr(input.bodyMd) ?? '',
      })
      return JSON.stringify({ ok: true })
    }
    case 'set_article_status': {
      const status = asStr(input.status)
      if (!status || !(ARTICLE_STATUSES as readonly string[]).includes(status)) throw new Error(`Invalid status "${status}"`)
      await setArticleStatus(asStr(input.id) ?? '', status as ArticleStatus)
      return JSON.stringify({ ok: true })
    }
    case 'draft_article': {
      const keyword = asStr(input.keyword) ?? ''
      if (!keyword) throw new Error('Missing target keyword')
      const draft = await draftArticle(asStr(input.id) ?? '', keyword)
      return JSON.stringify({ ok: true, ...draft })
    }
    case 'delete_article':
      await deleteArticle(asStr(input.id) ?? '')
      return JSON.stringify({ ok: true })
    case 'set_lead_status': {
      const status = asStr(input.status) ?? ''
      if (!(LEAD_STATUSES as readonly string[]).includes(status)) throw new Error(`Invalid status "${status}"`)
      await setLeadStatus(asStr(input.id) ?? '', status)
      return JSON.stringify({ ok: true })
    }
    case 'set_lead_flag': {
      const field = asStr(input.field)
      if (field !== 'verified' && field !== 'contacted') throw new Error('field must be "verified" or "contacted"')
      const value = asBool(input.value)
      if (value === undefined) throw new Error('Missing value')
      await setLeadFlag(asStr(input.id) ?? '', field, value)
      return JSON.stringify({ ok: true })
    }
    case 'update_lead_contact': {
      const patch: { phone?: string; email?: string; notes?: string } = {}
      if (asStr(input.phone) !== undefined) patch.phone = asStr(input.phone)
      if (asStr(input.email) !== undefined) patch.email = asStr(input.email)
      if (asStr(input.notes) !== undefined) patch.notes = asStr(input.notes)
      if (Object.keys(patch).length === 0) throw new Error('No fields to update')
      await updateLeadContact(asStr(input.id) ?? '', patch)
      return JSON.stringify({ ok: true })
    }
    case 'delete_lead':
      await deleteLead(asStr(input.id) ?? '')
      return JSON.stringify({ ok: true })
    case 'promote_lead':
      await promoteLeadToProject(asStr(input.id) ?? '')
      return JSON.stringify({ ok: true })
    case 'mark_contacted':
      await markContacted(asStr(input.leadId) ?? '')
      return JSON.stringify({ ok: true })
    case 'delete_outreach_brief':
      await deleteBrief(asStr(input.briefId) ?? '')
      return JSON.stringify({ ok: true })
    case 'recall': {
      const facts = await recallFacts(asStr(input.query) ?? '', 6)
      return JSON.stringify(facts.map((f) => ({ id: f.id, content: f.content, kind: f.kind })))
    }
    case 'remember': {
      const content = asStr(input.content) ?? ''
      if (!content.trim()) throw new Error('Nothing to remember')
      const tags = Array.isArray(input.tags) ? (input.tags as unknown[]).map((t) => String(t)) : []
      const createdBy = await getAdminDisplayName().catch(() => '')
      const saved = await rememberFact({ content, kind: asStr(input.kind) ?? 'fact', tags, source: 'copilot', createdBy })
      return saved ? JSON.stringify({ ok: true, id: saved.id }) : JSON.stringify({ ok: false, note: 'No memory store configured' })
    }
    case 'list_memories': {
      const facts = await listFacts(60)
      return JSON.stringify(facts.map((f) => ({ id: f.id, content: f.content, kind: f.kind, tags: f.tags })))
    }
    case 'forget_memory':
      await forgetFact(asStr(input.id) ?? '')
      return JSON.stringify({ ok: true })
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}
