// Client-safe metric-source options + resolver (no server imports). A metric deadline can
// bind its "current" value to a live dashboard figure instead of a hand-typed number.

import type { Deadline } from './planning'

export interface MetricSources {
  collected: number
  outstanding: number
  contract: number
  mrr: number
  pipeline: number
}

export const METRIC_SOURCE_OPTIONS = [
  { key: '', label: 'Manual number' },
  { key: 'collected', label: 'Collected revenue' },
  { key: 'mrr', label: 'Monthly recurring' },
  { key: 'pipeline', label: 'Pipeline value' },
  { key: 'outstanding', label: 'Outstanding' },
  { key: 'contract', label: 'Contract value' },
] as const

export function metricSourceLabel(k: string): string {
  return METRIC_SOURCE_OPTIONS.find((o) => o.key === k)?.label ?? ''
}

/** The value to show for a metric deadline: its bound live source if set + available,
 *  otherwise the manually-stored current. */
export function resolveDeadlineCurrent(d: Deadline, sources?: MetricSources | null): number | null {
  if (d.metricSource && sources) {
    const v = sources[d.metricSource as keyof MetricSources]
    if (typeof v === 'number') return v
  }
  return d.metricCurrent
}
