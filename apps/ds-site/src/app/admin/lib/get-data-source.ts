/**
 * Conditional data-source seam.
 *
 * Keys present (NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY set)
 *   => real Supabase DB via SupabaseDataSource (RLS-enforced, session-aware).
 *
 * Keys absent (no env vars, e.g. local keyless dev or test runner)
 *   => in-memory MockDataSource singleton (keeps tests + keyless local dev
 *      working without any DB connection required).
 *
 * Vitest runs with no Supabase env vars, so all 52 existing tests stay green.
 */

import type { ProjectDataSource } from './data-source'
import { MockDataSource } from './mock-data-source'

// Module-singleton for the mock (persists across requests in dev).
let mockCached: ProjectDataSource | null = null

export function getDataSource(): ProjectDataSource {
  // Both public vars required; service-role is guarded separately in
  // supabase-server.ts. OR-logic was replaced with AND to avoid a half-key
  // state that could silently fall through to an unintended client (Fix 5).
  const hasSupabase =
    !!process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (hasSupabase) {
    // Import inline to avoid the `server-only` import crashing the test runner.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { SupabaseDataSource } = require('./supabase-data-source') as {
      SupabaseDataSource: new () => ProjectDataSource
    }
    return new SupabaseDataSource()
  }

  if (!mockCached) mockCached = new MockDataSource()
  return mockCached
}
