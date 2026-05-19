import type { Project, ProjectActivity } from '../types'

export type NewProject = Omit<
  Project,
  'id' | 'createdAt' | 'updatedAt'
>
export type ProjectPatch = Partial<NewProject>

export interface ProjectDataSource {
  listProjects(): Promise<Project[]>
  getProject(id: string): Promise<Project | null>
  createProject(input: NewProject): Promise<Project>
  updateProject(id: string, patch: ProjectPatch): Promise<Project>
  /** Convert a lead to an active project: sets status in_progress + outreachStage won. */
  convertLead(id: string): Promise<Project>
  /** Archive a lead as lost: sets outreachStage lost, keeps status lead. */
  markLeadLost(id: string): Promise<Project>
  /** Soft-delete: sets archived true, bumps updatedAt. */
  archiveProject(id: string): Promise<Project>
  /** Restore from archive: sets archived false, bumps updatedAt. */
  unarchiveProject(id: string): Promise<Project>
  deleteProject(id: string): Promise<void>
  listActivity(projectId: string): Promise<ProjectActivity[]>
  addActivity(projectId: string, body: string, author: string): Promise<ProjectActivity>
}
