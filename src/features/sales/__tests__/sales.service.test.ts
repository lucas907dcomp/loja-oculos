import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockTx = vi.hoisted(() => ({
  sale: {
    create: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
    findUniqueOrThrow: vi.fn(),
  },
  saleItem: {
    create: vi.fn().mockResolvedValue(undefined),
  },
  inventory: {
    findUniqueOrThrow: vi.fn(),
    update: vi.fn().mockResolvedValue(undefined),
  },
  inventoryTransaction: {
    create: vi.fn().mockResolvedValue(undefined),
  },
  cashFlowEntry: {
    create: vi.fn().mockResolvedValue(undefined),
  },
}))

const mockPrisma = vi.hoisted(() => ({
  productVariant: {
    findUniqueOrThrow: vi.fn(),
  },
  sale: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  $transaction: vi.fn().mockImplementation(async (cb: (tx: typeof mockTx) => unknown) => cb(mockTx)),
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { SalesService } from '../services/sales.service'

const makeVariant = (
  id: string,
  salePriceStr: string,
  costPriceStr: string,
  invId: string,
  invQty: number,
  productName = 'Product',
  sku = 'SKU-001',
) => ({
  id,
  sku,
  frameColor: 'Preto',
  lensColor: 'Cinza',
  salePrice: { toString: () => salePriceStr },
  costPrice: { toString: () => costPriceStr },
  product: { name: productName },
  inventory: { id: invId, quantity: invQty },
})

const makeSaleResult = (id: string, totalAmount: string) => ({
  id,
  totalAmount: { toString: () => totalAmount },
  paymentBreakdown: {},
  status: 'COMPLETED' as const,
  createdAt: new Date(),
  customerId: null,
  customer: null,
  items: [],
  cashFlowEntry: { id: 'cf-1', amount: { toString: () => totalAmount }, type: 'INCOME' },
})

describe('SalesService.createSale', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockTx.sale.update.mockResolvedValue(undefined)
    mockTx.saleItem.create.mockResolvedValue(undefined)
    mockTx.inventory.update.mockResolvedValue(undefined)
    mockTx.inventoryTransaction.create.mockResolvedValue(undefined)
    mockTx.cashFlowEntry.create.mockResolvedValue(undefined)
  })

  it('happy path — 1 item, Pix payment: $transaction called once; snapshots correct; all writes executed', async () => {
    const variant = makeVariant('var-1', '120.00', '50.00', 'inv-1', 5)
    mockPrisma.productVariant.findUniqueOrThrow.mockResolvedValue(variant)
    mockTx.sale.create.mockResolvedValue({ id: 'sale-1' })
    mockTx.sale.findUniqueOrThrow.mockResolvedValue(makeSaleResult('sale-1', '120.00'))

    await SalesService.createSale({
      items: [{ variantId: 'var-1', quantity: 1 }],
      paymentBreakdown: { pix: 120 },
    })

    expect(mockPrisma.$transaction).toHaveBeenCalledOnce()
    expect(mockTx.saleItem.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ unitPrice: '120.00', unitCost: '50.00', quantity: 1 }) }),
    )
    expect(mockTx.inventory.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quantity: { decrement: 1 } } }),
    )
    expect(mockTx.inventoryTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'SALE', quantityDelta: -1 }) }),
    )
    expect(mockTx.cashFlowEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'INCOME', saleId: 'sale-1' }) }),
    )
  })

  it('multi-item — 2 variants: both inventories decremented, both InventoryTransactions, CashFlowEntry = sum', async () => {
    const v1 = makeVariant('var-1', '120.00', '50.00', 'inv-1', 5, 'Product A', 'SKU-A')
    const v2 = makeVariant('var-2', '80.00', '30.00', 'inv-2', 3, 'Product B', 'SKU-B')
    mockPrisma.productVariant.findUniqueOrThrow
      .mockResolvedValueOnce(v1)
      .mockResolvedValueOnce(v2)
    mockTx.sale.create.mockResolvedValue({ id: 'sale-2' })
    mockTx.sale.findUniqueOrThrow.mockResolvedValue(makeSaleResult('sale-2', '320.00'))

    await SalesService.createSale({
      items: [
        { variantId: 'var-1', quantity: 2 },
        { variantId: 'var-2', quantity: 1 },
      ],
      paymentBreakdown: { pix: 320 },
    })

    expect(mockTx.inventory.update).toHaveBeenCalledTimes(2)
    expect(mockTx.inventoryTransaction.create).toHaveBeenCalledTimes(2)
    expect(mockTx.cashFlowEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ amount: '320.00' }) }),
    )
  })

  it('stock insufficient — throws before $transaction is opened', async () => {
    const variant = makeVariant('var-1', '120.00', '50.00', 'inv-1', 0)
    mockPrisma.productVariant.findUniqueOrThrow.mockResolvedValue(variant)

    await expect(
      SalesService.createSale({
        items: [{ variantId: 'var-1', quantity: 1 }],
        paymentBreakdown: { pix: 120 },
      }),
    ).rejects.toThrow('Estoque insuficiente')

    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('split payment (Pix + Cash) — sale created with correct paymentBreakdown', async () => {
    const variant = makeVariant('var-1', '100.00', '40.00', 'inv-1', 5)
    mockPrisma.productVariant.findUniqueOrThrow.mockResolvedValue(variant)
    mockTx.sale.create.mockResolvedValue({ id: 'sale-3' })
    mockTx.sale.findUniqueOrThrow.mockResolvedValue(makeSaleResult('sale-3', '100.00'))

    await SalesService.createSale({
      items: [{ variantId: 'var-1', quantity: 1 }],
      paymentBreakdown: { pix: 50, cash: 50 },
    })

    expect(mockTx.sale.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ paymentBreakdown: { pix: 50, cash: 50 } }),
      }),
    )
  })

  it('empty cart — throws Carrinho não pode estar vazio', async () => {
    await expect(
      SalesService.createSale({ items: [], paymentBreakdown: { pix: 0 } }),
    ).rejects.toThrow('Carrinho não pode estar vazio')
  })

  it('item quantity < 1 — throws Quantidade inválida', async () => {
    await expect(
      SalesService.createSale({
        items: [{ variantId: 'var-1', quantity: 0 }],
        paymentBreakdown: { pix: 0 },
      }),
    ).rejects.toThrow('Quantidade inválida')
  })

  it('payment mismatch — throws Total do pagamento não cobre', async () => {
    const variant = makeVariant('var-1', '120.00', '50.00', 'inv-1', 5)
    mockPrisma.productVariant.findUniqueOrThrow.mockResolvedValue(variant)

    await expect(
      SalesService.createSale({
        items: [{ variantId: 'var-1', quantity: 1 }],
        paymentBreakdown: { pix: 100 },
      }),
    ).rejects.toThrow('Total do pagamento não cobre o valor da venda')
  })
})

