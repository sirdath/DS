# Admin Panel Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** A private `/admin` portal for the two DS2 founders to track every client engagement (pipeline status, completion, money, activity), with the existing unprotected `$ecretAnalytics` page folded behind the same real auth.

**Architecture:** Contract-first / frontend-first (Approach A). Define the shared `Project` TypeScript type + pure derivation helpers first (TDD). Build the entire frontend against a typed in-memory mock behind a `ProjectDataSource` interface. Then swap the mock implementation for Supabase (tables + RLS + Server Actions) and gate `/admin` + `/admin/analytics` in middleware, components never change because they code against the contract.

**Tech Stack:** Next.js 16 App Router (`apps/ds-site`), React 19, TypeScript 5.6, Supabase (`@supabase/supabase-js` ^2.105), GSAP ^3.15, Vitest (added here), ported CSS/JS from `packages/frontendmaxxing-reference`.

**Branch:** `feat/admin-panel` (already created, design doc already committed).

**Reference:** Design at `docs/plans/2026-05-19-admin-panel-design.md`. Read it before starting.

---

## Conventions for the engineer

- Working dir is the monorepo root `c:\Users\Dath\OneDrive\Desktop\DATHSTEL`.
- Run app-scoped commands with pnpm filters, e.g. `pnpm --filter @ds/site check-types`.
- Shell is Windows PowerShell. Use `;` not `&&` to chain. No `/dev/null` (`$null`).
- All new files are kebab-case. Components functional. No `any`. Strict TS.
- Commit after every task with a conventional-commit message. Never `--no-verify`.
- Never hardcode colors outside the established dark palette (pure neutral grays, R=G=B, no blue undertone). Reuse `.lock-*` classes from `globals.css` for the login.
- The service-role key is server-only. The browser uses the anon key only.

---

## Phase 0, Test tooling

### Task 0: Add Vitest to ds-site

**Files:**
- Modify: `apps/ds-site/package.json`
- Create: `apps/ds-site/vitest.config.ts`
- Create: `apps/ds-site/src/app/admin/lib/__smoke__.test.ts`

**Step 1: Add deps and script**

Run:
```
pnpm --filter @ds/site add -D vitest@^2.1.0
```

**Step 2: Add the test script to `apps/ds-site/package.json`**

In `"scripts"`, add after `"check-types"`:
```json
"test": "vitest run",
"test:watch": "vitest"
```

**Step 3: Create `apps/ds-site/vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
```

**Step 4: Create a smoke test `apps/ds-site/src/app/admin/lib/__smoke__.test.ts`**

```ts
import { describe, it, expect } from 'vitest'

describe('vitest wiring', () => {
  it('runs', () => {
    expect(1 + 1).toBe(2)
  })
})
```

**Step 5: Run and verify**

Run: `pnpm --filter @ds/site test`
Expected: PASS, 1 test passed.

**Step 6: Commit**

```
git add apps/ds-site/package.json apps/ds-site/vitest.config.ts apps/ds-site/src/app/admin/lib/__smoke__.test.ts pnpm-lock.yaml
git commit -m "chore: add vitest to ds-site for admin logic tests"
```

---

## Phase 1, The contract (types + pure derivations, TDD)

### Task 1: Shared domain types

**Files:**
- Create: `apps/ds-site/src/app/admin/types.ts`

**Step 1: Write the types file**

```ts
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
```

**Step 2: Typecheck**

Run: `pnpm --filter @ds/site check-types`
Expected: PASS (no errors).

**Step 3: Commit**

```
git add apps/ds-site/src/app/admin/types.ts
git commit -m "feat(admin): shared Project domain types (the contract)"
```

### Task 2: Derivation helpers, write failing tests

**Files:**
- Create: `apps/ds-site/src/app/admin/lib/derive.test.ts`

**Step 1: Write the failing tests**

