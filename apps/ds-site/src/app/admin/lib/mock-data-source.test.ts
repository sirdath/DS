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

  describe('convertLead', () => {
    it('should set status in_progress and outreachStage won', async () => {
      const before = await ds.getProject('seed-helios')
      expect(before?.status).toBe('lead')
      const updated = await ds.convertLead('seed-helios')
      expect(updated.status).toBe('in_progress')
      expect(updated.outreachStage).toBe('won')
    })
    it('should bump updatedAt', async () => {
      const before = await ds.getProject('seed-helios')
      const updated = await ds.convertLead('seed-helios')
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(updated.updatedAt >= before!.updatedAt).toBe(true)
    })
    it('should persist the change via getProject', async () => {
      await ds.convertLead('seed-helios')
      const fetched = await ds.getProject('seed-helios')
      expect(fetched?.status).toBe('in_progress')
      expect(fetched?.outreachStage).toBe('won')
    })
    it('should throw when id is not found', async () => {
      await expect(ds.convertLead('no-such-id')).rejects.toThrow()
    })
  })

  describe('markLeadLost', () => {
    it('should set outreachStage lost and keep status lead', async () => {
      const before = await ds.getProject('seed-aegean')
      expect(before?.status).toBe('lead')
      const updated = await ds.markLeadLost('seed-aegean')
      expect(updated.outreachStage).toBe('lost')
      expect(updated.status).toBe('lead')
    })
    it('should bump updatedAt', async () => {
      const before = await ds.getProject('seed-aegean')
      const updated = await ds.markLeadLost('seed-aegean')
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      expect(updated.updatedAt >= before!.updatedAt).toBe(true)
    })
    it('should persist the change via getProject', async () => {
      await ds.markLeadLost('seed-aegean')
      const fetched = await ds.getProject('seed-aegean')
      expect(fetched?.outreachStage).toBe('lost')
      expect(fetched?.status).toBe('lead')
    })
    it('should throw when id is not found', async () => {
      await expect(ds.markLeadLost('no-such-id')).rejects.toThrow()
    })
  })
})
