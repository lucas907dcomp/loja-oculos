import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  supplier: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
  purchaseOrder: {
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { SupplierService } from '../services/supplier.service'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('SupplierService.getSuppliers', () => {
  it('returns all suppliers sorted by name with productCount from _count', async () => {
    const mockSuppliers = [
      {
        id: 's1', name: 'Acme', cnpj: '12.345.678/0001-90', contactName: 'João',
        phone: null, email: null, leadTimeDays: 7, createdAt: new Date(),
        _count: { products: 5 },
      },
      {
        id: 's2', name: 'Beta', cnpj: null, contactName: null,
        phone: '11999990000', email: 'beta@ex.com', leadTimeDays: 14, createdAt: new Date(),
        _count: { products: 2 },
      },
    ]
    mockPrisma.supplier.findMany.mockResolvedValue(mockSuppliers)

    const result = await SupplierService.getSuppliers()

    expect(mockPrisma.supplier.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined, orderBy: { name: 'asc' } }),
    )
    expect(result).toHaveLength(2)
    expect(result[0].productCount).toBe(5)
    expect(result[1].productCount).toBe(2)
  })

  it('filters suppliers when search is provided', async () => {
    mockPrisma.supplier.findMany.mockResolvedValue([])

    await SupplierService.getSuppliers('acme')

    expect(mockPrisma.supplier.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: 'acme', mode: 'insensitive' } },
            { cnpj: { contains: 'acme', mode: 'insensitive' } },
            { contactName: { contains: 'acme', mode: 'insensitive' } },
          ],
        },
      }),
    )
  })
})

describe('SupplierService.createSupplier', () => {
  it('creates supplier with default leadTimeDays of 7', async () => {
    const fakeSupplier = {
      id: 'sup-1', name: 'Fornecedor X', cnpj: null, contactName: null,
      phone: null, email: null, leadTimeDays: 7, createdAt: new Date(), updatedAt: new Date(),
    }
    mockPrisma.supplier.create.mockResolvedValue(fakeSupplier)

    const result = await SupplierService.createSupplier({ name: 'Fornecedor X' })

    expect(mockPrisma.supplier.create).toHaveBeenCalledOnce()
    expect(mockPrisma.supplier.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'Fornecedor X', leadTimeDays: 7 }),
    })
    expect(result.id).toBe('sup-1')
  })

  it('throws and does not call Prisma when name is empty', async () => {
    await expect(
      SupplierService.createSupplier({ name: '   ' }),
    ).rejects.toThrow('Nome obrigatório')

    expect(mockPrisma.supplier.create).not.toHaveBeenCalled()
  })
})

describe('SupplierService.updateSupplier', () => {
  it('throws and does not call update when supplier not found', async () => {
    mockPrisma.supplier.findUnique.mockResolvedValue(null)

    await expect(
      SupplierService.updateSupplier('nonexistent', { name: 'Novo Nome' }),
    ).rejects.toThrow('Fornecedor não encontrado')

    expect(mockPrisma.supplier.update).not.toHaveBeenCalled()
  })
})

describe('SupplierService.createPurchaseOrder', () => {
  it('throws and does not call Prisma when supplier not found', async () => {
    mockPrisma.supplier.findUnique.mockResolvedValue(null)

    await expect(
      SupplierService.createPurchaseOrder('nonexistent', { notes: 'teste' }),
    ).rejects.toThrow('Fornecedor não encontrado')

    expect(mockPrisma.purchaseOrder.create).not.toHaveBeenCalled()
  })
})

describe('SupplierService.updatePurchaseOrderStatus', () => {
  it('sets deliveredAt when status is DELIVERED and clears it when REQUESTED', async () => {
    const fakePO = {
      id: 'po-1', supplierId: 's1', status: 'REQUESTED', notes: null,
      deliveredAt: null, createdAt: new Date(), updatedAt: new Date(),
    }
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue(fakePO)
    mockPrisma.purchaseOrder.update.mockResolvedValue({ ...fakePO, status: 'DELIVERED', deliveredAt: new Date() })

    await SupplierService.updatePurchaseOrderStatus('po-1', 'DELIVERED')

    expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'DELIVERED', deliveredAt: expect.any(Date) }),
      }),
    )

    vi.clearAllMocks()
    mockPrisma.purchaseOrder.findUnique.mockResolvedValue({ ...fakePO, status: 'DELIVERED' })
    mockPrisma.purchaseOrder.update.mockResolvedValue({ ...fakePO, status: 'REQUESTED', deliveredAt: null })

    await SupplierService.updatePurchaseOrderStatus('po-1', 'REQUESTED')

    expect(mockPrisma.purchaseOrder.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: 'REQUESTED', deliveredAt: null }),
      }),
    )
  })
})