```ts
import { describe, it, expect } from 'vitest'
import { outstanding, isOverdue, portfolioTotals } from './derive'
import type { Project } from '../types'

function mk(p: Partial<Project>): Project {
  return {
    id: 'x', name: 'X', url: '', status: 'lead', completionPct: 0,
    lead: 'Dimitris', contractValue: 0, amountPaid: 0, retainerMonthly: null,
    startDate: null, targetDate: null, deliveredDate: null,
    clientCompany: null, clientContact: null, clientEmail: null,
    clientPhone: null, notes: '', createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z', ...p,
  }
}

describe('outstanding', () => {
  it('should be contractValue minus amountPaid', () => {
    expect(outstanding(mk({ contractValue: 5000, amountPaid: 2000 }))).toBe(3000)
  })
  it('should never go negative', () => {
    expect(outstanding(mk({ contractValue: 1000, amountPaid: 4000 }))).toBe(0)
  })
})

describe('isOverdue', () => {
  it('should be true when targetDate is past and not delivered', () => {
    expect(isOverdue(mk({ targetDate: '2020-01-01', status: 'in_progress' }), new Date('2026-05-19'))).toBe(true)
  })
  it('should be false when delivered even if past target', () => {
    expect(isOverdue(mk({ targetDate: '2020-01-01', status: 'delivered' }), new Date('2026-05-19'))).toBe(false)
  })
  it('should be false when no targetDate', () => {
    expect(isOverdue(mk({ targetDate: null }), new Date('2026-05-19'))).toBe(false)
  })
})

describe('portfolioTotals', () => {
  it('should sum money and MRR and count statuses', () => {
    const t = portfolioTotals([
      mk({ status: 'retainer', contractValue: 10000, amountPaid: 10000, retainerMonthly: 800 }),
      mk({ status: 'in_progress', contractValue: 5000, amountPaid: 1000 }),
      mk({ status: 'lead' }),
    ])
    expect(t.totalContractValue).toBe(15000)
    expect(t.totalCollected).toBe(11000)
    expect(t.totalOutstanding).toBe(4000)
    expect(t.monthlyRecurringRevenue).toBe(800)
    expect(t.countByStatus.retainer).toBe(1)
    expect(t.countByStatus.lead).toBe(1)
    expect(t.countByStatus.delivered).toBe(0)
  })
})
```

**Step 2: Run to verify failure**

Run: `pnpm --filter @ds/site test`
Expected: FAIL, cannot resolve `./derive`.

**Step 3: Commit the tests**

```
git add apps/ds-site/src/app/admin/lib/derive.test.ts
git commit -m "test(admin): failing tests for money/overdue derivations"
```

### Task 3: Implement derivations

**Files:**
- Create: `apps/ds-site/src/app/admin/lib/derive.ts`

**Step 1: Implement**

```ts
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
```

**Step 2: Run tests**

Run: `pnpm --filter @ds/site test`
Expected: PASS, all derive tests green.

**Step 3: Commit**

```
git add apps/ds-site/src/app/admin/lib/derive.ts
git commit -m "feat(admin): money/overdue/portfolio derivations"
```

---

## Phase 2, Data-source interface + in-memory mock

### Task 4: ProjectDataSource interface + mock (TDD)

**Files:**
- Create: `apps/ds-site/src/app/admin/lib/data-source.ts` (interface)
- Create: `apps/ds-site/src/app/admin/lib/mock-data-source.ts`
- Create: `apps/ds-site/src/app/admin/lib/mock-data-source.test.ts`

**Step 1: Write the interface `data-source.ts`**

```ts
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
```

**Step 2: Write failing test `mock-data-source.test.ts`**

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { MockDataSource } from './mock-data-source'

describe('MockDataSource', () => {
  let ds: MockDataSource
  beforeEach(() => { ds = new MockDataSource() })

  it('should seed with at least one project', async () => {
    expect((await ds.listProjects()).length).toBeGreaterThan(0)
  })

  it('should create then read back a project', async () => {
    const created = await ds.createProject({
      name: 'Acme', url: 'acme.com', status: 'lead', completionPct: 0,
      lead: 'Stelios', contractValue: 9000, amountPaid: 0, retainerMonthly: null,
      startDate: null, targetDate: null, deliveredDate: null,
      clientCompany: 'Acme', clientContact: null, clientEmail: null,
      clientPhone: null, notes: '',
    })
    expect(created.id).toBeTruthy()
    expect(await ds.getProject(created.id)).toMatchObject({ name: 'Acme' })
  })

  it('should patch a project and bump updatedAt', async () => {
    const [p] = await ds.listProjects()
    const before = p.updatedAt
    const updated = await ds.updateProject(p.id, { completionPct: 55 })
    expect(updated.completionPct).toBe(55)
    expect(updated.updatedAt >= before).toBe(true)
  })

  it('should append and list activity newest-first', async () => {
    const [p] = await ds.listProjects()
    await ds.addActivity(p.id, 'sent proposal', 'Dimitris')
    await ds.addActivity(p.id, 'client approved', 'Stelios')
    const log = await ds.listActivity(p.id)
    expect(log[0].body).toBe('client approved')
  })
})
```

**Step 3: Run to verify failure**

Run: `pnpm --filter @ds/site test`
Expected: FAIL, cannot resolve `./mock-data-source`.

**Step 4: Implement `mock-data-source.ts`**

```ts
import type { Project, ProjectActivity } from '../types'
import type { ProjectDataSource, NewProject, ProjectPatch } from './data-source'

