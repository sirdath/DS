import type { Project, ProjectActivity, ProjectType } from '../types'
import type { ProjectDataSource, NewProject, ProjectPatch } from './data-source'

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
}

const SEED: Project[] = [
  {
    id: 'seed-megagym',
    name: 'MegaGym',
    url: 'ds2-consulting.com/MegaGym-Website',
    status: 'delivered',
    completionPct: 100,
    lead: 'Dimitris',
    contractValue: 6000,
    amountPaid: 6000,
    retainerMonthly: null,
    startDate: '2026-02-01',
    targetDate: '2026-03-15',
    deliveredDate: '2026-03-12',
    clientCompany: 'MegaGym',
    clientContact: 'Owner',
    clientEmail: null,
    clientPhone: null,
    notes: 'Fitness centre — Athens. First delivered client.',
    outreachStage: null,
    proposalUrl: null,
    estimatedValue: null,
    whyThem: null,
    source: null,
    repoUrl: 'https://github.com/sirdath/megagym-site',
    currentWebsiteUrl: 'https://old-megagym.example',
    projectType: 'website' as ProjectType,
    archived: false,
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-03-12T00:00:00Z',
  },
  {
    id: 'seed-kallisto',
    name: 'Kallisto Hotel',
    url: 'ds2-consulting.com/kallisto',
    status: 'retainer',
    completionPct: 100,
    lead: 'Stelios',
    contractValue: 14000,
    amountPaid: 14000,
    retainerMonthly: 900,
    startDate: '2025-11-10',
    targetDate: '2026-01-20',
    deliveredDate: '2026-01-18',
    clientCompany: 'Kallisto Boutique Hotel',
    clientContact: 'Eleni Marou',
    clientEmail: 'eleni@kallisto.example',
    clientPhone: null,
    notes: 'Boutique hotel — Santorini. On monthly stewardship.',
    outreachStage: null,
    proposalUrl: null,
    estimatedValue: null,
    whyThem: null,
    source: null,
    repoUrl: 'https://github.com/sirdath/kallisto',
    currentWebsiteUrl: null,
    projectType: 'website' as ProjectType,
    archived: false,
    createdAt: '2025-11-10T00:00:00Z',
    updatedAt: '2026-05-01T00:00:00Z',
  },
  {
    id: 'seed-orbit',
    name: 'Orbit Logistics',
    url: 'ds2-consulting.com/orbit',
    status: 'in_progress',
    completionPct: 62,
    lead: 'Dimitris',
    contractValue: 22000,
    amountPaid: 8000,
    retainerMonthly: null,
    startDate: '2026-03-01',
    targetDate: '2026-06-15',
    deliveredDate: null,
    clientCompany: 'Orbit Logistics SA',
    clientContact: 'Nikos Pappas',
    clientEmail: 'nikos@orbit.example',
    clientPhone: '+30 210 000 0000',
    notes: 'Freight ops dashboard + marketing site. Phase 2 in build.',
    outreachStage: null,
    proposalUrl: null,
    estimatedValue: null,
    whyThem: null,
    source: null,
    repoUrl: 'https://github.com/sirdath/orbit-logistics',
    currentWebsiteUrl: 'https://orbit-logistics.example',
    projectType: 'application' as ProjectType,
    archived: false,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-05-12T00:00:00Z',
  },
  {
    id: 'seed-verde',
    name: 'Verde Skincare',
    url: 'ds2-consulting.com/verde',
    status: 'in_progress',
    completionPct: 35,
    lead: 'Stelios',
    contractValue: 16500,
    amountPaid: 5000,
    retainerMonthly: null,
    startDate: '2026-02-20',
    targetDate: '2026-04-30',
    deliveredDate: null,
    clientCompany: 'Verde Naturals',
    clientContact: 'Maria Ioannou',
    clientEmail: 'maria@verde.example',
    clientPhone: null,
    notes: 'E-commerce rebuild. Behind schedule — content blocked on client.',
    outreachStage: null,
    proposalUrl: null,
    estimatedValue: null,
    whyThem: null,
    source: null,
    repoUrl: 'https://github.com/sirdath/verde-skincare',
    currentWebsiteUrl: 'https://verde-old.example',
    projectType: 'website' as ProjectType,
    archived: false,
    createdAt: '2026-02-20T00:00:00Z',
    updatedAt: '2026-05-05T00:00:00Z',
  },
  {
    id: 'seed-helios',
    name: 'Helios Energy',
    url: '',
    status: 'lead',
    completionPct: 0,
    lead: 'Dimitris',
    contractValue: 0,
    amountPaid: 0,
    retainerMonthly: null,
    startDate: null,
    targetDate: null,
    deliveredDate: null,
    clientCompany: 'Helios Energy Partners',
    clientContact: 'Georgios Vlachos',
    clientEmail: 'g.vlachos@helios.example',
    clientPhone: null,
    notes: 'Inbound lead — solar installer. Proposal drafting.',
    outreachStage: 'demo_built',
    proposalUrl: 'https://demo.ds2-consulting.com/helios',
    estimatedValue: 30000,
    whyThem: 'Solar installer with an outdated single-page site — strong before/after story.',
    source: 'Inbound',
    repoUrl: null,
    currentWebsiteUrl: 'https://helios-energy.example',
    projectType: 'website' as ProjectType,
    archived: false,
    createdAt: '2026-05-08T00:00:00Z',
    updatedAt: '2026-05-08T00:00:00Z',
  },
  {
    id: 'seed-pantheon',
    name: 'Pantheon Law',
    url: '',
    status: 'lead',
    completionPct: 0,
    lead: 'Stelios',
    contractValue: 0,
    amountPaid: 0,
    retainerMonthly: null,
    startDate: null,
    targetDate: null,
    deliveredDate: null,
    clientCompany: 'Pantheon Legal',
    clientContact: 'Sofia Dimitriou',
    clientEmail: null,
    clientPhone: null,
    notes: 'Referral from MegaGym. Discovery call booked.',
    outreachStage: 'pitched',
    proposalUrl: 'https://demo.ds2-consulting.com/pantheon',
    estimatedValue: 18000,
    whyThem: 'Referral from MegaGym; partner wants a credibility-grade site.',
    source: 'Referral — MegaGym',
    repoUrl: null,
    currentWebsiteUrl: null,
    projectType: 'consulting' as ProjectType,
    archived: false,
    createdAt: '2026-05-14T00:00:00Z',
    updatedAt: '2026-05-14T00:00:00Z',
  },
  {
    id: 'seed-aegean',
    name: 'Aegean Yachts',
    url: '',
    status: 'lead',
    completionPct: 0,
    lead: 'Dimitris',
    contractValue: 0,
    amountPaid: 0,
    retainerMonthly: null,
    startDate: null,
    targetDate: null,
    deliveredDate: null,
    clientCompany: 'Aegean Yachts Ltd',
    clientContact: null,
    clientEmail: null,
    clientPhone: null,
    notes: '',
    outreachStage: 'identified',
    proposalUrl: null,
    estimatedValue: 45000,
    whyThem: 'Premium charter brand, no web presence — high-value speculative target.',
    source: 'Cold target',
    repoUrl: null,
    currentWebsiteUrl: null,
    projectType: 'website' as ProjectType,
    archived: false,
    createdAt: '2026-05-19T00:00:00Z',
    updatedAt: '2026-05-19T00:00:00Z',
  },
  {
    id: 'seed-lost-demo',
    name: 'Olympus Gym',
    url: '',
    status: 'lead',
    completionPct: 0,
    lead: 'Stelios',
    contractValue: 0,
    amountPaid: 0,
    retainerMonthly: null,
    startDate: null,
    targetDate: null,
    deliveredDate: null,
    clientCompany: null,
    clientContact: null,
    clientEmail: null,
    clientPhone: null,
    notes: '',
    outreachStage: 'lost',
    proposalUrl: null,
    estimatedValue: 7000,
    whyThem: 'Chose a cheaper freelancer.',
    source: 'Cold target',
    repoUrl: null,
    currentWebsiteUrl: null,
    projectType: 'website' as ProjectType,
    archived: true,
    createdAt: '2026-05-19T00:00:00Z',
    updatedAt: '2026-05-19T00:00:00Z',
  },
]

