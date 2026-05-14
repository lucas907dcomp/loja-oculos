'use server'

import { revalidatePath } from 'next/cache'
import { CashFlowService } from './services/cashflow.service'
import type { CreateManualEntryDTO } from './cashflow.contract'

export interface CashFlowEntryDTO {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: string
  note: string | null
  date: string
  saleId: string | null
}

export interface CashFlowSummaryDTO {
  income: string
  expense: string
  balance: string
}

export async function getCashFlowEntriesAction(filters?: {
  from?: Date
  to?: Date
  type?: 'INCOME' | 'EXPENSE'
}): Promise<{ success: true; entries: CashFlowEntryDTO[] } | { success: false; error: string }> {
  try {
    const entries = await CashFlowService.getEntries(filters)
    return {
      success: true,
      entries: entries.map((e) => ({
        id: e.id,
        type: e.type,
        amount: e.amount.toString(),
        note: e.note,
        date: e.date.toISOString(),
        saleId: e.saleId,
      })),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao carregar lançamentos',
    }
  }
}

export async function getMonthlySummaryAction(
  year: number,
  month: number,
): Promise<{ success: true; summary: CashFlowSummaryDTO } | { success: false; error: string }> {
  try {
    const summary = await CashFlowService.getMonthlySummary(year, month)
    return {
      success: true,
      summary: {
        income: summary.income.toString(),
        expense: summary.expense.toString(),
        balance: summary.balance.toString(),
      },
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao calcular resumo',
    }
  }
}

export async function createManualEntryAction(
  dto: CreateManualEntryDTO,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    await CashFlowService.createManualEntry(dto)
    revalidatePath('/financeiro')
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro ao criar lançamento',
    }
  }
}