function uid(): string {
  return globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2)
}

const SEED: Project[] = [
  {
    id: 'seed-megagym',
    name: 'MegaGym',
    url: 'ds2-consulting.com/MegaGym-Website',
    status: 'delivered',
    completionPct: 100,
    lead: 'Dimitris',
    contractValue: 6000,
    amountPaid: 6000,
    retainerMonthly: null,
    startDate: '2026-02-01',
    targetDate: '2026-03-15',
    deliveredDate: '2026-03-12',
    clientCompany: 'MegaGym',
    clientContact: 'Owner',
    clientEmail: null,
    clientPhone: null,
    notes: 'Fitness centre, Athens. First delivered client.',
    createdAt: '2026-02-01T00:00:00Z',
    updatedAt: '2026-03-12T00:00:00Z',
  },
]

export class MockDataSource implements ProjectDataSource {
  private projects: Project[] = SEED.map(p => ({ ...p }))
  private activity: ProjectActivity[] = []

  async listProjects(): Promise<Project[]> {
    return this.projects.map(p => ({ ...p }))
  }

  async getProject(id: string): Promise<Project | null> {
    const p = this.projects.find(x => x.id === id)
    return p ? { ...p } : null
  }

  async createProject(input: NewProject): Promise<Project> {
    const now = new Date().toISOString()
    const project: Project = { ...input, id: uid(), createdAt: now, updatedAt: now }
    this.projects = [project, ...this.projects]
    return { ...project }
  }

  async updateProject(id: string, patch: ProjectPatch): Promise<Project> {
    const idx = this.projects.findIndex(p => p.id === id)
    if (idx === -1) throw new Error(`Project ${id} not found`)
    const next: Project = {
      ...this.projects[idx],
      ...patch,
      updatedAt: new Date().toISOString(),
    }
    this.projects = this.projects.map((p, i) => (i === idx ? next : p))
    return { ...next }
  }

  async listActivity(projectId: string): Promise<ProjectActivity[]> {
    return this.activity
      .filter(a => a.projectId === projectId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }

  async addActivity(projectId: string, body: string, author: string): Promise<ProjectActivity> {
    const entry: ProjectActivity = {
      id: uid(), projectId, body, author,
      createdAt: new Date().toISOString(),
    }
    this.activity = [...this.activity, entry]
    return { ...entry }
  }
}
```

**Step 5: Run tests**

Run: `pnpm --filter @ds/site test`
Expected: PASS, all MockDataSource tests green.

**Step 6: Commit**

```
git add apps/ds-site/src/app/admin/lib/data-source.ts apps/ds-site/src/app/admin/lib/mock-data-source.ts apps/ds-site/src/app/admin/lib/mock-data-source.test.ts
git commit -m "feat(admin): ProjectDataSource interface + in-memory mock"
```

### Task 5: Data-source resolver + Server Actions (mock-backed)

**Files:**
- Create: `apps/ds-site/src/app/admin/lib/get-data-source.ts`
- Create: `apps/ds-site/src/app/admin/actions.ts`

**Step 1: `get-data-source.ts`, single seam to swap in Phase 4**

```ts
import type { ProjectDataSource } from './data-source'
import { MockDataSource } from './mock-data-source'

// Module-singleton so the mock persists across requests in dev.
let cached: ProjectDataSource | null = null

export function getDataSource(): ProjectDataSource {
  // Phase 4 swaps this body for the Supabase implementation.
  if (!cached) cached = new MockDataSource()
  return cached
}
```

**Step 2: `actions.ts`, Server Actions with boundary validation**

```ts
'use server'

import { revalidatePath } from 'next/cache'
import { getDataSource } from './lib/get-data-source'
import { PROJECT_STATUSES } from './types'
import type { ProjectStatus } from './types'
import type { NewProject, ProjectPatch } from './lib/data-source'

function str(v: FormDataEntryValue | null): string {
  return typeof v === 'string' ? v.trim() : ''
}
function num(v: FormDataEntryValue | null): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : 0
}
function nullableStr(v: FormDataEntryValue | null): string | null {
  const s = str(v)
  return s === '' ? null : s
}
function asStatus(v: FormDataEntryValue | null): ProjectStatus {
  const s = str(v)
  return (PROJECT_STATUSES as readonly string[]).includes(s)
    ? (s as ProjectStatus)
    : 'lead'
}

