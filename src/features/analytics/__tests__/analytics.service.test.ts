import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  saleItem: { findMany: vi.fn() },
  inventory: { findMany: vi.fn() },
  productVariant: { findMany: vi.fn() },
  sale: { findMany: vi.fn() },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { AnalyticsService } from '../services/analytics.service'

const makeVariant = (id: string, sku = 'SKU-A', salePrice = 200, costPrice = 100) => ({
  id,
  sku,
  frameColor: 'black',
  lensColor: 'gray',
  salePrice,
  costPrice,
  product: { name: 'Óculos Test', brand: 'Brand X', isArchived: false },
})

const makeSaleItem = (variantId: string, quantity: number) => ({
  id: `si-${variantId}-${quantity}`,
  variantId,
  quantity,
  unitPrice: 200,
  unitCost: 100,
  createdAt: new Date(),
  variant: makeVariant(variantId),
})

describe('AnalyticsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('getSalesVelocity — correct unitsPerWeek (14 units in 28 days = 3.5/week)', async () => {
    mockPrisma.saleItem.findMany.mockResolvedValue([
      makeSaleItem('v1', 7),
      makeSaleItem('v1', 7),
    ])
    const result = await AnalyticsService.getSalesVelocity(28)
    expect(result).toHaveLength(1)
    expect(result[0].variantId).toBe('v1')
    expect(result[0].unitsSold).toBe(14)
    expect(result[0].unitsPerWeek).toBe(3.5)
    expect(result[0].weeksCovered).toBe(4)
  })

  it('getSalesVelocity — returns empty array when no SaleItems in window', async () => {
    mockPrisma.saleItem.findMany.mockResolvedValue([])
    const result = await AnalyticsService.getSalesVelocity(28)
    expect(result).toEqual([])
  })

  it('getTopByMargin — correct marginPercent formula, sorted DESC, respects limit', async () => {
    mockPrisma.productVariant.findMany.mockResolvedValue([
      makeVariant('v1', 'SKU-1', 200, 50),   // (200-50)/200*100 = 75%
      makeVariant('v2', 'SKU-2', 100, 60),   // (100-60)/100*100 = 40%
      makeVariant('v3', 'SKU-3', 150, 130),  // (150-130)/150*100 ≈ 13.3%
    ])
    const result = await AnalyticsService.getTopByMargin(2)
    expect(result).toHaveLength(2)
    expect(result[0].variantId).toBe('v1')
    expect(result[0].marginPercent).toBeCloseTo(75)
    expect(result[1].variantId).toBe('v2')
    expect(result[1].marginPercent).toBeCloseTo(40)
  })

  it('getDeadStock — returns only variants with no recent completed sales', async () => {
    mockPrisma.productVariant.findMany.mockResolvedValue([
      { ...makeVariant('v1'), inventory: { quantity: 5 }, saleItems: [] },
      { ...makeVariant('v2'), inventory: { quantity: 3 }, saleItems: [{ id: 'si1' }] },
    ])
    const result = await AnalyticsService.getDeadStock(60)
    expect(result).toHaveLength(1)
    expect(result[0].variantId).toBe('v1')
    expect(result[0].currentStock).toBe(5)
  })

  it('getPeriodSummary — correct totalRevenue, totalSales, averageTicket, averageMarginPercent', async () => {
    mockPrisma.sale.findMany.mockResolvedValue([
      {
        id: 's1',
        totalAmount: 300,
        status: 'COMPLETED',
        items: [
          { unitPrice: 200, unitCost: 100, quantity: 1 }, // margin = 50%
          { unitPrice: 100, unitCost: 40, quantity: 1 },  // margin = 60%
        ],
      },
      {
        id: 's2',
        totalAmount: 200,
        status: 'COMPLETED',
        items: [
          { unitPrice: 200, unitCost: 80, quantity: 1 }, // margin = 60%
        ],
      },
    ])
    const result = await AnalyticsService.getPeriodSummary(
      new Date('2026-01-01'),
      new Date('2026-01-31'),
    )
    expect(result.totalRevenue).toBe(500)
    expect(result.totalSales).toBe(2)
    expect(result.averageTicket).toBe(250)
    expect(result.averageMarginPercent).toBeCloseTo((50 + 60 + 60) / 3)
  })

  it('getPeriodSummary — returns all zeros when no sales in period', async () => {
    mockPrisma.sale.findMany.mockResolvedValue([])
    // empty period — no sales
    const result = await AnalyticsService.getPeriodSummary(
      new Date('2026-01-01'),
      new Date('2026-01-31'),
    )
    expect(result.totalRevenue).toBe(0)
    expect(result.totalSales).toBe(0)
    expect(result.averageTicket).toBe(0)
    expect(result.averageMarginPercent).toBe(0)
  })

  it('getCriticalStockouts — returns critical variants, excludes zero-velocity and non-critical', async () => {
    // v1: 14 units in 28d = 3.5/week; stock=2 → floor(2/3.5*7)=4d → CRITICAL
    // v2: 0 velocity (no sales) → null → NOT critical
    // v3: 2 units in 28d = 0.5/week; stock=30 → floor(30/0.5*7)=420d → NOT critical
    mockPrisma.saleItem.findMany.mockResolvedValue([
      makeSaleItem('v1', 14),
      makeSaleItem('v3', 2),
    ])
    mockPrisma.inventory.findMany.mockResolvedValue([
      { variantId: 'v1', quantity: 2, variant: makeVariant('v1') },
      { variantId: 'v2', quantity: 100, variant: makeVariant('v2') },
      { variantId: 'v3', quantity: 30, variant: makeVariant('v3') },
    ])
    const result = await AnalyticsService.getCriticalStockouts(7, 28)
    expect(result).toHaveLength(1)
    expect(result[0].variantId).toBe('v1')
    expect(result[0].daysUntilStockout).toBe(4)
    expect(result[0].isCritical).toBe(true)
  })
})
