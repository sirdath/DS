import type { Project, PortfolioTotals, ProjectStatus } from '../types'
import { PROJECT_STATUSES, OPEN_OUTREACH_STAGES } from '../types'

/**
 * A project is a potential lead when:
 * - its status is 'lead', AND
 * - its outreachStage is one of the open stages (identified/demo_built/pitched)
 *   OR outreachStage is null (legacy lead entered without a stage).
 */
export function isPotentialLead(p: Project): boolean {
  if (p.status !== 'lead') return false
  if (p.outreachStage === null) return true
  return (OPEN_OUTREACH_STAGES as readonly string[]).includes(p.outreachStage)
}

/**
 * Splits a project list into:
 * - leads: open potential leads (isPotentialLead === true)
 * - active: everything else EXCEPT lost leads
 *   (status 'lead' && outreachStage 'lost' are excluded from both lists)
 */
export function splitProjects(projects: Project[]): { leads: Project[]; active: Project[] } {
  const leads: Project[] = []
  const active: Project[] = []
  for (const p of projects) {
    if (isPotentialLead(p)) {
      leads.push(p)
    } else if (!(p.status === 'lead' && p.outreachStage === 'lost')) {
      active.push(p)
    }
    // lost leads (status 'lead', outreachStage 'lost') fall through → excluded from both
  }
  return { leads, active }
}

export function outstanding(p: Project): number {
  return Math.max(0, p.contractValue - p.amountPaid)
}

export function isOverdue(p: Project, now: Date = new Date()): boolean {
  if (!p.targetDate) return false
  if (p.status === 'delivered' || p.status === 'retainer') return false
  return new Date(p.targetDate).getTime() < now.getTime()
}

export function portfolioTotals(projects: Project[]): PortfolioTotals {
  const countByStatus = Object.fromEntries(
    PROJECT_STATUSES.map(s => [s, 0]),
  ) as Record<ProjectStatus, number>

  let totalContractValue = 0
  let totalCollected = 0
  let monthlyRecurringRevenue = 0

  for (const p of projects) {
    totalContractValue += p.contractValue
    totalCollected += p.amountPaid
    if (p.status === 'retainer' && p.retainerMonthly) {
      monthlyRecurringRevenue += p.retainerMonthly
    }
    countByStatus[p.status] += 1
  }

  return {
    totalContractValue,
    totalCollected,
    totalOutstanding: Math.max(0, totalContractValue - totalCollected),
    monthlyRecurringRevenue,
    countByStatus,
  }
}