function parseProject(fd: FormData): NewProject {
  const name = str(fd.get('name'))
  if (!name) throw new Error('Name is required')
  const completionPct = Math.min(100, Math.max(0, num(fd.get('completionPct'))))
  return {
    name,
    url: str(fd.get('url')),
    status: asStatus(fd.get('status')),
    completionPct,
    lead: str(fd.get('lead')) || 'Dimitris',
    contractValue: num(fd.get('contractValue')),
    amountPaid: num(fd.get('amountPaid')),
    retainerMonthly: fd.get('retainerMonthly') ? num(fd.get('retainerMonthly')) : null,
    startDate: nullableStr(fd.get('startDate')),
    targetDate: nullableStr(fd.get('targetDate')),
    deliveredDate: nullableStr(fd.get('deliveredDate')),
    clientCompany: nullableStr(fd.get('clientCompany')),
    clientContact: nullableStr(fd.get('clientContact')),
    clientEmail: nullableStr(fd.get('clientEmail')),
    clientPhone: nullableStr(fd.get('clientPhone')),
    notes: str(fd.get('notes')),
  }
}

export async function createProjectAction(fd: FormData): Promise<void> {
  const ds = getDataSource()
  await ds.createProject(parseProject(fd))
  revalidatePath('/admin')
}

export async function updateProjectAction(id: string, fd: FormData): Promise<void> {
  if (!id) throw new Error('Missing project id')
  const ds = getDataSource()
  const patch: ProjectPatch = parseProject(fd)
  await ds.updateProject(id, patch)
  revalidatePath('/admin')
  revalidatePath(`/admin/project/${id}`)
}

