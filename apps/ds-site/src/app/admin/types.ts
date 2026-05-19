// The admin-domain Project. Unrelated to $ecretAnalytics/projects.ts
// (that one is a visit-tracking path list).

export const OUTREACH_STAGES = [
  'identified',
  'demo_built',
  'pitched',
  'won',
  'lost',
] as const

export type OutreachStage = (typeof OUTREACH_STAGES)[number]

export const OUTREACH_LABELS: Record<OutreachStage, string> = {
  identified: 'Identified',
  demo_built: 'Demo built',
  pitched: 'Pitched',
  won: 'Won',
  lost: 'Lost',
}

// Stages that still count as an open potential lead (not converted, not dead)
export const OPEN_OUTREACH_STAGES: OutreachStage[] = [
  'identified',
  'demo_built',
  'pitched',
]

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
  outreachStage: OutreachStage | null
  proposalUrl: string | null
  estimatedValue: number | null
  whyThem: string | null
  source: string | null
  repoUrl: string | null
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
