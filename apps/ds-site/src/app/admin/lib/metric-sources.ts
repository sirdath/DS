import type { Project } from '../types'
import { partitionProjects, portfolioTotals } from './derive'
import { getDataSource } from './get-data-source'
import type { MetricSources } from '@/app/admin/(app)/planning/lib/metric-source'

const EMPTY: MetricSources = { collected: 0, outstanding: 0, contract: 0, mrr: 0, pipeline: 0 }

/** Live figures a metric deadline can bind to, derived from the same portfolio totals the
 *  dashboard shows. Pure — pass in the projects. */
export function computeMetricSources(projects: Project[]): MetricSources {
  const { leads, active } = partitionProjects(projects)
  const totals = portfolioTotals(active)
  const pipeline = leads.reduce((sum, p) => sum + (p.estimatedValue ?? 0), 0)
  return {
    collected: totals.totalCollected,
    outstanding: totals.totalOutstanding,
    contract: totals.totalContractValue,
    mrr: totals.monthlyRecurringRevenue,
    pipeline,
  }
}

/** Loads projects and computes the live figures. Returns zeros (never throws) if the data
 *  source is unavailable, so the deadlines card degrades gracefully. */
export async function loadMetricSources(): Promise<MetricSources> {
  try {
    const projects = await getDataSource().listProjects()
    return computeMetricSources(projects)
  } catch {
    return EMPTY
  }
}