export async function addActivityAction(projectId: string, fd: FormData): Promise<void> {
  const body = str(fd.get('body'))
  const author = str(fd.get('author')) || 'Dimitris'
  if (!projectId || !body) throw new Error('Missing project or update text')
  await getDataSource().addActivity(projectId, body, author)
  revalidatePath(`/admin/project/${projectId}`)
}
```

**Step 3: Typecheck**

Run: `pnpm --filter @ds/site check-types`
Expected: PASS.

**Step 4: Commit**

```
git add apps/ds-site/src/app/admin/lib/get-data-source.ts apps/ds-site/src/app/admin/actions.ts
git commit -m "feat(admin): data-source resolver + mock-backed Server Actions"
```

---

## Phase 3, Frontend (frontendmaxxing + GSAP, against the mock)

### Task 6: Port frontendmaxxing card/stagger assets into the admin app

**Files:**
- Read: `packages/frontendmaxxing-reference/components/cards.css`
- Read: `packages/frontendmaxxing-reference/animations/stagger.js`
- Create: `apps/ds-site/src/app/admin/admin.css`

**Step 1:** Read the two reference files. Port, do not import, the card surface
and stagger keyframes you need into `admin.css`, adapted to the dark palette
(pure neutral grays, R=G=B). `admin.css` owns all admin styling not already
covered by the reused `.lock-*` classes in `globals.css`. Keep it under 500 lines.
Include: `.admin-shell`, `.admin-topbar`, `.admin-totals`, `.admin-grid`,
`.admin-card`, `.admin-status-pill` (one modifier per `ProjectStatus`),
`.admin-progress`, `.admin-overdue`, `.admin-detail`, `.admin-field`,
`.admin-activity`, and a `@media (prefers-reduced-motion: reduce)` block that
disables transforms/animations.

**Step 2:** Typecheck/build sanity, `pnpm --filter @ds/site check-types` → PASS.

**Step 3: Commit**

```
git add apps/ds-site/src/app/admin/admin.css
git commit -m "feat(admin): port frontendmaxxing card+stagger styles (dark)"
```

### Task 7: Admin layout + GSAP stagger hook

**Files:**
- Create: `apps/ds-site/src/app/admin/layout.tsx`
- Create: `apps/ds-site/src/app/admin/use-stagger-in.ts`

**Step 1:** `layout.tsx`, server component, imports `./admin.css`, renders a
dark `<div className="admin-shell">` wrapper with a header (`DS2 · Admin`,
nav links: Projects `/admin`, Analytics `/admin/analytics`, a logout form
posting to a `/admin/logout` route, created in Phase 4, stub the link now) and
`{children}`. No data fetching here.

**Step 2:** `use-stagger-in.ts`, `'use client'` hook wrapping GSAP:

```ts
'use client'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export function useStaggerIn<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  useEffect(() => {
    const root = ref.current
    if (!root) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const items = root.querySelectorAll('[data-stagger]')
    const ctx = gsap.context(() => {
      gsap.from(items, {
        opacity: 0, y: 18, duration: 0.5,
        stagger: 0.05, ease: 'power2.out',
      })
    }, root)
    return () => ctx.revert()
  }, [])
  return ref
}
```

**Step 3:** `pnpm --filter @ds/site check-types` → PASS.

**Step 4: Commit**

```
git add apps/ds-site/src/app/admin/layout.tsx apps/ds-site/src/app/admin/use-stagger-in.ts
git commit -m "feat(admin): dark admin layout + GSAP stagger hook"
```

### Task 8: Dashboard page (list + totals + status filter)

**Files:**
- Create: `apps/ds-site/src/app/admin/page.tsx` (server component)
- Create: `apps/ds-site/src/app/admin/project-grid.tsx` (`'use client'`)
- Create: `apps/ds-site/src/app/admin/format.ts`

**Step 1:** `format.ts`, `formatMoney(n)` (e.g. `€6,000`), `formatDate(iso)`,
`relativeAge(iso)`. Pure functions.

**Step 2:** `page.tsx`, `export const dynamic = 'force-dynamic'`. Reads
`getDataSource().listProjects()`, computes `portfolioTotals`, renders the
`.admin-totals` bar (total contract value, collected, outstanding, MRR, counts)
and `<ProjectGrid projects={...} />`. Reads `searchParams.status` to filter.

**Step 3:** `project-grid.tsx`, `'use client'`, uses `useStaggerIn`. Renders a
`.admin-grid`; each card (`data-stagger`) links to `/admin/project/[id]`, shows
name, status pill, animated `.admin-progress` bar (width = completionPct),
lead, `formatMoney(amountPaid)` / `formatMoney(outstanding(p))`, and an
`.admin-overdue` badge when `isOverdue(p)`. Status filter is a row of links
that set `?status=`.

**Step 4:** Build check.

Run: `pnpm --filter @ds/site build`
Expected: PASS, `/admin` route compiles.

**Step 5: Manual smoke**

Run dev (if not running): `pnpm --filter @ds/site dev`.
Open `http://localhost:3001/admin` → seeded MegaGym card visible, totals bar
populated, cards stagger in, filter links work.

**Step 6: Commit**

```
git add apps/ds-site/src/app/admin/page.tsx apps/ds-site/src/app/admin/project-grid.tsx apps/ds-site/src/app/admin/format.ts
git commit -m "feat(admin): dashboard grid with totals + status filter"
```

### Task 9: Project detail + edit + activity feed

**Files:**
- Create: `apps/ds-site/src/app/admin/project/[id]/page.tsx`
- Create: `apps/ds-site/src/app/admin/project/[id]/edit-form.tsx` (`'use client'`)
- Create: `apps/ds-site/src/app/admin/project/[id]/not-found.tsx`

**Step 1:** `page.tsx`, server component. `const { id } = await params`
(Next 16 async params). `getProject(id)` → if null, call `notFound()`. Render
full record, the activity feed (`listActivity`) newest-first, an "add update"
form bound to `addActivityAction.bind(null, id)`, and `<EditForm project={p} />`.

