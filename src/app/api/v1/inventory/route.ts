import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const variants = await prisma.productVariant.findMany({
      where: { product: { isArchived: false } },
      include: {
        product: { select: { name: true } },
        inventory: true,
      },
      orderBy: { sku: 'asc' },
    })

    const data = variants.map((v) => ({
      variantId: v.id,
      sku: v.sku,
      productName: v.product.name,
      quantity: v.inventory?.quantity ?? 0,
      minStockAlert: v.inventory?.minStockAlert ?? 3,
      isLowStock: (v.inventory?.quantity ?? 0) <= (v.inventory?.minStockAlert ?? 3),
    }))

    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}
