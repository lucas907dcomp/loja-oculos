import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockTx = vi.hoisted(() => ({
  inventory: { update: vi.fn().mockResolvedValue(undefined) },
  inventoryTransaction: { create: vi.fn().mockResolvedValue(undefined) },
}))

const mockPrisma = vi.hoisted(() => ({
  inventory: {
    findUniqueOrThrow: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
  },
  productVariant: {
    findMany: vi.fn(),
  },
  $transaction: vi.fn().mockImplementation(async (cb: (tx: typeof mockTx) => Promise<void>) =>
    cb(mockTx)
  ),
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { InventoryService } from '../services/inventory.service'

describe('InventoryService.adjustStock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTx.inventory.update.mockResolvedValue(undefined)
    mockTx.inventoryTransaction.create.mockResolvedValue(undefined)
  })

  it('PURCHASE: increments quantity and creates InventoryTransaction with correct data', async () => {
    mockPrisma.inventory.findUniqueOrThrow.mockResolvedValue({
      id: 'inv-1',
      quantity: 5,
      minStockAlert: 3,
      variantId: 'var-1',
    })

    await InventoryService.adjustStock('var-1', { type: 'PURCHASE', quantity: 10 })

    expect(mockPrisma.$transaction).toHaveBeenCalledOnce()
    expect(mockTx.inventory.update).toHaveBeenCalledWith({
      where: { id: 'inv-1' },
      data: { quantity: 15 },
    })
    expect(mockTx.inventoryTransaction.create).toHaveBeenCalledWith({
      data: {
        inventoryId: 'inv-1',
        type: 'PURCHASE',
        quantityDelta: 10,
        note: null,
      },
    })
  })

  it('ADJUSTMENT positive (+): increments quantity', async () => {
    mockPrisma.inventory.findUniqueOrThrow.mockResolvedValue({
      id: 'inv-2',
      quantity: 3,
      minStockAlert: 2,
      variantId: 'var-2',
    })

    await InventoryService.adjustStock('var-2', { type: 'ADJUSTMENT', quantity: 4, sign: '+' })

    expect(mockTx.inventory.update).toHaveBeenCalledWith({
      where: { id: 'inv-2' },
      data: { quantity: 7 },
    })
    expect(mockTx.inventoryTransaction.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ type: 'ADJUSTMENT', quantityDelta: 4 }),
    })
  })

  it('ADJUSTMENT negative that results in quantity < 0: throws Estoque insuficiente', async () => {
    mockPrisma.inventory.findUniqueOrThrow.mockResolvedValue({
      id: 'inv-3',
      quantity: 2,
      minStockAlert: 1,
      variantId: 'var-3',
    })

    await expect(
      InventoryService.adjustStock('var-3', { type: 'ADJUSTMENT', quantity: 3, sign: '-' })
    ).rejects.toThrow('Estoque insuficiente')

    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('ADJUSTMENT negative exactly to zero: succeeds', async () => {
    mockPrisma.inventory.findUniqueOrThrow.mockResolvedValue({
      id: 'inv-4',
      quantity: 5,
      minStockAlert: 2,
      variantId: 'var-4',
    })

    await InventoryService.adjustStock('var-4', { type: 'ADJUSTMENT', quantity: 5, sign: '-' })

    expect(mockTx.inventory.update).toHaveBeenCalledWith({
      where: { id: 'inv-4' },
      data: { quantity: 0 },
    })
  })
})

describe('InventoryService.getLowStockAlerts', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns variant where quantity <= minStockAlert; excludes variant where quantity > minStockAlert', async () => {
    mockPrisma.inventory.findMany.mockResolvedValue([
      {
        variantId: 'var-low',
        quantity: 2,
        minStockAlert: 3,
        variant: {
          sku: 'SKU-LOW',
          product: { name: 'Product A', isArchived: false },
        },
      },
      {
        variantId: 'var-ok',
        quantity: 10,
        minStockAlert: 3,
        variant: {
          sku: 'SKU-OK',
          product: { name: 'Product B', isArchived: false },
        },
      },
      {
        variantId: 'var-zero',
        quantity: 0,
        minStockAlert: 3,
        variant: {
          sku: 'SKU-ZERO',
          product: { name: 'Product C', isArchived: false },
        },
      },
    ])

    const alerts = await InventoryService.getLowStockAlerts()

    expect(alerts).toHaveLength(2)
    expect(alerts.map((a) => a.variantId)).toEqual(
      expect.arrayContaining(['var-low', 'var-zero'])
    )
    expect(alerts.map((a) => a.variantId)).not.toContain('var-ok')
  })
})

describe('InventoryService.getZeroStockVariants', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns only variants with quantity === 0', async () => {
    mockPrisma.productVariant.findMany.mockResolvedValue([
      {
        id: 'var-zero',
        sku: 'SKU-ZERO',
        frameColor: 'Preto',
        lensColor: 'Cinza',
        product: { name: 'Product Zero' },
        inventory: { id: 'inv-z', quantity: 0, minStockAlert: 3 },
      },
      {
        id: 'var-some',
        sku: 'SKU-SOME',
        frameColor: 'Branco',
        lensColor: 'Azul',
        product: { name: 'Product Some' },
        inventory: { id: 'inv-s', quantity: 5, minStockAlert: 2 },
      },
    ])

    const zero = await InventoryService.getZeroStockVariants()

    expect(zero).toHaveLength(1)
    expect(zero[0].variantId).toBe('var-zero')
    expect(zero[0].quantity).toBe(0)
  })
})

describe('InventoryService.updateMinStockAlert', () => {
  beforeEach(() => vi.clearAllMocks())

  it('negative value: throws error', async () => {
    await expect(InventoryService.updateMinStockAlert('var-1', -1)).rejects.toThrow()
  })

  it('zero value: succeeds and calls prisma.inventory.update', async () => {
    await InventoryService.updateMinStockAlert('var-1', 0)

    expect(mockPrisma.inventory.update).toHaveBeenCalledWith({
      where: { variantId: 'var-1' },
      data: { minStockAlert: 0 },
    })
  })
})
