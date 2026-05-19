import { describe, it, expect } from 'vitest'
import { outstanding, isOverdue, portfolioTotals, isPotentialLead, splitProjects } from './derive'
import type { Project } from '../types'

function mk(p: Partial<Project>): Project {
  return {
    id: 'x', name: 'X', url: '', status: 'lead', completionPct: 0,
    lead: 'Dimitris', contractValue: 0, amountPaid: 0, retainerMonthly: null,
    startDate: null, targetDate: null, deliveredDate: null,
    clientCompany: null, clientContact: null, clientEmail: null,
    clientPhone: null, notes: '',
    outreachStage: null, proposalUrl: null, estimatedValue: null,
    whyThem: null, source: null, repoUrl: null,
    createdAt: '2026-01-01T00:00:00Z',
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

describe('isPotentialLead', () => {
  it('should be true for a pitched lead', () => {
    expect(isPotentialLead(mk({ status: 'lead', outreachStage: 'pitched' }))).toBe(true)
  })
  it('should be true for an identified lead', () => {
    expect(isPotentialLead(mk({ status: 'lead', outreachStage: 'identified' }))).toBe(true)
  })
  it('should be true for a demo_built lead', () => {
    expect(isPotentialLead(mk({ status: 'lead', outreachStage: 'demo_built' }))).toBe(true)
  })
  it('should be false for a lost lead', () => {
    expect(isPotentialLead(mk({ status: 'lead', outreachStage: 'lost' }))).toBe(false)
  })
  it('should be false for a won project (status in_progress, outreachStage won)', () => {
    expect(isPotentialLead(mk({ status: 'in_progress', outreachStage: 'won' }))).toBe(false)
  })
  it('should be false for a plain in_progress project', () => {
    expect(isPotentialLead(mk({ status: 'in_progress', outreachStage: null }))).toBe(false)
  })
  it('should be true for a status lead with null outreachStage (legacy lead)', () => {
    expect(isPotentialLead(mk({ status: 'lead', outreachStage: null }))).toBe(true)
  })
})

describe('splitProjects', () => {
  it('should put a pitched lead in leads, not active', () => {
    const { leads, active } = splitProjects([mk({ id: 'a', status: 'lead', outreachStage: 'pitched' })])
    expect(leads).toHaveLength(1)
    expect(active).toHaveLength(0)
  })
  it('should put an in_progress project in active, not leads', () => {
    const { leads, active } = splitProjects([mk({ id: 'b', status: 'in_progress', outreachStage: null })])
    expect(leads).toHaveLength(0)
    expect(active).toHaveLength(1)
  })
  it('should exclude a lost lead from both lists', () => {
    const { leads, active } = splitProjects([mk({ id: 'c', status: 'lead', outreachStage: 'lost' })])
    expect(leads).toHaveLength(0)
    expect(active).toHaveLength(0)
  })
  it('should put a won project (status in_progress, outreachStage won) in active', () => {
    const { leads, active } = splitProjects([mk({ id: 'd', status: 'in_progress', outreachStage: 'won' })])
    expect(leads).toHaveLength(0)
    expect(active).toHaveLength(1)
  })
  it('should put a status lead with null outreachStage in leads (legacy)', () => {
    const { leads, active } = splitProjects([mk({ id: 'e', status: 'lead', outreachStage: null })])
    expect(leads).toHaveLength(1)
    expect(active).toHaveLength(0)
  })
  it('should correctly split a mixed set', () => {
    const projects = [
      mk({ id: '1', status: 'lead', outreachStage: 'demo_built' }),
      mk({ id: '2', status: 'in_progress', outreachStage: null }),
      mk({ id: '3', status: 'lead', outreachStage: 'lost' }),
      mk({ id: '4', status: 'in_progress', outreachStage: 'won' }),
      mk({ id: '5', status: 'retainer', outreachStage: null }),
    ]
    const { leads, active } = splitProjects(projects)
    expect(leads.map(p => p.id)).toEqual(['1'])
    expect(active.map(p => p.id)).toEqual(['2', '4', '5'])
  })
})
