'use server'

import { AnalyticsService } from './services/analytics.service'
import type {
  PeriodSummary,
  TopMarginRecord,
  TopTurnoverRecord,
  StockoutForecast,
  DeadStockRecord,
} from './analytics.contract'

export interface DashboardData {
  summary: PeriodSummary
  topByMargin: TopMarginRecord[]
  topByTurnover: TopTurnoverRecord[]
  criticalStockouts: StockoutForecast[]
  deadStock: DeadStockRecord[]
}

export async function getAnalyticsDashboardAction(): Promise<
  { success: true; data: DashboardData } | { success: false; error: string }
> {
  try {
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    const [summary, topByMargin, topByTurnover, criticalStockouts, deadStock] = await Promise.all([
      AnalyticsService.getPeriodSummary(thirtyDaysAgo, now),
      AnalyticsService.getTopByMargin(10),
      AnalyticsService.getTopByTurnover(28, 10),
      AnalyticsService.getCriticalStockouts(7, 28),
      AnalyticsService.getDeadStock(60),
    ])

    return {
      success: true,
      data: { summary, topByMargin, topByTurnover, criticalStockouts, deadStock },
    }
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' }
  }
}
