import type Decimal from 'decimal.js'

export interface CashFlowEntryRecord {
  id: string
  type: 'INCOME' | 'EXPENSE'
  amount: Decimal
  note: string | null
  date: Date
  saleId: string | null
}

export interface CashFlowSummary {
  income: Decimal
  expense: Decimal
  balance: Decimal
}

export interface CreateManualEntryDTO {
  type: 'INCOME' | 'EXPENSE'
  amount: number
  note: string
  date?: Date
}
