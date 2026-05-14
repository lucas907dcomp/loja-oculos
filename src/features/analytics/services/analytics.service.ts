import { prisma } from '@/lib/prisma'
import type {
  SalesVelocityRecord,
  StockoutForecast,
  DeadStockRecord,
  TopMarginRecord,
  TopTurnoverRecord,
  PeriodSummary,
} from '../analytics.contract'

export class AnalyticsService {
  static async getSalesVelocity(lookbackDays = 28): Promise<SalesVelocityRecord[]> {
    const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000)
    const items = await prisma.saleItem.findMany({
      where: {
        sale: { status: 'COMPLETED' },
        createdAt: { gte: since },
      },
      include: {
        variant: { include: { product: true } },
      },
    })

    const map = new Map<string, { variant: (typeof items)[0]['variant']; unitsSold: number }>()
    for (const item of items) {
      const entry = map.get(item.variantId)
      if (entry) {
        entry.unitsSold += item.quantity
      } else {
        map.set(item.variantId, { variant: item.variant, unitsSold: item.quantity })
      }
    }

    const weeks = lookbackDays / 7
    return Array.from(map.values()).map(({ variant, unitsSold }) => ({
      variantId: variant.id,
      productName: variant.product.name,
      brand: variant.product.brand,
      sku: variant.sku,
      frameColor: variant.frameColor,
      lensColor: variant.lensColor,
      unitsSold,
      weeksCovered: weeks,
      unitsPerWeek: unitsSold / weeks,
    }))
  }

  static async getCriticalStockouts(threshold = 7, lookbackDays = 28): Promise<StockoutForecast[]> {
    const velocityRecords = await AnalyticsService.getSalesVelocity(lookbackDays)
    const velocityMap = new Map(velocityRecords.map((r) => [r.variantId, r]))

    const inventories = await prisma.inventory.findMany({
      where: { variant: { product: { isArchived: false } } },
      include: { variant: { include: { product: true } } },
    })

    const forecasts: StockoutForecast[] = []
    for (const inv of inventories) {
      const velocity = velocityMap.get(inv.variantId)
      const unitsPerWeek = velocity?.unitsPerWeek ?? 0

      const daysUntilStockout =
        unitsPerWeek > 0 ? Math.floor((inv.quantity / unitsPerWeek) * 7) : null

      const isCritical = daysUntilStockout !== null && daysUntilStockout < threshold
      if (!isCritical) continue

      forecasts.push({
        variantId: inv.variantId,
        productName: inv.variant.product.name,
        brand: inv.variant.product.brand,
        sku: inv.variant.sku,
        frameColor: inv.variant.frameColor,
        lensColor: inv.variant.lensColor,
        unitsSold: velocity?.unitsSold ?? 0,
        weeksCovered: velocity?.weeksCovered ?? lookbackDays / 7,
        unitsPerWeek,
        currentStock: inv.quantity,
        daysUntilStockout,
        isCritical,
      })
    }

    return forecasts.sort((a, b) => (a.daysUntilStockout ?? 0) - (b.daysUntilStockout ?? 0))
  }

  static async getDeadStock(daysSinceLastSale = 60): Promise<DeadStockRecord[]> {
    const cutoff = new Date(Date.now() - daysSinceLastSale * 24 * 60 * 60 * 1000)
    const variants = await prisma.productVariant.findMany({
      where: { product: { isArchived: false } },
      include: {
        product: true,
        inventory: true,
        saleItems: {
          where: {
            sale: { status: 'COMPLETED' },
            createdAt: { gte: cutoff },
          },
          select: { id: true },
        },
      },
    })

    return variants
      .filter((v) => v.saleItems.length === 0)
      .map((v) => ({
        variantId: v.id,
        productName: v.product.name,
        brand: v.product.brand,
        sku: v.sku,
        frameColor: v.frameColor,
        lensColor: v.lensColor,
        currentStock: v.inventory?.quantity ?? 0,
      }))
  }

  static async getTopByMargin(limit = 10): Promise<TopMarginRecord[]> {
    const variants = await prisma.productVariant.findMany({
      where: { product: { isArchived: false } },
      include: { product: true },
    })

    return variants
      .map((v) => {
        const sp = Number(v.salePrice)
        const cp = Number(v.costPrice)
        const marginPercent = sp > 0 ? ((sp - cp) / sp) * 100 : 0
        return {
          variantId: v.id,
          productName: v.product.name,
          brand: v.product.brand,
          sku: v.sku,
          frameColor: v.frameColor,
          lensColor: v.lensColor,
          salePrice: sp,
          costPrice: cp,
          marginPercent,
        }
      })
      .sort((a, b) => b.marginPercent - a.marginPercent)
      .slice(0, limit)
  }

  static async getTopByTurnover(lookbackDays = 28, limit = 10): Promise<TopTurnoverRecord[]> {
    const records = await AnalyticsService.getSalesVelocity(lookbackDays)
    return records
      .sort((a, b) => b.unitsPerWeek - a.unitsPerWeek)
      .slice(0, limit)
      .map((r) => ({
        variantId: r.variantId,
        productName: r.productName,
        brand: r.brand,
        sku: r.sku,
        frameColor: r.frameColor,
        lensColor: r.lensColor,
        unitsPerWeek: r.unitsPerWeek,
        unitsSold: r.unitsSold,
      }))
  }

  static async getPeriodSummary(from: Date, to: Date): Promise<PeriodSummary> {
    const sales = await prisma.sale.findMany({
      where: {
        status: 'COMPLETED',
        createdAt: { gte: from, lte: to },
      },
      include: {
        items: { select: { unitPrice: true, unitCost: true, quantity: true } },
      },
    })

    const totalRevenue = sales.reduce((sum, s) => sum + Number(s.totalAmount), 0)
    const totalSales = sales.length
    const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0

    const allItems = sales.flatMap((s) => s.items)
    const marginSum = allItems.reduce((sum, item) => {
      const price = Number(item.unitPrice)
      const cost = Number(item.unitCost)
      const margin = price > 0 ? ((price - cost) / price) * 100 : 0
      return sum + margin
    }, 0)
    const averageMarginPercent = allItems.length > 0 ? marginSum / allItems.length : 0

    return {
      totalRevenue,
      totalSales,
      averageTicket,
      averageMarginPercent,
      from: from.toISOString(),
      to: to.toISOString(),
    }
  }
}
