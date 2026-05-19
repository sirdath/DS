import type { Project, ProjectActivity } from '../types'
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
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-03-12T00:00:00Z',
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

  async updateProject(id: string, patch: ProjectPatch): Promise<Project> {
    const idx = this.projects.findIndex(p => p.id === id)
    if (idx === -1) throw new Error(`Project ${id} not found`)
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
