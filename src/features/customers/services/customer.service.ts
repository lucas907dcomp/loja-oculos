import { prisma } from '@/lib/prisma'
import type {
  CustomerRecord,
  CustomerSummary,
  CustomerWithSales,
  CreateCustomerDTO,
  UpdateCustomerDTO,
} from '../customer.contract'

export class CustomerService {
  static async getCustomers(search?: string): Promise<CustomerSummary[]> {
    const customers = await prisma.customer.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { phone: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        _count: { select: { sales: true } },
      },
      orderBy: { name: 'asc' },
    })

    return customers.map((c) => ({
      id: c.id,
      name: c.name,
      phone: c.phone,
      email: c.email,
      tags: c.tags,
      saleCount: c._count.sales,
      createdAt: c.createdAt,
    }))
  }

  static async getCustomerById(id: string): Promise<CustomerWithSales> {
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        sales: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            totalAmount: true,
            status: true,
            createdAt: true,
            _count: { select: { items: true } },
          },
        },
      },
    })

    if (!customer) throw new Error('Cliente não encontrado')

    return {
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      tags: customer.tags,
      createdAt: customer.createdAt,
      updatedAt: customer.updatedAt,
      sales: customer.sales.map((s) => ({
        id: s.id,
        totalAmount: s.totalAmount.toString(),
        status: s.status,
        itemCount: s._count.items,
        createdAt: s.createdAt,
      })),
    }
  }

  static async createCustomer(dto: CreateCustomerDTO): Promise<CustomerRecord> {
    if (!dto.name?.trim()) throw new Error('Nome obrigatório')

    return prisma.customer.create({
      data: {
        name: dto.name.trim(),
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim() || null,
        tags: dto.tags ?? [],
      },
    })
  }

  static async updateCustomer(id: string, dto: UpdateCustomerDTO): Promise<CustomerRecord> {
    const existing = await prisma.customer.findUnique({ where: { id } })
    if (!existing) throw new Error('Cliente não encontrado')

    return prisma.customer.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
        ...(dto.email !== undefined ? { email: dto.email.trim() || null } : {}),
        ...(dto.tags !== undefined ? { tags: dto.tags } : {}),
      },
    })
  }

  static async searchCustomers(q: string): Promise<{ id: string; name: string; phone: string | null }[]> {
    const customers = await prisma.customer.findMany({
      where: {
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { phone: { contains: q, mode: 'insensitive' } },
        ],
      },
      select: { id: true, name: true, phone: true },
      orderBy: { name: 'asc' },
      take: 10,
    })

    return customers
  }
}
