import { CashFlowService } from '@/features/cashflow'
import type { CashFlowEntryDTO, CashFlowSummaryDTO } from '@/features/cashflow/actions'
import { FinanceiroClient } from './financeiro-client'

export default async function FinanceiroPage() {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  let entries: CashFlowEntryDTO[]
  let summary: CashFlowSummaryDTO

  try {
    const [rawEntries, rawSummary] = await Promise.all([
      CashFlowService.getEntries({ from: new Date(year, month - 1, 1) }),
      CashFlowService.getMonthlySummary(year, month),
    ])

    entries = rawEntries.map((e) => ({
      id: e.id,
      type: e.type,
      amount: e.amount.toString(),
      note: e.note,
      date: e.date.toISOString(),
      saleId: e.saleId,
    }))

    summary = {
      income: rawSummary.income.toString(),
      expense: rawSummary.expense.toString(),
      balance: rawSummary.balance.toString(),
    }
  } catch {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-destructive font-medium">Erro ao carregar fluxo de caixa.</p>
        <p className="text-muted-foreground text-sm">Verifique a conexão e recarregue a página.</p>
      </div>
    )
  }

  return <FinanceiroClient entries={entries} summary={summary} year={year} month={month} />
}
