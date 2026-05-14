import Decimal from 'decimal.js'
import { Prisma } from '@/generated/prisma/client'
import { prisma } from '@/lib/prisma'
import type { CreateSaleDTO, SaleListItem, SaleWithItems } from '../sales.contract'

export class SalesService {
  static async createSale(dto: CreateSaleDTO): Promise<SaleWithItems> {
    if (!dto.items.length) throw new Error('Carrinho não pode estar vazio')
    for (const item of dto.items) {
      if (item.quantity < 1) throw new Error('Quantidade inválida')
    }

    const variantData = await Promise.all(
      dto.items.map((item) =>
        prisma.productVariant.findUniqueOrThrow({
          where: { id: item.variantId },
          include: { product: { select: { name: true } }, inventory: true },
        }),
      ),
    )

    for (let i = 0; i < dto.items.length; i++) {
      const inv = variantData[i].inventory
      if (!inv || inv.quantity < dto.items[i].quantity) {
        throw new Error(
          `Estoque insuficiente para ${variantData[i].product.name} — ${variantData[i].sku}`,
        )
      }
    }

    const totalAmount = variantData.reduce(
      (sum, v, i) =>
        sum.plus(new Decimal(dto.items[i].quantity).mul(new Decimal(v.salePrice.toString()))),
      new Decimal(0),
    )

    const paymentSum = new Decimal(dto.paymentBreakdown.pix ?? 0)
      .plus(dto.paymentBreakdown.cardCredit ?? 0)
      .plus(dto.paymentBreakdown.cardDebit ?? 0)
      .plus(dto.paymentBreakdown.cash ?? 0)

    if (!paymentSum.equals(totalAmount)) {
      throw new Error('Total do pagamento não cobre o valor da venda')
    }

    return prisma.$transaction(async (tx) => {
      const sale = await tx.sale.create({
        data: {
          totalAmount: totalAmount.toFixed(2),
          paymentBreakdown: dto.paymentBreakdown as Prisma.InputJsonValue,
          customerId: dto.customerId ?? null,
          status: 'COMPLETED',
        },
      })

      for (let i = 0; i < dto.items.length; i++) {
        const item = dto.items[i]
        const variant = variantData[i]
        const inv = variant.inventory!

        await tx.saleItem.create({
          data: {
            saleId: sale.id,
            variantId: item.variantId,
            quantity: item.quantity,
            unitPrice: variant.salePrice.toString(),
            unitCost: variant.costPrice.toString(),
          },
        })

        await tx.inventory.update({
          where: { id: inv.id },
          data: { quantity: { decrement: item.quantity } },
        })

        await tx.inventoryTransaction.create({
          data: {
            inventoryId: inv.id,
            type: 'SALE',
            quantityDelta: -item.quantity,
            note: null,
          },
        })
      }

      await tx.cashFlowEntry.create({
        data: {
          type: 'INCOME',
          amount: totalAmount.toFixed(2),
          saleId: sale.id,
        },
      })

      return tx.sale.findUniqueOrThrow({
        where: { id: sale.id },
        include: {
          items: {
            include: {
              variant: {
                include: { product: { select: { name: true } } },
              },
            },
          },
          customer: true,
          cashFlowEntry: true,
        },
      }) as Promise<SaleWithItems>
    })
  }

  static async getSaleHistory(filters?: { from?: Date; to?: Date }): Promise<SaleListItem[]> {
    const where = filters
      ? {
          createdAt: {
            gte: filters.from,
            lte: filters.to,
          },
        }
      : {}

    const sales = await prisma.sale.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { name: true } },
        _count: { select: { items: true } },
      },
    })

    return sales.map((s) => ({
      id: s.id,
      totalAmount: s.totalAmount,
      status: s.status,
      createdAt: s.createdAt,
      itemCount: s._count.items,
      customerName: s.customer?.name ?? null,
    }))
  }

  static async getSaleById(id: string): Promise<SaleWithItems> {
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            variant: {
              include: { product: { select: { name: true } } },
            },
          },
        },
        customer: true,
        cashFlowEntry: true,
      },
    })

    if (!sale) throw new Error('Venda não encontrada')

    return sale as unknown as SaleWithItems
  }
}