// Internal-only type: the public ProjectActivity type is unchanged.
type StoredActivity = ProjectActivity & { _seq: number }

export class MockDataSource implements ProjectDataSource {
  private projects: Project[] = SEED.map(p => ({ ...p }))
  private activity: StoredActivity[] = []
  private seq = 0

  async listProjects(): Promise<Project[]> {
    return this.projects.map(p => ({ ...p }))
  }

  async getProject(id: string): Promise<Project | null> {
    const p = this.projects.find(x => x.id === id)
    return p ? { ...p } : null
  }

  async createProject(input: NewProject): Promise<Project> {
    const now = new Date().toISOString()
    const project: Project = { ...input, id: uid(), createdAt: now, updatedAt: now }
    this.projects = [project, ...this.projects]
    return { ...project }
  }

  async convertLead(id: string): Promise<Project> {
    const idx = this.projects.findIndex(p => p.id === id)
    if (idx === -1) throw new Error(`Project ${id} not found`)
    return this.updateProject(id, { status: 'in_progress', outreachStage: 'won' })
  }

  async markLeadLost(id: string): Promise<Project> {
    const idx = this.projects.findIndex(p => p.id === id)
    if (idx === -1) throw new Error(`Project ${id} not found`)
    return this.updateProject(id, { outreachStage: 'lost' })
  }

