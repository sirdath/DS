import type { Project, PortfolioTotals, ProjectStatus } from '../types'
import { PROJECT_STATUSES } from '../types'

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
