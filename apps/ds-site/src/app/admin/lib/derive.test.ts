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