  async archiveProject(id: string): Promise<Project> {
    const idx = this.projects.findIndex(p => p.id === id)
    if (idx === -1) throw new Error(`Project ${id} not found`)
    return this.updateProject(id, { archived: true })
  }

  async unarchiveProject(id: string): Promise<Project> {
    const idx = this.projects.findIndex(p => p.id === id)
    if (idx === -1) throw new Error(`Project ${id} not found`)
    return this.updateProject(id, { archived: false })
  }

  async updateProject(id: string, patch: ProjectPatch): Promise<Project> {
    const idx = this.projects.findIndex(p => p.id === id)
    if (idx === -1) throw new Error(`Project ${id} not found`)
    const existing = this.projects[idx]!
    const next: Project = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    }
    this.projects = this.projects.map((p, i) => (i === idx ? next : p))
    return { ...next }
  }

  async deleteProject(id: string): Promise<void> {
    const idx = this.projects.findIndex(p => p.id === id)
    if (idx === -1) throw new Error(`Project ${id} not found`)
    this.projects = this.projects.filter(p => p.id !== id)
  }

  async listActivity(projectId: string): Promise<ProjectActivity[]> {
    return this.activity
      .filter(a => a.projectId === projectId)
      .sort((a, b) => {
        const byTime = b.createdAt.localeCompare(a.createdAt)
        // Monotonic tiebreaker ensures newest-first is deterministic even when
        // two entries share the same ISO timestamp (common in fast unit tests).
        return byTime !== 0 ? byTime : b._seq - a._seq
      })
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ _seq, ...rest }) => rest)
  }

  async addActivity(projectId: string, body: string, author: string): Promise<ProjectActivity> {
    const entry: StoredActivity = {
      id: uid(),
      projectId,
      body,
      author,
      createdAt: new Date().toISOString(),
      _seq: ++this.seq,
    }
    this.activity = [...this.activity, entry]
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { _seq, ...pub } = entry
    return { ...pub }
  }
}
