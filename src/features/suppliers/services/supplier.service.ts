import { prisma } from '@/lib/prisma'
import type {
  SupplierRecord,
  SupplierSummary,
  SupplierWithDetails,
  CreateSupplierDTO,
  UpdateSupplierDTO,
  CreatePurchaseOrderDTO,
  PurchaseOrderRecord,
} from '../supplier.contract'

export class SupplierService {
  static async getSuppliers(search?: string): Promise<SupplierSummary[]> {
    const suppliers = await prisma.supplier.findMany({
      where: search
        ? {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { cnpj: { contains: search, mode: 'insensitive' } },
              { contactName: { contains: search, mode: 'insensitive' } },
            ],
          }
        : undefined,
      include: {
        _count: { select: { products: true } },
      },
      orderBy: { name: 'asc' },
    })

    return suppliers.map((s) => ({
      id: s.id,
      name: s.name,
      cnpj: s.cnpj,
      contactName: s.contactName,
      phone: s.phone,
      email: s.email,
      leadTimeDays: s.leadTimeDays,
      productCount: s._count.products,
      createdAt: s.createdAt,
    }))
  }

  static async getSupplierById(id: string): Promise<SupplierWithDetails> {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: {
        products: {
          where: { isArchived: false },
          select: {
            id: true,
            name: true,
            brand: true,
            _count: { select: { variants: true } },
          },
          orderBy: { name: 'asc' },
        },
        purchaseOrders: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!supplier) throw new Error('Fornecedor não encontrado')

    return {
      id: supplier.id,
      name: supplier.name,
      cnpj: supplier.cnpj,
      contactName: supplier.contactName,
      phone: supplier.phone,
      email: supplier.email,
      leadTimeDays: supplier.leadTimeDays,
      createdAt: supplier.createdAt,
      updatedAt: supplier.updatedAt,
      products: supplier.products.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.brand,
        variantCount: p._count.variants,
      })),
      purchaseOrders: supplier.purchaseOrders.map((po) => ({
        id: po.id,
        supplierId: po.supplierId,
        status: po.status,
        notes: po.notes,
        deliveredAt: po.deliveredAt,
        createdAt: po.createdAt,
      })),
    }
  }

  static async createSupplier(dto: CreateSupplierDTO): Promise<SupplierRecord> {
    if (!dto.name?.trim()) throw new Error('Nome obrigatório')

    return prisma.supplier.create({
      data: {
        name: dto.name.trim(),
        cnpj: dto.cnpj?.trim() || null,
        contactName: dto.contactName?.trim() || null,
        phone: dto.phone?.trim() || null,
        email: dto.email?.trim() || null,
        leadTimeDays: dto.leadTimeDays ?? 7,
      },
    })
  }

  static async updateSupplier(id: string, dto: UpdateSupplierDTO): Promise<SupplierRecord> {
    const existing = await prisma.supplier.findUnique({ where: { id } })
    if (!existing) throw new Error('Fornecedor não encontrado')

    return prisma.supplier.update({
      where: { id },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.cnpj !== undefined ? { cnpj: dto.cnpj.trim() || null } : {}),
        ...(dto.contactName !== undefined ? { contactName: dto.contactName.trim() || null } : {}),
        ...(dto.phone !== undefined ? { phone: dto.phone.trim() || null } : {}),
        ...(dto.email !== undefined ? { email: dto.email.trim() || null } : {}),
        ...(dto.leadTimeDays !== undefined ? { leadTimeDays: dto.leadTimeDays } : {}),
      },
    })
  }

  static async createPurchaseOrder(supplierId: string, dto: CreatePurchaseOrderDTO): Promise<PurchaseOrderRecord> {
    const existing = await prisma.supplier.findUnique({ where: { id: supplierId } })
    if (!existing) throw new Error('Fornecedor não encontrado')

    return prisma.purchaseOrder.create({
      data: {
        supplierId,
        notes: dto.notes?.trim() || null,
        status: 'REQUESTED',
      },
    })
  }

  static async updatePurchaseOrderStatus(id: string, status: 'REQUESTED' | 'DELIVERED'): Promise<PurchaseOrderRecord> {
    const existing = await prisma.purchaseOrder.findUnique({ where: { id } })
    if (!existing) throw new Error('Pedido não encontrado')

    return prisma.purchaseOrder.update({
      where: { id },
      data: {
        status,
        deliveredAt: status === 'DELIVERED' ? new Date() : null,
      },
    })
  }
}
