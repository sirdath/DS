import type { ProjectDataSource } from './data-source'
import { MockDataSource } from './mock-data-source'

// Module-singleton so the mock persists across requests in dev.
let cached: ProjectDataSource | null = null

export function getDataSource(): ProjectDataSource {
  // Phase 4 swaps this body for the Supabase implementation.
  if (!cached) cached = new MockDataSource()
  return cached
}
