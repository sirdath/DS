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
      outreachStage: null, proposalUrl: null, estimatedValue: null,
      whyThem: null, source: null,
    })
    expect(created.id).toBeTruthy()
    expect(await ds.getProject(created.id)).toMatchObject({ name: 'Acme' })
  })

  it('should patch a project and bump updatedAt', async () => {
    const [p] = await ds.listProjects()
    // p is guaranteed by the seeded data; non-null assertion is safe here
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const before = p!.updatedAt
    const updated = await ds.updateProject(p!.id, { completionPct: 55 })
    expect(updated.completionPct).toBe(55)
    expect(updated.updatedAt >= before).toBe(true)
  })

  it('should append and list activity newest-first', async () => {
    const [p] = await ds.listProjects()
    // p is guaranteed by the seeded data; non-null assertion is safe here
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    await ds.addActivity(p!.id, 'sent proposal', 'Dimitris')
    await ds.addActivity(p!.id, 'client approved', 'Stelios')
    const log = await ds.listActivity(p!.id)
    expect(log[0]!.body).toBe('client approved')
  })
})
