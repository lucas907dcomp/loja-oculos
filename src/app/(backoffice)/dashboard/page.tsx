import { AnalyticsService } from '@/features/analytics'
import type { DashboardData } from '@/features/analytics/actions'
import { DashboardClient } from './dashboard-client'

export default async function DashboardPage() {
  const now = new Date()
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  let data: DashboardData

  try {
    const [summary, topByMargin, topByTurnover, criticalStockouts, deadStock] = await Promise.all([
      AnalyticsService.getPeriodSummary(thirtyDaysAgo, now),
      AnalyticsService.getTopByMargin(10),
      AnalyticsService.getTopByTurnover(28, 10),
      AnalyticsService.getCriticalStockouts(7, 28),
      AnalyticsService.getDeadStock(60),
    ])
    data = { summary, topByMargin, topByTurnover, criticalStockouts, deadStock }
  } catch {
    return (
      <div className="flex h-64 flex-col items-center justify-center gap-3">
        <p className="font-medium text-destructive">Erro ao carregar o dashboard.</p>
        <p className="text-sm text-muted-foreground">Verifique a conexão e recarregue a página.</p>
      </div>
    )
  }

  return <DashboardClient data={data} />
}
