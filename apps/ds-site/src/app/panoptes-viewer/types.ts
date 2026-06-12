/**
 * Panoptes study JSON contract — strict types.
 * noUncheckedIndexedAccess is on; array access yields T | undefined everywhere.
 */

export interface PanoptesAdjustment {
  name: string
  points: number
}

export interface HexScore {
  h3_id: string
  lat: number
  lon: number
  demand: number
  competition: number
  access: number
  total: number
  target_count: number
  complement_count: number
  population: number
  adjustments: PanoptesAdjustment[]
}

export type PanoptesHex = HexScore

export interface PanoptesCandidate {
  name: string
  lat: number
  lon: number
  score: HexScore
}

export interface PanoptesCompanion {
  category: string
  lift: number
  support: number
}

export interface PanoptesOpportunity {
  h3_id: string
  opportunity: number
  white_space: boolean
}

export interface PanoptesStudy {
  study: string
  mode: 'data' | 'advanced'
  generated_by: string
  hexes: PanoptesHex[]
  candidates: PanoptesCandidate[]
  companions: PanoptesCompanion[]
  opportunities: PanoptesOpportunity[]
  local_factors_applied: boolean
}

export type MetricKey = 'total' | 'demand' | 'competition' | 'access' | 'opportunity'

export interface MetricOption {
  key: MetricKey
  label: string
}

export const METRIC_OPTIONS: MetricOption[] = [
  { key: 'total', label: 'Total score' },
  { key: 'demand', label: 'Demand' },
  { key: 'competition', label: 'Competition' },
  { key: 'access', label: 'Access' },
  { key: 'opportunity', label: 'Opportunity' },
]
