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
  listActivity(projectId: string): Promise<ProjectActivity[]>
  addActivity(projectId: string, body: string, author: string): Promise<ProjectActivity>
}