**Step 2:** `edit-form.tsx`, `'use client'`. A `<form action={updateAction}>`
where `updateAction = updateProjectAction.bind(null, project.id)`. Inputs for
every editable field (status `<select>` from `PROJECT_STATUSES`/`STATUS_LABELS`,
`completionPct` range, money number inputs, dates, client contact, notes).
Reuse `.admin-field` styling.

**Step 3:** `not-found.tsx`, minimal dark "Project not found" with a link back
to `/admin`.

**Step 4:** Build + typecheck.

Run: `pnpm --filter @ds/site build`
Expected: PASS.

**Step 5: Manual smoke**

Open the MegaGym card → detail page. Edit completion to 80, save → redirected
back / value persists (mock singleton). Add an activity update → appears
newest-first.

**Step 6: Commit**

```
git add apps/ds-site/src/app/admin/project
git commit -m "feat(admin): project detail, inline edit, activity feed"
```

### Task 10: Relocate analytics under /admin/analytics

**Files:**
- Create: `apps/ds-site/src/app/admin/analytics/page.tsx`
- Create: `apps/ds-site/src/app/admin/analytics/ProjectCard.tsx`
- Create: `apps/ds-site/src/app/admin/analytics/[project]/page.tsx`
- Create: `apps/ds-site/src/app/admin/analytics/projects.ts`
- Delete: the four files under `apps/ds-site/src/app/$ecretAnalytics/`

**Step 1:** `git mv` each `$ecretAnalytics` file into `admin/analytics/`
(preserves history). The `$ecretAnalytics` segment is a folder, so move its
contents:
```
git mv "apps/ds-site/src/app/$ecretAnalytics/page.tsx" apps/ds-site/src/app/admin/analytics/page.tsx
git mv "apps/ds-site/src/app/$ecretAnalytics/ProjectCard.tsx" apps/ds-site/src/app/admin/analytics/ProjectCard.tsx
git mv "apps/ds-site/src/app/$ecretAnalytics/projects.ts" apps/ds-site/src/app/admin/analytics/projects.ts
git mv "apps/ds-site/src/app/$ecretAnalytics/[project]/page.tsx" "apps/ds-site/src/app/admin/analytics/[project]/page.tsx"
```
Then remove the now-empty `$ecretAnalytics` directory.

**Step 2:** Fix internal links: in the moved files, replace any
`/$ecretAnalytics` href/path with `/admin/analytics`. Grep to confirm none
remain: `Grep "\$ecretAnalytics"` over `apps/ds-site` → zero hits.

**Step 3:** Build.

Run: `pnpm --filter @ds/site build`
Expected: PASS, `/admin/analytics` and `/admin/analytics/[project]` compile,
`$ecretAnalytics` gone.

**Step 4: Commit**

```
git add -A apps/ds-site/src/app
git commit -m "refactor(admin): relocate analytics under /admin/analytics"
```

---

## Phase 4, Backend: Supabase + auth + middleware gate

> Uses the Supabase MCP. Confirm the target project with `list_projects` first.
> `apply_migration` writes to the live project, read the design's security
> section before running.

### Task 11: Database schema + RLS migration

**Files:**
- Create: `apps/ds-site/supabase/migrations/2026-05-19-admin-panel.sql` (also
  apply via MCP `apply_migration`)

**Step 1:** Write the migration SQL:

```sql
create type project_status as enum ('lead','in_progress','delivered','retainer');

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  url text not null default '',
  status project_status not null default 'lead',
  completion_pct int not null default 0 check (completion_pct between 0 and 100),
  lead text not null default 'Dimitris',
  contract_value numeric not null default 0,
  amount_paid numeric not null default 0,
  retainer_monthly numeric,
  start_date date,
  target_date date,
  delivered_date date,
  client_company text,
  client_contact text,
  client_email text,
  client_phone text,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table project_activity (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  body text not null,
  author text not null,
  created_at timestamptz not null default now()
);

create table admin_users (
  id uuid primary key default gen_random_uuid(),
  username text unique not null,
  auth_user_id uuid not null references auth.users(id) on delete cascade
);

alter table projects enable row level security;
alter table project_activity enable row level security;
alter table admin_users enable row level security;

-- Only authenticated users who are registered admins may touch data.
create policy admin_all_projects on projects
  for all to authenticated
  using (exists (select 1 from admin_users a where a.auth_user_id = auth.uid()))
  with check (exists (select 1 from admin_users a where a.auth_user_id = auth.uid()));

create policy admin_all_activity on project_activity
  for all to authenticated
  using (exists (select 1 from admin_users a where a.auth_user_id = auth.uid()))
  with check (exists (select 1 from admin_users a where a.auth_user_id = auth.uid()));

create policy admin_read_self on admin_users
  for select to authenticated
  using (auth_user_id = auth.uid());
```

