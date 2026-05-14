import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockPrisma = vi.hoisted(() => ({
  customer: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
  },
}))

vi.mock('@/lib/prisma', () => ({ prisma: mockPrisma }))

import { CustomerService } from '../services/customer.service'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('CustomerService.getCustomers', () => {
  it('returns all customers sorted by name when no search provided', async () => {
    const mockCustomers = [
      { id: '1', name: 'Ana', phone: null, email: null, tags: [], createdAt: new Date(), _count: { sales: 3 } },
      { id: '2', name: 'Carlos', phone: '11999', email: null, tags: ['esportivo'], createdAt: new Date(), _count: { sales: 1 } },
    ]
    mockPrisma.customer.findMany.mockResolvedValue(mockCustomers)

    const result = await CustomerService.getCustomers()

    expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: undefined, orderBy: { name: 'asc' } }),
    )
    expect(result).toHaveLength(2)
    expect(result[0].saleCount).toBe(3)
    expect(result[1].saleCount).toBe(1)
  })

  it('filters customers when search is provided', async () => {
    mockPrisma.customer.findMany.mockResolvedValue([])

    await CustomerService.getCustomers('ana')

    expect(mockPrisma.customer.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { name: { contains: 'ana', mode: 'insensitive' } },
            { phone: { contains: 'ana', mode: 'insensitive' } },
            { email: { contains: 'ana', mode: 'insensitive' } },
          ],
        },
      }),
    )
  })
})

describe('CustomerService.createCustomer', () => {
  it('creates customer with empty tags as default', async () => {
    const fakeCustomer = { id: 'cust-1', name: 'Ana Silva', phone: null, email: null, tags: [], createdAt: new Date(), updatedAt: new Date() }
    mockPrisma.customer.create.mockResolvedValue(fakeCustomer)

    const result = await CustomerService.createCustomer({ name: 'Ana Silva' })

    expect(mockPrisma.customer.create).toHaveBeenCalledOnce()
    expect(mockPrisma.customer.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ name: 'Ana Silva', tags: [] }),
    })
    expect(result.id).toBe('cust-1')
  })

  it('throws and does not call Prisma when name is empty', async () => {
    await expect(
      CustomerService.createCustomer({ name: '   ' }),
    ).rejects.toThrow('Nome obrigatório')

    expect(mockPrisma.customer.create).not.toHaveBeenCalled()
  })
})

describe('CustomerService.updateCustomer', () => {
  it('throws and does not call update when customer not found', async () => {
    mockPrisma.customer.findUnique.mockResolvedValue(null)

    await expect(
      CustomerService.updateCustomer('nonexistent', { name: 'Novo Nome' }),
    ).rejects.toThrow('Cliente não encontrado')

    expect(mockPrisma.customer.update).not.toHaveBeenCalled()
  })
})
