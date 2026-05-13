import { prisma } from '@/lib/prisma'
import type {
  AdjustStockDTO,
  InventoryListItem,
  InventoryTransactionRecord,
  LowStockAlert,
} from '../inventory.contract'

export class InventoryService {
  static async getInventoryList(): Promise<InventoryListItem[]> {
    const variants = await prisma.productVariant.findMany({
      where: { product: { isArchived: false } },
      include: {
        product: { select: { name: true } },
        inventory: true,
      },
      orderBy: [{ product: { name: 'asc' } }, { sku: 'asc' }],
    })

    return variants.map((v) => {
      const qty = v.inventory?.quantity ?? 0
      const min = v.inventory?.minStockAlert ?? 0
      const status = qty === 0 ? 'Zerado' : qty <= min ? 'Alerta' : 'Normal'
      return {
        variantId: v.id,
        inventoryId: v.inventory!.id,
        sku: v.sku,
        productName: v.product.name,
        frameColor: v.frameColor,
        lensColor: v.lensColor,
        quantity: qty,
        minStockAlert: min,
        status,
      }
    })
  }

  static async getVariantHistory(variantId: string): Promise<InventoryTransactionRecord[]> {
    const inventory = await prisma.inventory.findUnique({
      where: { variantId },
      include: {
        transactions: {
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!inventory) return []

    return inventory.transactions.map((t) => ({
      id: t.id,
      type: t.type as InventoryTransactionRecord['type'],
      quantityDelta: t.quantityDelta,
      note: t.note,
      createdAt: t.createdAt,
    }))
  }

  static async getLowStockAlerts(): Promise<LowStockAlert[]> {
    const inventories = await prisma.inventory.findMany({
      include: {
        variant: {
          include: { product: { select: { name: true, isArchived: true } } },
        },
      },
    })

    return inventories
      .filter((inv) => !inv.variant.product.isArchived && inv.quantity <= inv.minStockAlert)
      .map((inv) => ({
        variantId: inv.variantId,
        sku: inv.variant.sku,
        productName: inv.variant.product.name,
        quantity: inv.quantity,
        minStockAlert: inv.minStockAlert,
      }))
  }

  static async getZeroStockVariants(): Promise<InventoryListItem[]> {
    const all = await InventoryService.getInventoryList()
    return all.filter((item) => item.quantity === 0)
  }

  static async adjustStock(variantId: string, dto: AdjustStockDTO): Promise<void> {
    if (dto.quantity < 1) throw new Error('Quantidade deve ser maior que zero')

    const inventory = await prisma.inventory.findUniqueOrThrow({ where: { variantId } })

    const delta =
      dto.type === 'PURCHASE'
        ? dto.quantity
        : dto.sign === '-'
          ? -dto.quantity
          : dto.quantity

    const newQuantity = inventory.quantity + delta
    if (newQuantity < 0) throw new Error('Estoque insuficiente')

    await prisma.$transaction(async (tx) => {
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: newQuantity },
      })
      await tx.inventoryTransaction.create({
        data: {
          inventoryId: inventory.id,
          type: dto.type,
          quantityDelta: delta,
          note: dto.note ?? null,
        },
      })
    })
  }

  static async updateMinStockAlert(variantId: string, value: number): Promise<void> {
    if (value < 0) throw new Error('Valor mínimo de alerta não pode ser negativo')

    await prisma.inventory.update({
      where: { variantId },
      data: { minStockAlert: value },
    })
  }
}