describe('SalesService.getSaleById', () => {
  beforeEach(() => vi.clearAllMocks())

  it('non-existent ID — throws Venda não encontrada', async () => {
    mockPrisma.sale.findUnique.mockResolvedValue(null)

    await expect(SalesService.getSaleById('nonexistent')).rejects.toThrow('Venda não encontrada')
  })
})

describe('SalesService.processReturn', () => {
  const makeSaleWithItems = (status: 'COMPLETED' | 'RETURNED' = 'COMPLETED') => ({
    id: 'sale-ret-1',
    totalAmount: { toString: () => '200.00' },
    paymentBreakdown: { pix: 200 },
    status,
    createdAt: new Date(),
    customerId: null,
    customer: null,
    cashFlowEntry: { id: 'cf-1', amount: { toString: () => '200.00' }, type: 'INCOME' },
    items: [
      {
        id: 'si-1',
        variantId: 'var-1',
        quantity: 2,
        unitPrice: { toString: () => '80.00' },
        unitCost: { toString: () => '30.00' },
        variant: { sku: 'SKU-A', frameColor: 'Preto', lensColor: 'Cinza', product: { name: 'Óculos X' } },
      },
      {
        id: 'si-2',
        variantId: 'var-2',
        quantity: 1,
        unitPrice: { toString: () => '40.00' },
        unitCost: { toString: () => '15.00' },
        variant: { sku: 'SKU-B', frameColor: 'Azul', lensColor: 'Preto', product: { name: 'Óculos Y' } },
      },
    ],
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockTx.sale.update.mockResolvedValue(undefined)
    mockTx.inventory.update.mockResolvedValue(undefined)
    mockTx.inventoryTransaction.create.mockResolvedValue(undefined)
    mockTx.cashFlowEntry.create.mockResolvedValue(undefined)
  })

  it('happy path — updates status, restores inventory, creates RETURN transactions and EXPENSE cashflow', async () => {
    const sale = makeSaleWithItems('COMPLETED')
    mockPrisma.sale.findUnique.mockResolvedValue(sale)
    mockTx.inventory.findUniqueOrThrow
      .mockResolvedValueOnce({ id: 'inv-1', variantId: 'var-1' })
      .mockResolvedValueOnce({ id: 'inv-2', variantId: 'var-2' })
    mockTx.sale.findUniqueOrThrow.mockResolvedValue({ ...sale, status: 'RETURNED' })

    await SalesService.processReturn('sale-ret-1')

    expect(mockPrisma.$transaction).toHaveBeenCalledOnce()
    expect(mockTx.sale.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { status: 'RETURNED' } }),
    )
    expect(mockTx.inventory.update).toHaveBeenCalledTimes(2)
    expect(mockTx.inventory.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quantity: { increment: 2 } } }),
    )
    expect(mockTx.inventory.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { quantity: { increment: 1 } } }),
    )
    expect(mockTx.inventoryTransaction.create).toHaveBeenCalledTimes(2)
    expect(mockTx.inventoryTransaction.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'RETURN', quantityDelta: 2 }) }),
    )
    expect(mockTx.cashFlowEntry.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ type: 'EXPENSE', amount: '200.00' }) }),
    )
  })

  it('non-existent saleId — throws Venda não encontrada', async () => {
    mockPrisma.sale.findUnique.mockResolvedValue(null)

    await expect(SalesService.processReturn('bad-id')).rejects.toThrow('Venda não encontrada')
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })

  it('already RETURNED — throws before $transaction opens', async () => {
    const sale = makeSaleWithItems('RETURNED')
    mockPrisma.sale.findUnique.mockResolvedValue(sale)

    await expect(SalesService.processReturn('sale-ret-1')).rejects.toThrow('Venda já foi devolvida')
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })
})

describe('SalesService.getSaleHistory', () => {
  beforeEach(() => vi.clearAllMocks())

  it('returns array ordered by createdAt DESC (mocked)', async () => {
    const now = new Date()
    const earlier = new Date(now.getTime() - 60000)
    mockPrisma.sale.findMany.mockResolvedValue([
      {
        id: 'sale-new',
        totalAmount: { toString: () => '200.00' },
        status: 'COMPLETED',
        createdAt: now,
        customer: { name: 'Alice' },
        _count: { items: 2 },
      },
      {
        id: 'sale-old',
        totalAmount: { toString: () => '100.00' },
        status: 'COMPLETED',
        createdAt: earlier,
        customer: null,
        _count: { items: 1 },
      },
    ])

    const result = await SalesService.getSaleHistory()

    expect(result).toHaveLength(2)
    expect(result[0].id).toBe('sale-new')
    expect(result[0].customerName).toBe('Alice')
    expect(result[0].itemCount).toBe(2)
    expect(result[1].id).toBe('sale-old')
    expect(result[1].customerName).toBeNull()
  })
})
