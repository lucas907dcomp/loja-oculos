import Decimal from 'decimal.js'
import { prisma } from '@/lib/prisma'
import type { CashFlowEntryRecord, CashFlowSummary, CreateManualEntryDTO } from '../cashflow.contract'

export class CashFlowService {
  static async getEntries(filters?: {
    from?: Date
    to?: Date
    type?: 'INCOME' | 'EXPENSE'
  }): Promise<CashFlowEntryRecord[]> {
    const now = new Date()
    const defaultFrom = new Date(now.getFullYear(), now.getMonth(), 1)

    const entries = await prisma.cashFlowEntry.findMany({
      where: {
        date: {
          gte: filters?.from ?? defaultFrom,
          ...(filters?.to ? { lte: filters.to } : {}),
        },
        ...(filters?.type ? { type: filters.type } : {}),
      },
      orderBy: { date: 'desc' },
    })

    return entries as unknown as CashFlowEntryRecord[]
  }

  static async getMonthlySummary(year: number, month: number): Promise<CashFlowSummary> {
    const from = new Date(year, month - 1, 1)
    const to = new Date(year, month, 0, 23, 59, 59, 999)

    const entries = await prisma.cashFlowEntry.findMany({
      where: { date: { gte: from, lte: to } },
      select: { type: true, amount: true },
    })

    let income = new Decimal(0)
    let expense = new Decimal(0)

    for (const entry of entries) {
      const amount = new Decimal(entry.amount.toString())
      if (entry.type === 'INCOME') income = income.plus(amount)
      else expense = expense.plus(amount)
    }

    return { income, expense, balance: income.minus(expense) }
  }

  static async createManualEntry(dto: CreateManualEntryDTO): Promise<CashFlowEntryRecord> {
    if (dto.amount <= 0) throw new Error('Valor inválido')
    if (!dto.note?.trim()) throw new Error('Descrição obrigatória')

    const entry = await prisma.cashFlowEntry.create({
      data: {
        type: dto.type,
        amount: new Decimal(dto.amount).toFixed(2),
        note: dto.note.trim(),
        date: dto.date ?? new Date(),
        saleId: null,
      },
    })

    return entry as unknown as CashFlowEntryRecord
  }
}
