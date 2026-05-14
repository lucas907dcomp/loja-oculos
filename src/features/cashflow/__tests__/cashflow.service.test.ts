import { describe, it, expect, vi, beforeEach } from 'vitest'
import Decimal from 'decimal.js'

const mockPrisma = vi.hoisted(() => ({
  cashFlowEntry: {
    findMany: vi.fn(),
    create: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { CashFlowService } from '../services/cashflow.service'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CashFlowService.getMonthlySummary', () => {
  it('aggregates INCOME and EXPENSE correctly', async () => {
    mockPrisma.cashFlowEntry.findMany.mockResolvedValue([
      { type: 'INCOME', amount: { toString: () => '200.00' } },
      { type: 'EXPENSE', amount: { toString: () => '50.00' } },
    ])

    const result = await CashFlowService.getMonthlySummary(2026, 5)

    expect(result.income).toEqual(new Decimal('200.00'))
    expect(result.expense).toEqual(new Decimal('50.00'))
    expect(result.balance).toEqual(new Decimal('150.00'))
  })

  it('returns zeros for an empty month', async () => {
    mockPrisma.cashFlowEntry.findMany.mockResolvedValue([])

    const result = await CashFlowService.getMonthlySummary(2026, 5)

    expect(result.income).toEqual(new Decimal(0))
    expect(result.expense).toEqual(new Decimal(0))
    expect(result.balance).toEqual(new Decimal(0))
  })
})

describe('CashFlowService.createManualEntry', () => {
  it('creates entry with saleId null on happy path', async () => {
    const fakeEntry = {
      id: 'entry-1',
      type: 'EXPENSE',
      amount: { toString: () => '75.00' },
      note: 'Aluguel',
      date: new Date(),
      saleId: null,
    }
    mockPrisma.cashFlowEntry.create.mockResolvedValue(fakeEntry)

    const result = await CashFlowService.createManualEntry({
      type: 'EXPENSE',
      amount: 75,
      note: 'Aluguel',
    })

    expect(mockPrisma.cashFlowEntry.create).toHaveBeenCalledOnce()
    expect(result.saleId).toBeNull()
    expect(result.note).toBe('Aluguel')
  })

  it('throws and does not call Prisma when amount <= 0', async () => {
    await expect(
      CashFlowService.createManualEntry({ type: 'EXPENSE', amount: 0, note: 'Test' }),
    ).rejects.toThrow('Valor inválido')

    expect(mockPrisma.cashFlowEntry.create).not.toHaveBeenCalled()
  })

  it('throws and does not call Prisma when note is empty', async () => {
    await expect(
      CashFlowService.createManualEntry({ type: 'EXPENSE', amount: 50, note: '   ' }),
    ).rejects.toThrow('Descrição obrigatória')

    expect(mockPrisma.cashFlowEntry.create).not.toHaveBeenCalled()
  })
})