**Step 2:** Apply via Supabase MCP `apply_migration` (name
`admin_panel_init`). Verify with `list_tables` → `projects`, `project_activity`,
`admin_users` present with RLS enabled (`get_advisors` security → no
"RLS disabled" warning on these).

**Step 3:** Manual one-time seed (NOT in repo, do via Supabase dashboard or
MCP `execute_sql`): create the two auth users (email+password) in Auth, then
`insert into admin_users (username, auth_user_id) values ('dimitris','<uuid>'),('stelios','<uuid>');`
Disable public signups in Supabase Auth settings. Record nothing secret in git.

**Step 4: Commit (SQL file only)**

```
git add apps/ds-site/supabase/migrations/2026-05-19-admin-panel.sql
git commit -m "feat(admin): supabase schema + RLS for projects/activity/admins"
```

### Task 12: Supabase server client + Supabase data source

**Files:**
- Create: `apps/ds-site/src/app/admin/lib/supabase-server.ts`
- Create: `apps/ds-site/src/app/admin/lib/supabase-data-source.ts`
- Modify: `apps/ds-site/src/app/admin/lib/get-data-source.ts`

**Step 1:** `supabase-server.ts`, create a request-scoped Supabase client using
`@supabase/supabase-js` with `NEXT_PUBLIC_SUPABASE_URL` + anon key, reading the
auth session from the `sb-*` cookies (Next 16 `cookies()` is async, `await`
it). Export `getSupabaseServer()` returning the client, and
`getSessionUser()` returning the authenticated user or `null`.

**Step 2:** `supabase-data-source.ts`, a `SupabaseDataSource` class
implementing `ProjectDataSource`, mapping snake_case columns ↔ the camelCase
`Project` type. Every method uses the session client (RLS-enforced). Throw on
Supabase errors so the Server Action surfaces them.

**Step 3:** Swap the seam in `get-data-source.ts`:

```ts
import type { ProjectDataSource } from './data-source'
import { SupabaseDataSource } from './supabase-data-source'

export function getDataSource(): ProjectDataSource {
  return new SupabaseDataSource()
}
```
(Keep `mock-data-source.ts` for tests.)

**Step 4:** `pnpm --filter @ds/site check-types` → PASS. `pnpm --filter @ds/site test` → still PASS (mock tests untouched).

**Step 5: Commit**

```
git add apps/ds-site/src/app/admin/lib/supabase-server.ts apps/ds-site/src/app/admin/lib/supabase-data-source.ts apps/ds-site/src/app/admin/lib/get-data-source.ts
git commit -m "feat(admin): supabase server client + data source; swap seam"
```

### Task 13: Username→account login, logout, allowlist

**Files:**
- Create: `apps/ds-site/src/app/admin/login/page.tsx` (`'use client'`, reuses `.lock-*`)
- Create: `apps/ds-site/src/app/admin/login/login-action.ts`
- Create: `apps/ds-site/src/app/admin/logout/route.ts`
- Create: `apps/ds-site/src/app/admin/lib/allowlist.ts`

**Step 1:** `allowlist.ts`, `ADMIN_USERNAMES = ['dimitris','stelios']`; helper
`isAllowed(username)`.

**Step 2:** `login-action.ts`, `'use server'`. Takes username+password.
Reject if `!isAllowed(username)`. Look up `admin_users` by username (via a
service-role client, server only, to resolve the linked auth email), then
`signInWithPassword({ email, password })` on a cookie-writing server client.
Generic error message on any failure (no user enumeration). On success redirect
to `?redirect` or `/admin`.

