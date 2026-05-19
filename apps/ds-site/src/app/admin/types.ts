// The admin-domain Project. Unrelated to $ecretAnalytics/projects.ts
// (that one is a visit-tracking path list).

export const PROJECT_STATUSES = [
  'lead',
  'in_progress',
  'delivered',
  'retainer',
] as const

export type ProjectStatus = (typeof PROJECT_STATUSES)[number]

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  lead: 'Lead',
  in_progress: 'In progress',
  delivered: 'Delivered',
  retainer: 'Retainer',
}

export interface ProjectActivity {
  id: string
  projectId: string
  body: string
  author: string
  createdAt: string // ISO
}

export interface Project {
  id: string
  name: string
  url: string
  status: ProjectStatus
  completionPct: number // 0–100
  lead: string
  contractValue: number
  amountPaid: number
  retainerMonthly: number | null
  startDate: string | null // ISO date
  targetDate: string | null
  deliveredDate: string | null
  clientCompany: string | null
  clientContact: string | null
  clientEmail: string | null
  clientPhone: string | null
  notes: string
  createdAt: string
  updatedAt: string
}

export interface PortfolioTotals {
  totalContractValue: number
  totalCollected: number
  totalOutstanding: number
  monthlyRecurringRevenue: number
  countByStatus: Record<ProjectStatus, number>
}