**Step 3:** `login/page.tsx`, reuse the `.lock-shell/.lock-card/.lock-input`
markup from `megagym-login` but with a **username** field + password field,
posting to the login action. Suspense-wrapped like the existing one.

**Step 4:** `logout/route.ts`, POST handler: sign out (clear Supabase cookies),
redirect to `/admin/login`.

**Step 5:** Wire the layout's logout link/form (Task 7 stub) to POST `/admin/logout`.

**Step 6:** Typecheck + build → PASS.

**Step 7: Commit**

```
git add apps/ds-site/src/app/admin/login apps/ds-site/src/app/admin/logout apps/ds-site/src/app/admin/lib/allowlist.ts apps/ds-site/src/app/admin/layout.tsx
git commit -m "feat(admin): username login, logout, email allowlist"
```

### Task 14: Middleware gate for /admin + /admin/analytics

**Files:**
- Modify: `apps/ds-site/src/middleware.ts`

**Step 1:** Add an admin branch BEFORE the existing megagym logic. For paths
matching `/admin` (except `/admin/login`): read the Supabase session from
cookies; if no valid session OR the session user is not an allowlisted admin →
redirect to `/admin/login?redirect=<pathname>`. Do not disturb the existing
megagym cookie logic or `visits` logging.

**Step 2:** Extend `export const config.matcher` to include
`'/admin/:path*'`. (Result: `['/clients/:path*', '/MegaGym-Website/:path*', '/admin/:path*']`.)

**Step 3: Write the middleware smoke test**

Create `apps/ds-site/src/middleware.test.ts`:
```ts
import { describe, it, expect } from 'vitest'
import { middleware } from './middleware'
import { NextRequest } from 'next/server'

describe('admin gate', () => {
  it('redirects unauthenticated /admin to /admin/login', () => {
    const req = new NextRequest('https://ds2-consulting.com/admin')
    const res = middleware(req)
    expect(res?.headers.get('location')).toContain('/admin/login')
  })
  it('does not gate /admin/login itself', () => {
    const req = new NextRequest('https://ds2-consulting.com/admin/login')
    const res = middleware(req)
    const loc = res?.headers.get('location') ?? ''
    expect(loc).not.toContain('/admin/login?redirect=/admin/login')
  })
})
```

**Step 4: Run**

Run: `pnpm --filter @ds/site test`
Expected: PASS (plus all earlier suites still green).

**Step 5: Commit**

```
git add apps/ds-site/src/middleware.ts apps/ds-site/src/middleware.test.ts
git commit -m "feat(admin): middleware gate for /admin and /admin/analytics"
```

---

## Phase 5, Verification & finish

### Task 15: Full verification gate

**REQUIRED SUB-SKILL:** Use superpowers:verification-before-completion.

**Step 1:** Run, capture output, paste into the task notes:
- `pnpm --filter @ds/site test` → all suites PASS
- `pnpm --filter @ds/site check-types` → no errors
- `pnpm --filter @ds/site lint` → clean
- `pnpm --filter @ds/site build` → success, `/admin`, `/admin/project/[id]`, `/admin/analytics` all in the route list, no `$ecretAnalytics`

**Step 2: Manual auth smoke (real Supabase)**
- Visit `/admin` logged out → redirected to `/admin/login`.
- Wrong username → generic error, no enumeration.
- Correct `dimitris` + password → dashboard, real seeded/created data.
- `/admin/analytics` reachable only while logged in; logged out → redirect.
- Logout → session cleared, `/admin` redirects again.

**Step 3:** Confirm no secret committed: `git log -p` for the feature range
shows no service-role key, no passwords, no `.env`. `Grep "SERVICE_ROLE"` in
committed files → only server-side usage, never in a `'use client'` file.

### Task 16: Finish the branch

**REQUIRED SUB-SKILL:** Use superpowers:finishing-a-development-branch.
Present merge / PR / cleanup options. Update `CLAUDE.md` monorepo layout note
and the design doc if reality diverged.

---

## YAGNI guardrails (do NOT build)

- No public signup, password reset, or "forgot password" UI.
- No roles/permissions, both admins are equal.
- No realtime/websockets, no charts library, text + CSS bars only.
- No new UI framework. Reuse `.lock-*` + ported frontendmaxxing CSS only.
- Do not touch the megagym/`clients`/`visits` flow beyond the middleware addition.
